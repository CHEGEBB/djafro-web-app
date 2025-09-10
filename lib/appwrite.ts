/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

// Initialize the Appwrite client
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
export const COLLECTIONS = {
  MOVIES: process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
  USERS: process.env.NEXT_PUBLIC_USERS_COLLECTION_ID!,
  SUBSCRIPTIONS: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_COLLECTION_ID!,
  DRIVE_INSTANCES: process.env.NEXT_PUBLIC_DRIVE_INSTANCES_COLLECTION_ID!,
  ANALYTICS: process.env.NEXT_PUBLIC_ANALYTICS_COLLECTION_ID!,
  USER_LIBRARY: process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
};

export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_MEDIA_BUCKET_ID!;

// Helper functions for common operations
export const appwriteHelpers = {
  // Get all movies
  getMovies: async (limit = 50, offset = 0) => {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MOVIES,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
      );
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Get featured movies
  getFeaturedMovies: async () => {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MOVIES,
        [Query.equal('featured', true), Query.limit(5)]
      );
    } catch (error) {
      console.error('Error fetching featured movies:', error);
      throw error;
    }
  },

  // Get movies by genre
  getMoviesByGenre: async (genre: string, limit = 20) => {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MOVIES,
        [Query.equal('genres', genre), Query.limit(limit)]
      );
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  // Search movies
  searchMovies: async (query: string, limit = 20) => {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MOVIES,
        [Query.search('title', query), Query.limit(limit)]
      );
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  // Get single movie
  getMovie: async (movieId: string) => {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MOVIES,
        movieId
      );
    } catch (error) {
      console.error('Error fetching movie:', error);
      throw error;
    }
  },

  // User authentication helpers
  getCurrentUser: async () => {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  // Create user session
  createSession: async (email: string, password: string) => {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Create user account
  createAccount: async (email: string, password: string, name: string) => {
    try {
      const userId = ID.unique();
      return await account.create(userId, email, password, name);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Logout user
  deleteSession: async () => {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  // Get user library
  getUserLibrary: async (userId: string) => {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_LIBRARY,
        [Query.equal('userId', userId)]
      );
    } catch (error) {
      console.error('Error fetching user library:', error);
      throw error;
    }
  }
};

// Video URL reconstruction service
export const videoService = {
  // Reconstruct video URLs from Appwrite data
  getStreamingUrl: (movie: any): string => {
    // Priority: Bunny CDN -> YouTube -> DailyMotion
    if (movie.bunnyUrl) {
      return movie.bunnyUrl;
    } else if (movie.youtubeUrl) {
      return `https://www.youtube.com/embed/${movie.youtubeUrl}?autoplay=1&mute=1`;
    } else if (movie.dailymotionUrl) {
      return `https://www.dailymotion.com/embed/video/${movie.dailymotionUrl}?autoplay=1&mute=1`;
    }
    return '';
  },

  // Get poster image URL
  getPosterUrl: (movie: any): string => {
    if (movie.posterUrl) {
      return movie.posterUrl;
    }
    // Fallback to a default poster
    return '/images/default-poster.jpg';
  },

  // Get thumbnail URL
  getThumbnailUrl: (movie: any): string => {
    if (movie.thumbnailUrl) {
      return movie.thumbnailUrl;
    }
    // Fallback from poster
    return videoService.getPosterUrl(movie);
  },

  // Obfuscate video URL for security
  obfuscateUrl: (videoUrl: string, userId: string = 'anonymous'): string => {
    const timestamp = Date.now();
    // Simple obfuscation - in production, use proper encryption
    const hash = btoa(`${videoUrl}-${userId}-${timestamp}`);
    return `/api/stream/${encodeURIComponent(hash)}?t=${timestamp}`;
  }
};

// Export types for TypeScript
export interface Movie {
  $id: string;
  title: string;
  description: string;
  releaseYear: number;
  rating: number;
  genres: string[];
  duration: number;
  posterUrl?: string;
  thumbnailUrl?: string;
  bunnyUrl?: string;
  youtubeUrl?: string;
  dailymotionUrl?: string;
  featured?: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  $createdAt: string;
  $updatedAt: string;
}