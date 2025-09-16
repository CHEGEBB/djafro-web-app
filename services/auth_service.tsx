/* eslint-disable @typescript-eslint/no-explicit-any */
import { account, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

// Types
export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface UserPreferences {
  $id?: string;
  userId: string;
  isOnboarded: boolean;
  favoriteGenres: string[];
  lastLogin: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
}

// Auth Service Class
class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isOnboarded: false,
  };

  constructor() {
    this.initializeAuth();
  }

  // Initialize authentication on app start
  private async initializeAuth() {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        const preferences = await this.getUserPreferences(user.$id);
        this.updateState({
          user,
          isLoading: false,
          isAuthenticated: true,
          isOnboarded: preferences?.isOnboarded || false,
        });
      } else {
        this.updateState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isOnboarded: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }
  }

  // State management
  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current auth state
  getState(): AuthState {
    return this.currentState;
  }

  // Get current user from Appwrite
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get();
      return user as AuthUser;
    } catch (error) {
      return null;
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<{ user: AuthUser; isOnboarded: boolean }> {
    try {
      this.updateState({ isLoading: true });

      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const user = await account.get() as AuthUser;
      
      // Get user preferences to check onboarding status
      const preferences = await this.getUserPreferences(user.$id);
      const isOnboarded = preferences?.isOnboarded || false;

      // Update last login
      if (preferences) {
        await this.updateUserPreferences(user.$id, {
          lastLogin: new Date().toISOString(),
        });
      }

      this.updateState({
        user,
        isLoading: false,
        isAuthenticated: true,
        isOnboarded,
      });

      return { user, isOnboarded };
    } catch (error) {
      this.updateState({ isLoading: false });
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(email: string, password: string, name: string): Promise<{ user: AuthUser; isOnboarded: boolean }> {
    try {
      this.updateState({ isLoading: true });

      // Create account
      const userId = ID.unique();
      await account.create(userId, email, password, name);
      
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const user = await account.get() as AuthUser;
      
      // Create user preferences (new users are not onboarded)
      await this.createUserPreferences(user.$id);
      
      this.updateState({
        user,
        isLoading: false,
        isAuthenticated: true,
        isOnboarded: false, // New users need onboarding
      });

      return { user, isOnboarded: false };
    } catch (error) {
      this.updateState({ isLoading: false });
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      this.updateState({ isLoading: true });
      
      await account.deleteSession('current');
      
      this.updateState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      this.updateState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }
  }

  // Check if user exists (for login/register flow)
  async checkUserExists(email: string): Promise<boolean> {
    try {
      // Try to create a password recovery to check if user exists
      // This is a workaround since Appwrite doesn't have a direct user check
      await account.createRecovery(email, 'https://dummy-url.com');
      return true;
    } catch (error: any) {
      // If user doesn't exist, Appwrite will throw an error
      if (error.code === 404 || error.message.includes('not found')) {
        return false;
      }
      // For other errors, assume user exists to be safe
      return true;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID!,
        [Query.equal('userId', userId), Query.limit(1)]
      );
      
      return response.documents.length > 0 ? response.documents[0] as UserPreferences : null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  // Create user preferences (for new users)
  async createUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const preferences = {
        userId,
        isOnboarded: false,
        favoriteGenres: [],
        lastLogin: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID!,
        ID.unique(),
        preferences
      );

      return response as UserPreferences;
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (preferences) {
        await databases.updateDocument(
          DATABASE_ID,
          process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID!,
          preferences.$id!,
          updates
        );
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Mark user as onboarded
  async completeOnboarding(userId: string, favoriteGenres: string[] = []): Promise<void> {
    try {
      await this.updateUserPreferences(userId, {
        isOnboarded: true,
        favoriteGenres,
      });

      // Update local state
      this.updateState({
        isOnboarded: true,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Send password recovery email
  async resetPassword(email: string): Promise<void> {
    try {
      await account.createRecovery(email, `${window.location.origin}/auth/reset-password`);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update password with recovery
  async updatePassword(userId: string, secret: string, password: string): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }

  // Send email verification
  async sendVerification(): Promise<void> {
    try {
      await account.createVerification(`${window.location.origin}/auth/verify-email`);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
      
      // Refresh user data
      const user = await this.getCurrentUser();
      if (user) {
        this.updateState({ user });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(name: string): Promise<void> {
    try {
      await account.updateName(name);
      
      // Refresh user data
      const user = await this.getCurrentUser();
      if (user) {
        this.updateState({ user });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Get navigation destination based on auth state
  getNavigationDestination(): string {
    const { isAuthenticated, isOnboarded } = this.currentState;
    
    if (!isAuthenticated) {
      return '/auth';
    }
    
    if (!isOnboarded) {
      return '/onboarding';
    }
    
    return '/dashboard';
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export default
export default authService;