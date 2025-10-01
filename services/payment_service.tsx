/* eslint-disable @typescript-eslint/no-explicit-any */
// services/payment_service.tsx
'use client'
import { Client, Databases, Functions, ID, Query } from 'appwrite';
import { authService } from './auth_service';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  movieId: string;
  reference: string;
  orderTrackingId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  data?: {
    reference?: string;
    orderTrackingId?: string;
    redirectUrl?: string;
    amount?: number;
    phoneNumber?: string;
    status?: string;
    alreadyPaid?: boolean;
  };
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

class PaymentService {
  private client: Client;
  private databases: Databases;
  private functions: Functions;
  private isInitialized = false;
  private userId: string | null = null;
  private authUnsubscribe: (() => void) | null = null;
  
  // Cache for payment status to reduce database queries
  private paymentCache: Map<string, boolean> = new Map();
  private cacheTimestamps: Map<string, Date> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);
    
    // Subscribe to auth state changes
    this.setupAuthSubscription();
  }

  private setupAuthSubscription(): void {
    // Subscribe to auth state changes
    this.authUnsubscribe = authService.subscribe((authState) => {
      const newUserId = authState.user?.$id || null;
      
      // If user changed, update userId and clear cache
      if (this.userId !== newUserId) {
        this.userId = newUserId;
        this.clearAllCache(); // Clear cache when user changes
      }
    });
    
    // Get initial auth state
    const currentState = authService.getState();
    this.userId = currentState.user?.$id || null;
  }

  async initialize(): Promise<void> {
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      console.error('Appwrite configuration missing');
      return;
    }

    try {
      this.client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

      // Get current user from auth service
      const authState = authService.getState();
      this.userId = authState.user?.$id || null;

      this.isInitialized = true;
      console.log('PaymentService initialized successfully', {
        userId: this.userId,
        isAuthenticated: authState.isAuthenticated
      });
    } catch (error) {
      console.error('PaymentService initialization error:', error);
    }
  }

  // Clean up subscriptions
  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }

  // Check if service is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Validates payment data before processing
  private validatePaymentData(movieId: string, userId: string): boolean {
    if (!movieId) {
      console.error('PaymentService: Movie ID is empty');
      return false;
    }
    
    if (!userId) {
      console.error('PaymentService: User ID is empty');
      return false;
    }
    
    return true;
  }

  // Error message formatting for user-friendly errors
  private getErrorMessage(error: any): string {
    if (error?.code) {
      switch (error.code) {
        case 401:
          return 'Authentication failed. Please log in again.';
        case 403:
          return 'Access denied. Please check your permissions.';
        case 404:
          return 'Payment service not found. Please contact support.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
          return 'Server error. Please try again later.';
        default:
          return error.message || 'Payment service error. Please try again.';
      }
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  // Format phone number to standard format (254XXXXXXXXX)
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces, dashes, or other formatting
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle the +254 prefix
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1); // Remove the + sign
    }
    
    // Handle 07XXXXXXXX format (convert to 2547XXXXXXXX)
    if (cleaned.startsWith('07')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // Handle 01XXXXXXXX format (convert to 2541XXXXXXXX)
    if (cleaned.startsWith('01')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  // Validate Kenyan phone number
  private isValidKenyanPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // Check if it starts with 254 and has correct length
    if (!formatted.startsWith('254') || formatted.length !== 12) {
      return false;
    }
    
    // Check if it has valid Kenyan prefixes (Safaricom: 254(7XX), Others supported by M-Pesa)
    const validPrefixes = /^254(7[0-9]|1[0-9])/;
    return validPrefixes.test(formatted);
  }

  // Cache management functions
  private isCacheValid(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    
    const isValid = (new Date().getTime() - timestamp.getTime()) < this.CACHE_DURATION;
    if (!isValid) {
      console.log('PaymentService: Cache expired for', cacheKey);
    }
    return isValid;
  }

  private clearCache(userId: string, movieId: string): void {
    const cacheKey = `${userId}_${movieId}`;
    this.paymentCache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
    console.log('PaymentService: Cleared cache for', cacheKey);
  }

  clearAllCache(): void {
    this.paymentCache.clear();
    this.cacheTimestamps.clear();
    console.log('PaymentService: Cleared all payment cache');
  }

  // Initiates a payment for a movie
  async initiatePesapalPayment(movieId: string, userId: string, phoneNumber: string): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      console.log('PaymentService: Initiating Pesapal payment for movieId:', movieId, 'userId:', userId);
      
      // Enhanced validation
      if (!this.validatePaymentData(movieId, userId)) {
        return {
          success: false,
          message: 'Invalid movie or user information provided',
        };
      }

      // Format and validate phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!this.isValidKenyanPhoneNumber(formattedPhone)) {
        return {
          success: false,
          message: 'Invalid M-Pesa phone number. Please enter a valid Kenyan mobile number.',
        };
      }

      // Check if user has already paid
      const alreadyPaid = await this.hasUserPaidForMovie(userId, movieId);
      if (alreadyPaid) {
        console.log('PaymentService: User already paid for movie');
        return {
          success: true,
          message: 'Movie already purchased',
          data: { alreadyPaid: true },
        };
      }
      
      // Prepare function payload for Pesapal
      const payload = {
        movieId: movieId,
        userId: userId,
        phoneNumber: '+' + formattedPhone, // Adding + prefix for Pesapal
        amount: Number(process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || 20),
        currency: process.env.NEXT_PUBLIC_CURRENCY || 'KES',
      };
      
      console.log('PaymentService: Pesapal payload:', payload);
      
      // Check if function ID is available
      const functionId = process.env.NEXT_PUBLIC_PESAPAL_STK_PUSH_FUNCTION_ID;
      if (!functionId) {
        console.error('PaymentService: Missing Pesapal STK Push function ID in environment variables');
        return {
          success: false,
          message: 'Payment service configuration error. Please contact support.',
        };
      }
      
      // Execute Appwrite function with explicit function ID
      const execution = await this.functions.createExecution(
        functionId,
        JSON.stringify(payload),
        false // Wait for response
      );
      
      console.log('PaymentService: Function execution status:', execution.status);
      
      if (execution.status === 'completed') {
        if (execution.responseStatusCode === 200 && execution.responseBody) {
          try {
            const jsonResponse = JSON.parse(execution.responseBody);
            console.log('PaymentService: Parsed Pesapal response:', jsonResponse);
            
            if (jsonResponse.success === true && jsonResponse.data) {
              const data = jsonResponse.data;
              const paymentStatus = data.status || 'pending';
              
              return {
                success: true,
                message: 'Pesapal payment initiated',
                data: {
                  reference: data.reference || '',
                  orderTrackingId: data.orderTrackingId || '',
                  amount: data.amount || Number(process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || 20),
                  phoneNumber: formattedPhone,
                  status: paymentStatus,
                  redirectUrl: data.redirectUrl || data.redirect_url || '',
                },
              };
            } else {
              return {
                success: false,
                message: jsonResponse.error || jsonResponse.message || 'Failed to initiate Pesapal payment',
              };
            }
          } catch (e) {
            console.error('PaymentService: JSON decode error:', e);
            console.error('PaymentService: Raw response:', execution.responseBody);
            return {
              success: false,
              message: 'Invalid response from payment service',
            };
          }
        } else {
          console.error('PaymentService: Function returned error status:', execution.responseStatusCode);
          return {
            success: false,
            message: `Payment service returned error (${execution.responseStatusCode})`,
          };
        }
      } else if (execution.status === 'failed') {
        console.error('PaymentService: Function execution failed', execution.errors);
        return {
          success: false,
          message: 'Payment service execution failed',
        };
      } else {
        console.warn('PaymentService: Function execution incomplete:', execution.status);
        return {
          success: false,
          message: 'Payment request is processing. Please try again in a moment.',
        };
      }
    } catch (error) {
      console.error('PaymentService: Error initiating Pesapal payment:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // Check if a user has paid for a specific movie
  async hasUserPaidForMovie(userId: string, movieId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!userId || !movieId) {
        console.error('PaymentService: Invalid userId or movieId provided');
        return false;
      }
      
      // Check cache first
      const cacheKey = `${userId}_${movieId}`;
      if (this.isCacheValid(cacheKey) && this.paymentCache.has(cacheKey)) {
        console.log('PaymentService: Using cached payment status for', cacheKey, ':', this.paymentCache.get(cacheKey));
        return this.paymentCache.get(cacheKey) || false;
      }
      
      console.log('PaymentService: Checking if user', userId, 'has paid for movie', movieId);
      
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.equal('movieId', movieId),
          Query.equal('status', 'completed'),
          Query.limit(1),
        ]
      );
      
      const hasPaid = response.documents.length > 0;
      console.log('PaymentService: User', userId, 'payment status for movie', movieId, ':', hasPaid);
      
      // Cache the result
      this.paymentCache.set(cacheKey, hasPaid);
      this.cacheTimestamps.set(cacheKey, new Date());
      
      return hasPaid;
    } catch (error) {
      console.error('PaymentService: Error checking payment status:', error);
      return false;
    }
  }

  // Check if current user has paid for a movie
  async hasCurrentUserPaidForMovie(movieId: string): Promise<boolean> {
    try {
      if (!this.userId) {
        return false;
      }
      
      return await this.hasUserPaidForMovie(this.userId, movieId);
    } catch (error) {
      console.error('PaymentService: Error checking current user payment:', error);
      return false;
    }
  }

  // Refresh payment status by clearing cache and checking again
  async refreshPaymentStatus(userId: string, movieId: string): Promise<boolean> {
    try {
      this.clearCache(userId, movieId);
      return await this.hasUserPaidForMovie(userId, movieId);
    } catch (error) {
      console.error('PaymentService: Error refreshing payment status:', error);
      return false;
    }
  }

  // Refresh current user's payment status
  async refreshCurrentUserPaymentStatus(movieId: string): Promise<boolean> {
    try {
      if (!this.userId) {
        return false;
      }
      
      return await this.refreshPaymentStatus(this.userId, movieId);
    } catch (error) {
      console.error('PaymentService: Error refreshing current user payment status:', error);
      return false;
    }
  }

  // Get payment by reference
  async getPaymentByReference(reference: string): Promise<Payment | null> {
    try {
      await this.ensureInitialized();
      
      if (!reference) {
        console.error('PaymentService: Invalid reference provided');
        return null;
      }
      
      console.log('PaymentService: Looking up payment with reference:', reference);
      
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('reference', reference),
          Query.limit(1),
        ]
      );
      
      if (response.documents.length === 0) {
        console.log('PaymentService: No payment found for reference:', reference);
        return null;
      }
      
      const doc = response.documents[0];
      const payment: Payment = {
        id: doc.$id,
        userId: doc.userId,
        movieId: doc.movieId,
        reference: doc.reference,
        orderTrackingId: doc.orderTrackingId,
        amount: doc.amount,
        status: doc.status,
        paymentMethod: doc.paymentMethod,
        paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
        createdAt: new Date(doc.$createdAt),
        updatedAt: new Date(doc.$updatedAt)
      };
      
      console.log('PaymentService: Found payment:', payment.status, 'for', payment.amount, 'KES');
      
      return payment;
    } catch (error) {
      console.error('PaymentService: Error fetching payment by reference:', error);
      return null;
    }
  }

  // Get all payments made by a user
  async getUserPaymentHistory(userId: string): Promise<Payment[]> {
    try {
      await this.ensureInitialized();
      
      if (!userId) {
        console.error('PaymentService: Invalid userId provided for payment history');
        return [];
      }
      
      console.log('PaymentService: Fetching payment history for user:', userId);
      
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );
      
      const payments: Payment[] = response.documents.map(doc => ({
        id: doc.$id,
        userId: doc.userId,
        movieId: doc.movieId,
        reference: doc.reference,
        orderTrackingId: doc.orderTrackingId,
        amount: doc.amount,
        status: doc.status,
        paymentMethod: doc.paymentMethod,
        paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
        createdAt: new Date(doc.$createdAt),
        updatedAt: new Date(doc.$updatedAt)
      }));
      
      console.log('PaymentService: Found', payments.length, 'payments for user', userId);
      return payments;
    } catch (error) {
      console.error('PaymentService: Error fetching payment history:', error);
      return [];
    }
  }

  // Get current user's payment history
  async getCurrentUserPaymentHistory(): Promise<Payment[]> {
    try {
      if (!this.userId) {
        return [];
      }
      
      return await this.getUserPaymentHistory(this.userId);
    } catch (error) {
      console.error('PaymentService: Error fetching current user payment history:', error);
      return [];
    }
  }

  // Get all movies the current user has purchased
  async getCurrentUserPurchasedMovieIds(): Promise<string[]> {
    try {
      if (!this.userId) {
        return [];
      }
      
      const payments = await this.getUserPaymentHistory(this.userId);
      
      return payments
        .filter(payment => payment.status === 'completed')
        .map(payment => payment.movieId)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    } catch (error) {
      console.error('PaymentService: Error getting user purchased movies:', error);
      return [];
    }
  }

  // Process payment for web
  async processPesapalPayment(movieId: string, phoneNumber: string): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      
      if (!this.userId) {
        return {
          success: false,
          message: 'Please log in to purchase movies',
        };
      }
      
      // Initiate Pesapal payment
      return await this.initiatePesapalPayment(movieId, this.userId, phoneNumber);
    } catch (error) {
      console.error('PaymentService: Error processing Pesapal payment:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // Handle payment redirect
  async handlePesapalRedirect(redirectUrl: string, movieId: string): Promise<boolean> {
    try {
      if (!redirectUrl || !movieId || !this.userId) {
        return false;
      }
      
      // For web, we'll open the redirect URL in a new window
      const width = 500;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const paymentWindow = window.open(
        redirectUrl,
        'PesapalPayment',
        `width=${width},height=${height},top=${top},left=${left}`
      );
      
      if (!paymentWindow) {
        console.error('Payment window was blocked by the browser');
        // Fallback to redirecting in the same window
        window.location.href = redirectUrl;
      }
      
      return true;
    } catch (error) {
      console.error('PaymentService: Error handling Pesapal redirect:', error);
      return false;
    }
  }

  // Verify payment status after returning from Pesapal
  async verifyPaymentStatus(reference: string, movieId: string): Promise<boolean> {
    try {
      if (!reference || !movieId || !this.userId) {
        return false;
      }
      
      // First check if payment is already marked as completed
      const isPaid = await this.refreshPaymentStatus(this.userId, movieId);
      if (isPaid) {
        return true;
      }
      
      // Try to fetch the latest payment status
      const payment = await this.getPaymentByReference(reference);
      return payment?.status === 'completed';
    } catch (error) {
      console.error('PaymentService: Error verifying payment status:', error);
      return false;
    }
  }

  // Show payment modal for web
  async showPesapalPaymentModal(movieId: string): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      
      if (!movieId) {
        return {
          success: false,
          message: 'Invalid movie selected',
        };
      }
      
      // Check if user is logged in
      if (!this.userId) {
        return {
          success: false,
          message: 'Please log in to purchase movies',
        };
      }
      
      console.log('PaymentService: Processing payment for movie:', movieId, 'by user:', this.userId);
      
      // Check if already paid
      const alreadyPaid = await this.hasUserPaidForMovie(this.userId, movieId);
      if (alreadyPaid) {
        return {
          success: true,
          message: 'You already own this movie!',
          data: { alreadyPaid: true },
        };
      }

      // This will be handled by the component that calls this method
      return {
        success: true,
        message: 'Please complete the payment process',
        data: {
          amount: Number(process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || 20),
          status: 'pending',
        }
      };
    } catch (error) {
      console.error('PaymentService: Error in showPesapalPaymentModal:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }
}

// Create a context for the payment service
interface PaymentServiceContextType {
  service: PaymentService;
  isInitialized: boolean;
  isProcessingPayment: boolean;
  paymentModalOpen: boolean;
  selectedMovieId: string | null;
  handlePaymentStart: (movieId: string) => Promise<PaymentResult>;
  handlePaymentModalClose: () => void;
  refreshPaymentStatus: (movieId: string) => Promise<boolean>;
  processPesapalPayment: (movieId: string, phoneNumber: string) => Promise<PaymentResult>;
  handlePesapalRedirect: (redirectUrl: string, movieId: string) => Promise<boolean>;
  verifyPaymentStatus: (reference: string, movieId: string) => Promise<boolean>;
}

const PaymentServiceContext = createContext<PaymentServiceContextType>({
  service: new PaymentService(),
  isInitialized: false,
  isProcessingPayment: false,
  paymentModalOpen: false,
  selectedMovieId: null,
  handlePaymentStart: async () => ({ success: false, message: 'Payment service not initialized' }),
  handlePaymentModalClose: () => {},
  refreshPaymentStatus: async () => false,
  processPesapalPayment: async () => ({ success: false, message: 'Payment service not initialized' }),
  handlePesapalRedirect: async () => false,
  verifyPaymentStatus: async () => false,
});

// Provider component
export const PaymentServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [service] = useState<PaymentService>(new PaymentService());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  useEffect(() => {
    const initializeService = async () => {
      await service.initialize();
      setIsInitialized(true);
    };

    initializeService();

    // Cleanup function to destroy service on unmount
    return () => {
      service.destroy();
    };
  }, [service]);

  const handlePaymentStart = async (movieId: string): Promise<PaymentResult> => {
    setIsProcessingPayment(true);
    setSelectedMovieId(movieId);
    setPaymentModalOpen(true);

    try {
      const result = await service.showPesapalPaymentModal(movieId);
      if (!result.success || result.data?.alreadyPaid) {
        setPaymentModalOpen(false);
      }
      setIsProcessingPayment(false);
      return result;
    } catch (error) {
      console.error('Error starting payment:', error);
      setIsProcessingPayment(false);
      setPaymentModalOpen(false);
      return {
        success: false,
        message: 'Failed to start payment process. Please try again.'
      };
    }
  };

  const handlePaymentModalClose = () => {
    setPaymentModalOpen(false);
    setSelectedMovieId(null);
  };

  const refreshPaymentStatus = async (movieId: string): Promise<boolean> => {
    return await service.refreshCurrentUserPaymentStatus(movieId);
  };

  const processPesapalPayment = async (movieId: string, phoneNumber: string): Promise<PaymentResult> => {
    setIsProcessingPayment(true);
    try {
      const result = await service.processPesapalPayment(movieId, phoneNumber);
      setIsProcessingPayment(false);
      return result;
    } catch (error) {
      setIsProcessingPayment(false);
      console.error('Error processing payment:', error);
      return {
        success: false,
        message: 'Failed to process payment. Please try again.'
      };
    }
  };

  const handlePesapalRedirect = async (redirectUrl: string, movieId: string): Promise<boolean> => {
    setPaymentModalOpen(false);
    return await service.handlePesapalRedirect(redirectUrl, movieId);
  };

  const verifyPaymentStatus = async (reference: string, movieId: string): Promise<boolean> => {
    return await service.verifyPaymentStatus(reference, movieId);
  };

  return (
    <PaymentServiceContext.Provider value={{ 
      service, 
      isInitialized, 
      isProcessingPayment,
      paymentModalOpen,
      selectedMovieId,
      handlePaymentStart,
      handlePaymentModalClose,
      refreshPaymentStatus,
      processPesapalPayment,
      handlePesapalRedirect,
      verifyPaymentStatus
    }}>
      {children}
    </PaymentServiceContext.Provider>
  );
};

// Hook to use the payment service
export const usePaymentService = () => useContext(PaymentServiceContext);

export default PaymentService;