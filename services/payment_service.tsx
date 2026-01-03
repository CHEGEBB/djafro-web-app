/* eslint-disable @typescript-eslint/no-explicit-any */
// services/payment_service.tsx
'use client'
import { Client, Databases, Functions, Query } from 'appwrite';
import { authService } from './auth_service';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  movieId: string;
  movieIds?: string[];
  reference: string;
  invoiceId?: string;
  checkoutId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentType?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  data?: {
    reference?: string;
    invoiceId?: string;
    checkoutId?: string;
    amount?: number;
    phoneNumber?: string;
    status?: string;
    alreadyPaid?: boolean;
    paymentType?: string;
    moviesCount?: number;
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
        this.clearAllCache();
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

  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

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

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    }
    
    if (cleaned.startsWith('07')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('01')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  private isValidKenyanPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    if (!formatted.startsWith('254') || formatted.length !== 12) {
      return false;
    }
    
    const validPrefixes = /^254(7[0-9]|1[0-9])/;
    return validPrefixes.test(formatted);
  }

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

  async initiateIntasendSTKPush(
    movieId: string, 
    userId: string, 
    phoneNumber: string,
    customAmount?: number,
    movieIds?: string[],
    offerReference?: string
  ): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      console.log('PaymentService: Initiating Intasend STK Push for movieId:', movieId, 'userId:', userId, 'phone:', phoneNumber);
      
      if (!this.validatePaymentData(movieId, userId)) {
        return {
          success: false,
          message: 'Invalid movie or user information provided',
        };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!this.isValidKenyanPhoneNumber(formattedPhone)) {
        return {
          success: false,
          message: 'Invalid M-Pesa phone number. Please enter a valid Kenyan mobile number.',
        };
      }

      const alreadyPaid = await this.hasUserPaidForMovie(userId, movieId);
      if (alreadyPaid) {
        console.log('PaymentService: User already paid for movie');
        return {
          success: true,
          message: 'Movie already purchased',
          data: { alreadyPaid: true },
        };
      }
      
      const actualAmount = customAmount ?? Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10);
      const actualMovieIds = movieIds ?? [movieId];
      
      const payload = {
        movieId: movieId,
        movieIds: actualMovieIds,
        userId: userId,
        phoneNumber: formattedPhone,
        amount: actualAmount,
        offerType: movieIds && movieIds.length > 1 ? 'bundle' : 'single',
        offerReference: offerReference,
      };
      
      console.log('PaymentService: Intasend STK Push payload:', JSON.stringify(payload));
      
      const functionId = process.env.NEXT_PUBLIC_INTASEND_STK_PUSH_FUNCTION_ID;
      if (!functionId) {
        console.error('PaymentService: Missing Intasend STK Push function ID');
        return {
          success: false,
          message: 'Payment service configuration error. Please contact support.',
        };
      }
      
      const execution = await this.functions.createExecution(
        functionId,
        JSON.stringify(payload),
        false
      );
      
      console.log('PaymentService: Function execution status:', execution.status);
      console.log('PaymentService: Function response:', execution.responseBody);
      
      if (execution.status === 'completed') {
        if (execution.responseStatusCode === 200 && execution.responseBody) {
          try {
            const jsonResponse = JSON.parse(execution.responseBody);
            console.log('PaymentService: Parsed Intasend STK Push response:', jsonResponse);
            
            if (jsonResponse.success === true && jsonResponse.data) {
              const data = jsonResponse.data;
              const paymentStatus = data.status || 'pending';
              
              return {
                success: true,
                message: jsonResponse.message || 'STK Push sent. Please check your phone to enter M-Pesa PIN.',
                data: {
                  reference: data.reference || '',
                  invoiceId: data.invoiceId || '',
                  checkoutId: data.checkoutId || '',
                  amount: data.amount || actualAmount,
                  phoneNumber: formattedPhone,
                  status: paymentStatus,
                  paymentType: data.paymentType || 'single',
                  moviesCount: data.moviesCount || 1
                },
              };
            } else {
              return {
                success: false,
                message: jsonResponse.error || jsonResponse.message || 'Failed to initiate STK Push',
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
      console.error('PaymentService: Error initiating Intasend STK Push:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async hasUserPaidForMovie(userId: string, movieId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!userId || !movieId) {
        console.error('PaymentService: Invalid userId or movieId provided');
        return false;
      }
      
      const cacheKey = `${userId}_${movieId}`;
      if (this.isCacheValid(cacheKey) && this.paymentCache.has(cacheKey)) {
        console.log('PaymentService: Using cached payment status for', cacheKey, ':', this.paymentCache.get(cacheKey));
        return this.paymentCache.get(cacheKey) || false;
      }
      
      console.log('PaymentService: Checking if user', userId, 'has paid for movie', movieId);
      
      const directResponse = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.equal('movieId', movieId),
          Query.equal('status', 'completed'),
          Query.limit(1),
        ]
      );
      
      if (directResponse.documents.length > 0) {
        this.paymentCache.set(cacheKey, true);
        this.cacheTimestamps.set(cacheKey, new Date());
        console.log('PaymentService: Found direct payment for movie', movieId);
        return true;
      }
      
      const bundleResponse = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'completed'),
        ]
      );
      
      for (const doc of bundleResponse.documents) {
        const movieIdsField = doc.movieIds;
        
        if (movieIdsField) {
          let movieIdsList: string[] = [];
          
          if (Array.isArray(movieIdsField)) {
            movieIdsList = movieIdsField;
          } else if (typeof movieIdsField === 'string') {
            try {
              const decoded = JSON.parse(movieIdsField);
              if (Array.isArray(decoded)) {
                movieIdsList = decoded;
              }
            } catch (_) {}
          }
          
          if (movieIdsList.includes(movieId)) {
            this.paymentCache.set(cacheKey, true);
            this.cacheTimestamps.set(cacheKey, new Date());
            console.log('PaymentService: Found bundle payment including movie', movieId);
            return true;
          }
        }
      }
      
      this.paymentCache.set(cacheKey, false);
      this.cacheTimestamps.set(cacheKey, new Date());
      console.log('PaymentService: No payment found for movie', movieId);
      return false;
    } catch (error) {
      console.error('PaymentService: Error checking payment status:', error);
      return false;
    }
  }

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

  async refreshPaymentStatus(userId: string, movieId: string): Promise<boolean> {
    try {
      this.clearCache(userId, movieId);
      return await this.hasUserPaidForMovie(userId, movieId);
    } catch (error) {
      console.error('PaymentService: Error refreshing payment status:', error);
      return false;
    }
  }

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
      
      let movieIdsList: string[] | undefined;
      if (doc.movieIds) {
        if (Array.isArray(doc.movieIds)) {
          movieIdsList = doc.movieIds;
        } else if (typeof doc.movieIds === 'string') {
          try {
            const decoded = JSON.parse(doc.movieIds);
            if (Array.isArray(decoded)) {
              movieIdsList = decoded;
            }
          } catch (_) {}
        }
      }
      
      const payment: Payment = {
        id: doc.$id,
        userId: doc.userId,
        movieId: doc.movieId,
        movieIds: movieIdsList,
        reference: doc.reference,
        invoiceId: doc.invoiceId,
        checkoutId: doc.checkoutId,
        amount: doc.amount,
        status: doc.status,
        paymentMethod: doc.paymentMethod,
        paymentType: doc.paymentType,
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
      
      const payments: Payment[] = response.documents.map(doc => {
        let movieIdsList: string[] | undefined;
        if (doc.movieIds) {
          if (Array.isArray(doc.movieIds)) {
            movieIdsList = doc.movieIds;
          } else if (typeof doc.movieIds === 'string') {
            try {
              const decoded = JSON.parse(doc.movieIds);
              if (Array.isArray(decoded)) {
                movieIdsList = decoded;
              }
            } catch (_) {}
          }
        }
        
        return {
          id: doc.$id,
          userId: doc.userId,
          movieId: doc.movieId,
          movieIds: movieIdsList,
          reference: doc.reference,
          invoiceId: doc.invoiceId,
          checkoutId: doc.checkoutId,
          amount: doc.amount,
          status: doc.status,
          paymentMethod: doc.paymentMethod,
          paymentType: doc.paymentType,
          paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(doc.$updatedAt)
        };
      });
      
      console.log('PaymentService: Found', payments.length, 'payments for user', userId);
      return payments;
    } catch (error) {
      console.error('PaymentService: Error fetching payment history:', error);
      return [];
    }
  }

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

  async getCurrentUserPurchasedMovieIds(): Promise<string[]> {
    try {
      if (!this.userId) {
        return [];
      }
      
      await this.ensureInitialized();
      
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PAYMENTS_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.equal('status', 'completed'),
        ]
      );
      
      const purchasedMovies = new Set<string>();
      
      for (const doc of response.documents) {
        if (doc.movieId) {
          purchasedMovies.add(doc.movieId);
        }
        
        if (doc.movieIds) {
          let movieIdsList: string[] = [];
          
          if (Array.isArray(doc.movieIds)) {
            movieIdsList = doc.movieIds;
          } else if (typeof doc.movieIds === 'string') {
            try {
              const decoded = JSON.parse(doc.movieIds);
              if (Array.isArray(decoded)) {
                movieIdsList = decoded;
              }
            } catch (_) {}
          }
          
          movieIdsList.forEach(id => purchasedMovies.add(id));
        }
      }
      
      console.log('PaymentService: User has purchased', purchasedMovies.size, 'movies');
      return Array.from(purchasedMovies);
    } catch (error) {
      console.error('PaymentService: Error getting user purchased movies:', error);
      return [];
    }
  }

  async processIntasendPayment(movieId: string, phoneNumber: string, customAmount?: number, movieIds?: string[], offerReference?: string): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      
      if (!this.userId) {
        return {
          success: false,
          message: 'Please log in to purchase movies',
        };
      }
      
      return await this.initiateIntasendSTKPush(movieId, this.userId, phoneNumber, customAmount, movieIds, offerReference);
    } catch (error) {
      console.error('PaymentService: Error processing Intasend payment:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async verifyPaymentStatus(reference: string, movieId: string): Promise<boolean> {
    try {
      if (!reference || !movieId || !this.userId) {
        return false;
      }
      
      const isPaid = await this.refreshPaymentStatus(this.userId, movieId);
      if (isPaid) {
        return true;
      }
      
      const payment = await this.getPaymentByReference(reference);
      return payment?.status === 'completed';
    } catch (error) {
      console.error('PaymentService: Error verifying payment status:', error);
      return false;
    }
  }

  async showPaymentModal(movieId: string, customAmount?: number, movieIds?: string[], offerReference?: string): Promise<PaymentResult> {
    try {
      await this.ensureInitialized();
      
      if (!movieId) {
        return {
          success: false,
          message: 'Invalid movie selected',
        };
      }
      
      if (!this.userId) {
        return {
          success: false,
          message: 'Please log in to purchase movies',
        };
      }
      
      console.log('PaymentService: Processing payment for movie:', movieId, 'by user:', this.userId);
      
      const alreadyPaid = await this.hasUserPaidForMovie(this.userId, movieId);
      if (alreadyPaid) {
        return {
          success: true,
          message: 'You already own this movie!',
          data: { alreadyPaid: true },
        };
      }

      return {
        success: true,
        message: 'Please complete the payment process',
        data: {
          amount: customAmount ?? Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10),
          status: 'pending',
          paymentType: movieIds && movieIds.length > 1 ? 'bundle' : 'single',
          moviesCount: movieIds ? movieIds.length : 1
        }
      };
    } catch (error) {
      console.error('PaymentService: Error in showPaymentModal:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async verifyBundleUnlocked(userId: string, movieIds: string[]): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      console.log('🔍 Verifying bundle unlock for', userId, 'movies:', movieIds);
      
      for (const movieId of movieIds) {
        const libraryCheck = await this.databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
          [
            Query.equal('userId', userId),
            Query.equal('movieId', movieId),
            Query.limit(1),
          ]
        );
        
        if (libraryCheck.documents.length === 0) {
          console.log('❌ Movie', movieId, 'not found in user library');
          return false;
        }
      }
      
      console.log('✅ All bundle movies verified in user library');
      return true;
    } catch (error) {
      console.error('❌ Error verifying bundle:', error);
      return false;
    }
  }

  async forceRefreshLibrary(userId: string): Promise<void> {
    try {
      this.paymentCache.clear();
      this.cacheTimestamps.clear();
      
      console.log('🔄 Force refreshed library cache for user:', userId);
    } catch (error) {
      console.error('❌ Error force refreshing library:', error);
    }
  }

  async getVerifiedPurchasedMovies(userId: string): Promise<string[]> {
    try {
      await this.ensureInitialized();
      
      const library = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.limit(1000),
        ]
      );
      
      const movieIds = library.documents.map(doc => doc.movieId as string);
      console.log('✅ Verified', movieIds.length, 'movies in user library');
      
      return movieIds;
    } catch (error) {
      console.error('❌ Error getting verified purchases:', error);
      return [];
    }
  }
}

interface PaymentServiceContextType {
  service: PaymentService;
  isInitialized: boolean;
  isProcessingPayment: boolean;
  paymentModalOpen: boolean;
  selectedMovieId: string | null;
  handlePaymentStart: (movieId: string, customAmount?: number, movieIds?: string[], offerReference?: string) => Promise<PaymentResult>;
  handlePaymentModalClose: () => void;
  refreshPaymentStatus: (movieId: string) => Promise<boolean>;
  processIntasendPayment: (movieId: string, phoneNumber: string, customAmount?: number, movieIds?: string[], offerReference?: string) => Promise<PaymentResult>;
  verifyPaymentStatus: (reference: string, movieId: string) => Promise<boolean>;
  verifyBundleUnlocked: (userId: string, movieIds: string[]) => Promise<boolean>;
  forceRefreshLibrary: (userId: string) => Promise<void>;
  getVerifiedPurchasedMovies: (userId: string) => Promise<string[]>;
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
  processIntasendPayment: async () => ({ success: false, message: 'Payment service not initialized' }),
  verifyPaymentStatus: async () => false,
  verifyBundleUnlocked: async () => false,
  forceRefreshLibrary: async () => {},
  getVerifiedPurchasedMovies: async () => [],
});

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

    return () => {
      service.destroy();
    };
  }, [service]);

  const handlePaymentStart = async (movieId: string, customAmount?: number, movieIds?: string[], offerReference?: string): Promise<PaymentResult> => {
    setIsProcessingPayment(true);
    setSelectedMovieId(movieId);
    setPaymentModalOpen(true);

    try {
      const result = await service.showPaymentModal(movieId, customAmount, movieIds, offerReference);
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

  const processIntasendPayment = async (movieId: string, phoneNumber: string, customAmount?: number, movieIds?: string[], offerReference?: string): Promise<PaymentResult> => {
    setIsProcessingPayment(true);
    try {
      const result = await service.processIntasendPayment(movieId, phoneNumber, customAmount, movieIds, offerReference);
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

  const verifyPaymentStatus = async (reference: string, movieId: string): Promise<boolean> => {
    return await service.verifyPaymentStatus(reference, movieId);
  };

  const verifyBundleUnlocked = async (userId: string, movieIds: string[]): Promise<boolean> => {
    return await service.verifyBundleUnlocked(userId, movieIds);
  };

  const forceRefreshLibrary = async (userId: string): Promise<void> => {
    return await service.forceRefreshLibrary(userId);
  };

  const getVerifiedPurchasedMovies = async (userId: string): Promise<string[]> => {
    return await service.getVerifiedPurchasedMovies(userId);
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
      processIntasendPayment,
      verifyPaymentStatus,
      verifyBundleUnlocked,
      forceRefreshLibrary,
      getVerifiedPurchasedMovies
    }}>
      {children}
    </PaymentServiceContext.Provider>
  );
};

export const usePaymentService = () => useContext(PaymentServiceContext);

export default PaymentService;