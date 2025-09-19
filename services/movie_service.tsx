/* eslint-disable @typescript-eslint/no-explicit-any */
// services/movie_service.tsx
'use client'
import { Client, Databases, ID, Query, Models } from 'appwrite';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState, AuthUser } from './auth_service';

// Define types
export type Movie = {
  $createdAt: any;
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  rating: number;
  year: string;
  duration: string;
  genres: string[];
  isPremium: boolean;
  videoUrl: string;
  videoUrls: Record<string, string>;
  streamingHeaders: Record<string, string>;
  isReady: boolean;
  viewCount?: number;
  downloadCount?: number;
  progress?: number;
  userRating?: number;
  isWishlisted?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
};

// Video source types
const SOURCE_BUNNY = 'bunny';
const SOURCE_YOUTUBE = 'youtube';
const SOURCE_DAILYMOTION = 'dailymotion';

class MovieService {
  private client: Client;
  private databases: Databases;
  private isInitialized = false;
  private userId: string | null = null;
  private authUnsubscribe: (() => void) | null = null;
  
  // Cache for movie lists
  private movieListCache: Record<string, Movie[]> = {};
  private cacheExpiry: Record<string, Date> = {};
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    // Subscribe to auth state changes
    this.setupAuthSubscription();
  }

  private setupAuthSubscription(): void {
    // Subscribe to auth state changes
    this.authUnsubscribe = authService.subscribe((authState: AuthState) => {
      const newUserId = authState.user?.$id || null;
      
      // If user changed, update userId and clear cache
      if (this.userId !== newUserId) {
        this.userId = newUserId;
        this.clearCache(); // Clear cache when user changes
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

      // Get current user from auth service instead of directly from client
      const authState = authService.getState();
      this.userId = authState.user?.$id || null;

      this.isInitialized = true;
      console.log('MovieService initialized successfully', {
        userId: this.userId,
        isAuthenticated: authState.isAuthenticated
      });
    } catch (error) {
      console.error('MovieService initialization error:', error);
    }
  }

  // Clean up subscriptions
  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }

  // Get current user info
  getCurrentUser(): AuthUser | null {
    const authState = authService.getState();
    return authState.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const authState = authService.getState();
    return authState.isAuthenticated;
  }

  // Video URL processing functions
  private extractBunnyVideoInfo(url: string): Record<string, string> {
    try {
      // Handle iframe URLs
      if (url.includes('iframe.mediadelivery.net/play/')) {
        const uri = new URL(url);
        const segments = uri.pathname.split('/');
        
        if (segments.length >= 4 && segments[1] === 'play') {
          const libraryId = segments[2];
          const videoId = segments[3];
          
          return {
            libraryId,
            videoId,
            pullZone: `vz-${libraryId}-17b.b-cdn.net`,
          };
        }
      }
      
      // Handle direct CDN URLs
      else if (url.includes('b-cdn.net')) {
        const uri = new URL(url);
        const host = uri.hostname;
        const pathSegments = uri.pathname.split('/').filter(Boolean);
        
        if (pathSegments.length > 0) {
          const videoId = pathSegments[0].replace(/\.(mp4|m3u8)$/, '');
          
          // Extract library ID from hostname
          const libraryMatch = host.match(/vz-([a-f0-9-]+)-/);
          const libraryId = libraryMatch?.[1] || '';
          
          return {
            libraryId,
            videoId,
            pullZone: host,
          };
        }
      }
      
      // Handle embed URLs
      else if (url.includes('iframe.mediadelivery.net/embed/')) {
        const uri = new URL(url);
        const segments = uri.pathname.split('/');
        
        if (segments.length >= 4 && segments[1] === 'embed') {
          const libraryId = segments[2];
          const videoId = segments[3];
          
          return {
            libraryId,
            videoId,
            pullZone: `vz-${libraryId}-17b.b-cdn.net`,
          };
        }
      }
    } catch (e) {
      console.error('Error extracting video info:', e);
    }
    
    return {};
  }

  private detectVideoSource(url: string): { type: string; url: string; videoId?: string } {
    if (!url) {
      return { type: '', url: '' };
    }
    
    const normalizedUrl = url.trim();
    
    // Check for Bunny Stream URLs
    if (normalizedUrl.endsWith('.m3u8') || normalizedUrl.includes('b-cdn.net') || normalizedUrl.includes('mediadelivery.net')) {
      return { type: SOURCE_BUNNY, url: normalizedUrl };
    }
    
    // Check for YouTube URLs
    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
      let videoId = '';
      
      if (normalizedUrl.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(normalizedUrl);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (normalizedUrl.includes('youtu.be/')) {
        const urlObj = new URL(normalizedUrl);
        videoId = urlObj.pathname.split('/').pop() || '';
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
        videoId = normalizedUrl;
      }
      
      if (videoId) {
        return { type: SOURCE_YOUTUBE, url: normalizedUrl, videoId };
      }
    }
    
    // Check for Dailymotion URLs
    if (normalizedUrl.includes('dailymotion.com') || normalizedUrl.includes('dai.ly/')) {
      let videoId = '';
      
      if (normalizedUrl.includes('dailymotion.com/embed/video/')) {
        const segments = new URL(normalizedUrl).pathname.split('/');
        videoId = segments[segments.length - 1];
      } else if (normalizedUrl.includes('dai.ly/')) {
        const segments = new URL(normalizedUrl).pathname.split('/');
        videoId = segments[segments.length - 1];
      }
      
      if (videoId) {
        return { type: SOURCE_DAILYMOTION, url: normalizedUrl, videoId };
      }
    }
    
    // Default to Bunny Stream
    return { type: SOURCE_BUNNY, url: normalizedUrl };
  }

  private async formatVideoUrls(baseUrl: string): Promise<Record<string, string>> {
    if (!baseUrl) {
      return {};
    }

    try {
      const sourceInfo = this.detectVideoSource(baseUrl);
      const sourceType = sourceInfo.type;
      
      // Handle YouTube URLs
      if (sourceType === SOURCE_YOUTUBE) {
        const videoId = sourceInfo.videoId || '';
        
        return {
          youtube: `https://www.youtube.com/watch?v=${videoId}`,
          original: baseUrl,
          sourceType: SOURCE_YOUTUBE,
        };
      }
      
      // Handle Dailymotion URLs
      else if (sourceType === SOURCE_DAILYMOTION) {
        const videoId = sourceInfo.videoId || '';
        
        // Format embed URL properly like your mobile version
        const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
        
        return {
          dailymotion: embedUrl,
          embed: embedUrl,
          original: baseUrl,
          sourceType: SOURCE_DAILYMOTION,
        };
      }
      
      // Handle Bunny.net URLs
      else {
        // If it's already a direct CDN URL, use it
        if (baseUrl.includes('b-cdn.net')) {
          const videoUrls: Record<string, string> = {};
          
          // If it's an HLS playlist URL, use it directly
          if (baseUrl.includes('playlist.m3u8')) {
            videoUrls['hls'] = baseUrl;
            videoUrls['original'] = baseUrl;
            videoUrls['sourceType'] = SOURCE_BUNNY;
            
            // Try to construct MP4 URLs from the same base
            const baseUrlWithoutFile = baseUrl.replace('/playlist.m3u8', '');
            videoUrls['1080p'] = `${baseUrlWithoutFile}/play_1080p.mp4`;
            videoUrls['720p'] = `${baseUrlWithoutFile}/play_720p.mp4`;
            videoUrls['480p'] = `${baseUrlWithoutFile}/play_480p.mp4`;
            videoUrls['360p'] = `${baseUrlWithoutFile}/play_360p.mp4`;
          } 
          // If it's an MP4 URL, use it directly
          else if (baseUrl.includes('.mp4')) {
            videoUrls['original'] = baseUrl;
            videoUrls['sourceType'] = SOURCE_BUNNY;
            
            // Try to construct other quality URLs
            if (baseUrl.includes('play_720p.mp4')) {
              videoUrls['720p'] = baseUrl;
              const baseUrlWithoutQuality = baseUrl.replace('play_720p.mp4', '');
              videoUrls['1080p'] = `${baseUrlWithoutQuality}play_1080p.mp4`;
              videoUrls['480p'] = `${baseUrlWithoutQuality}play_480p.mp4`;
              videoUrls['360p'] = `${baseUrlWithoutQuality}play_360p.mp4`;
              videoUrls['hls'] = `${baseUrlWithoutQuality}playlist.m3u8`;
            } else {
              videoUrls['720p'] = baseUrl;
            }
          } else {
            videoUrls['original'] = baseUrl;
            videoUrls['sourceType'] = SOURCE_BUNNY;
          }
          
          return videoUrls;
        }
        
        // For iframe or embed URLs, try extraction
        const videoInfo = this.extractBunnyVideoInfo(baseUrl);
        if (Object.keys(videoInfo).length === 0) {
          return { original: baseUrl, sourceType: SOURCE_BUNNY };
        }
        
        const { libraryId, videoId, pullZone } = videoInfo;
        
        // Generate video URLs like your mobile version
        const videoUrls: Record<string, string> = {
          sourceType: SOURCE_BUNNY,
          original: baseUrl,
        };
        
        // For web, prefer MP4 over HLS due to better browser support
        if (typeof window !== 'undefined') {
          videoUrls['720p'] = `https://${pullZone}/${videoId}/play_720p.mp4`;
          videoUrls['480p'] = `https://${pullZone}/${videoId}/play_480p.mp4`;
          videoUrls['360p'] = `https://${pullZone}/${videoId}/play_360p.mp4`;
          videoUrls['1080p'] = `https://${pullZone}/${videoId}/play_1080p.mp4`;
          videoUrls['hls'] = `https://${pullZone}/${videoId}/playlist.m3u8`;
        }
        
        return videoUrls;
      }
      
    } catch (e) {
      console.error('Error formatting video URLs:', e);
      return { original: baseUrl, sourceType: SOURCE_BUNNY };
    }
  }

  private getStreamingHeaders(videoUrl: string): Record<string, string> {
    const sourceInfo = this.detectVideoSource(videoUrl);
    const sourceType = sourceInfo.type;
    
    // For YouTube and Dailymotion, no special headers needed
    if (sourceType === SOURCE_YOUTUBE || sourceType === SOURCE_DAILYMOTION) {
      return {};
    }
    
    // For Bunny Stream
    if (videoUrl.includes('b-cdn.net') || videoUrl.includes('bunnycdn.com')) {
      return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Referer': 'https://iframe.mediadelivery.net/',
        'Origin': 'https://iframe.mediadelivery.net',
      };
    }
    
    // For other sources, return minimal headers
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
  }

  // Main method to fetch all movies
  async getAllMovies(options: {
    offset?: number;
    limit?: number;
    genre?: string;
    sortBy?: string;
    ascending?: boolean;
  } = {}): Promise<Movie[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      offset = 0,
      limit = 50,
      genre,
      sortBy = 'title',
      ascending = true
    } = options;

    try {
      const queries: string[] = [];

      // Add genre filter if specified
      if (genre && genre !== 'All') {
        queries.push(Query.equal('genre', [genre]));
      }

      // Add sorting
      if (ascending) {
        queries.push(Query.orderAsc(sortBy));
      } else {
        queries.push(Query.orderDesc(sortBy));
      }

      // Add pagination
      queries.push(Query.offset(offset));
      queries.push(Query.limit(limit));

      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        queries
      );

      const movies = await this.processMovieDocumentsAsync(response.documents);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        return await this.enhanceMoviesWithUserData(movies);
      }
      
      return movies;
    } catch (error) {
      console.error('Error fetching all movies:', error);
      return [];
    }
  }

  // Fetch trending movies
  async getTrendingMovies(): Promise<Movie[]> {
    const cacheKey = 'trending_movies';
    
    // Check cache first
    if (this.movieListCache[cacheKey]) {
      const expiry = this.cacheExpiry[cacheKey];
      if (expiry && expiry > new Date()) {
        return [...this.movieListCache[cacheKey]];
      }
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.equal('is_trending', true),
          Query.limit(15)
        ]
      );

      let result = await this.processMovieDocumentsAsync(response.documents);
      
      // If not enough trending movies are marked, fallback to rating-based sorting
      if (result.length < 5) {
        const ratingResponse = await this.databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
          [
            Query.orderDesc('rating'),
            Query.limit(15)
          ]
        );
        
        result = await this.processMovieDocumentsAsync(ratingResponse.documents);
      }
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        result = await this.enhanceMoviesWithUserData(result);
      }
      
      // Cache the result
      this.movieListCache[cacheKey] = result;
      this.cacheExpiry[cacheKey] = new Date(Date.now() + this.CACHE_DURATION);
      
      return result;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return [];
    }
  }

  // Fetch new releases
  async getNewReleases(): Promise<Movie[]> {
    const cacheKey = 'new_releases';
    
    // Check cache first
    if (this.movieListCache[cacheKey]) {
      const expiry = this.cacheExpiry[cacheKey];
      if (expiry && expiry > new Date()) {
        return [...this.movieListCache[cacheKey]];
      }
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(12)
        ]
      );

      let result = await this.processMovieDocumentsAsync(response.documents);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        result = await this.enhanceMoviesWithUserData(result);
      }
      
      // Cache the result
      this.movieListCache[cacheKey] = result;
      this.cacheExpiry[cacheKey] = new Date(Date.now() + this.CACHE_DURATION);
      
      return result;
    } catch (error) {
      console.error('Error fetching new releases:', error);
      return [];
    }
  }

  // Fetch movies by genre
  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const cacheKey = `genre_${genre}`;
    
    // Check cache first
    if (this.movieListCache[cacheKey]) {
      const expiry = this.cacheExpiry[cacheKey];
      if (expiry && expiry > new Date()) {
        return [...this.movieListCache[cacheKey]];
      }
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
  
    try {
      // Use contains instead of search for genre
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.contains('genre', genre),
          Query.limit(15)
        ]
      );
  
      let result = await this.processMovieDocumentsAsync(response.documents);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        result = await this.enhanceMoviesWithUserData(result);
      }
      
      // Cache the result
      this.movieListCache[cacheKey] = result;
      this.cacheExpiry[cacheKey] = new Date(Date.now() + this.CACHE_DURATION);
      
      return result;
    } catch (error) {
      console.error(`Error fetching ${genre} movies:`, error);
      return [];
    }
  }

  // Fetch featured movies
  async getFeaturedMovies(): Promise<Movie[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.equal('is_featured', true),
          Query.limit(5)
        ]
      );

      let result = await this.processMovieDocumentsAsync(response.documents);
      
      // If not enough featured movies, fall back to high rated movies
      if (result.length < 3) {
        const ratingResponse = await this.databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
          [
            Query.orderDesc('rating'),
            Query.limit(5)
          ]
        );
        
        result = await this.processMovieDocumentsAsync(ratingResponse.documents);
      }
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        result = await this.enhanceMoviesWithUserData(result);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching featured movies:', error);
      return this.getFallbackFeaturedMovies();
    }
  }

  // Fetch a specific movie by ID
  async getMovieById(movieId: string): Promise<Movie | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        movieId
      );

      let processedMovies = await this.processMovieDocumentsAsync([response]);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId && processedMovies.length > 0) {
        processedMovies = await this.enhanceMoviesWithUserData(processedMovies);
      }
      
      return processedMovies.length > 0 ? processedMovies[0] : null;
    } catch (error) {
      console.error(`Error fetching movie with ID ${movieId}:`, error);
      return null;
    }
  }

  // Search movies by title
  async searchMovies(query: string): Promise<Movie[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  
    if (!query.trim()) {
      return [];
    }
  
    try {
      const searchTerm = query.trim().toLowerCase();
      const results = new Map<string, Movie>();
  
      // Search by title
      try {
        const titleResponse = await this.databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
          [
            Query.contains('title', searchTerm),
            Query.limit(50)
          ]
        );
        
        const titleMovies = await this.processMovieDocumentsAsync(titleResponse.documents);
        titleMovies.forEach(movie => results.set(movie.id, movie));
      } catch (error) {
        console.warn('Title search failed:', error);
      }
  
      // Search by description if we don't have enough results
      if (results.size < 10) {
        try {
          const descResponse = await this.databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
            [
              Query.contains('description', searchTerm),
              Query.limit(30)
            ]
          );
          
          const descMovies = await this.processMovieDocumentsAsync(descResponse.documents);
          descMovies.forEach(movie => {
            if (!results.has(movie.id)) {
              results.set(movie.id, movie);
            }
          });
        } catch (error) {
          console.warn('Description search failed:', error);
        }
      }
  
      // If still not enough results, do a broader search by getting all movies and filtering client-side
      if (results.size < 5) {
        try {
          const allMoviesResponse = await this.databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
            [
              Query.limit(200)
            ]
          );
          
          const allMovies = await this.processMovieDocumentsAsync(allMoviesResponse.documents);
          
          // Client-side filtering for better search results
          allMovies.forEach(movie => {
            if (!results.has(movie.id)) {
              const titleMatch = movie.title.toLowerCase().includes(searchTerm);
              const descMatch = movie.description.toLowerCase().includes(searchTerm);
              const genreMatch = movie.genres.some(genre => 
                genre.toLowerCase().includes(searchTerm)
              );
              
              if (titleMatch || descMatch || genreMatch) {
                results.set(movie.id, movie);
              }
            }
          });
        } catch (error) {
          console.warn('Fallback search failed:', error);
        }
      }
  
      let finalResults = Array.from(results.values());
  
      // Sort results by relevance (title matches first)
      finalResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        const aExactMatch = aTitle === searchTerm;
        const bExactMatch = bTitle === searchTerm;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        const aStartsWith = aTitle.startsWith(searchTerm);
        const bStartsWith = bTitle.startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        return a.title.localeCompare(b.title);
      });
  
      // Limit final results
      finalResults = finalResults.slice(0, 20);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        finalResults = await this.enhanceMoviesWithUserData(finalResults);
      }
      
      return finalResults;
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  }

  // Fetch wishlisted movies
  async getWishlistedMovies(): Promise<Movie[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.userId) {
      return []; // Not logged in, return empty array
    }
    
    try {
      // Get user library entries where isWishlisted is true
      const libraryResponse = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.equal('isWishlisted', true),
          Query.limit(100)
        ]
      );
      
      if (libraryResponse.documents.length === 0) {
        return [];
      }
      
      // Extract movie IDs from library entries
      const movieIds = libraryResponse.documents.map(doc => doc.movieId);
      
      // Fetch movie details for these IDs
      const movies: Movie[] = [];
      
      // Process in smaller batches to avoid query size limitations
      const batchSize = 20;
      for (let i = 0; i < movieIds.length; i += batchSize) {
        const batch = movieIds.slice(i, i + batchSize);
        
        try {
          const moviesResponse = await this.databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
            [
              Query.equal('$id', batch)
            ]
          );
          
          const processedBatch = await this.processMovieDocumentsAsync(moviesResponse.documents);
          
          // Mark all these movies as wishlisted
          processedBatch.forEach(movie => {
            movie.isWishlisted = true;
          });
          
          movies.push(...processedBatch);
        } catch (error) {
          console.error('Error fetching batch of wishlisted movies:', error);
        }
      }
      
      return movies;
    } catch (error) {
      console.error('Error fetching wishlisted movies:', error);
      return [];
    }
  }

  // Fetch movies for continue watching
  async getContinueWatchingMovies(): Promise<Movie[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.userId) {
      return []; // Not logged in, return empty array
    }
    
    try {
      // Get user library entries with progress > 0 and < 1
      const libraryResponse = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.greaterThan('progress', 0),
          Query.lessThan('progress', 1),
          Query.orderDesc('lastWatchedAt'),
          Query.limit(15)
        ]
      );
      
      if (libraryResponse.documents.length === 0) {
        return [];
      }
      
      // Create a map of movie IDs to progress
      const movieProgress = new Map();
      libraryResponse.documents.forEach(doc => {
        movieProgress.set(doc.movieId, {
          progress: doc.progress,
          lastWatchedAt: doc.lastWatchedAt
        });
      });
      
      // Extract movie IDs from library entries
      const movieIds = Array.from(movieProgress.keys());
      
      // Fetch movie details for these IDs
      const movies: Movie[] = [];
      
      // Process in smaller batches to avoid query size limitations
      const batchSize = 10;
      for (let i = 0; i < movieIds.length; i += batchSize) {
        const batch = movieIds.slice(i, i + batchSize);
        
        try {
          const moviesResponse = await this.databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
            [
              Query.equal('$id', batch)
            ]
          );
          
          const processedBatch = await this.processMovieDocumentsAsync(moviesResponse.documents);
          
          // Add progress information to each movie
          processedBatch.forEach(movie => {
            const progressInfo = movieProgress.get(movie.id);
            if (progressInfo) {
              movie.progress = progressInfo.progress;
            }
          });
          
          movies.push(...processedBatch);
        } catch (error) {
          console.error('Error fetching batch of continue watching movies:', error);
        }
      }
      
      // Sort by last watched time
      return movies.sort((a, b) => {
        const timeA = movieProgress.get(a.id)?.lastWatchedAt || 0;
        const timeB = movieProgress.get(b.id)?.lastWatchedAt || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error fetching continue watching movies:', error);
      return [];
    }
  }

  // Toggle movie wishlist status
  async toggleWishlist(movieId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check authentication using auth service
    if (!this.isAuthenticated() || !this.userId) {
      throw new Error('User must be logged in to manage wishlist');
    }
    
    try {
      // Check if movie exists in user library
      const libraryResponses = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.equal('movieId', movieId)
        ]
      );
      
      let isWishlisted = false;
      
      if (libraryResponses.documents.length > 0) {
        // Update existing entry
        const libraryEntry = libraryResponses.documents[0];
        isWishlisted = !libraryEntry.isWishlisted;
        
        await this.databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
          libraryEntry.$id,
          {
            isWishlisted: isWishlisted
          }
        );
      } else {
        // Create new entry
        isWishlisted = true;
        
        await this.databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
          ID.unique(),
          {
            userId: this.userId,
            movieId: movieId,
            isWishlisted: true,
            progress: 0,
            lastWatchedAt: Date.now()
          }
        );
      }
      
      // Clear cache to reflect the changes
      this.clearCache();
      
      return isWishlisted;
    } catch (error) {
      console.error('Error toggling wishlist status:', error);
      throw error;
    }
  }
  // Get user requests
async getUserRequests(): Promise<any[]> {
  if (!this.isInitialized) {
    await this.initialize();
  }
  
  // Check authentication
  if (!this.isAuthenticated() || !this.userId) {
    return [];
  }
  
  try {
    const response = await this.databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      [
        Query.equal('user_id', this.userId),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return [];
  }
}

// Create a new movie request
async createMovieRequest(requestData: {
  movie_title: string;
  movie_year: string;
  movie_genre: string;
  content: string;
  subject: string;
  message_type: string;
}): Promise<any> {
  if (!this.isInitialized) {
    await this.initialize();
  }
  
  // Check authentication
  if (!this.isAuthenticated() || !this.userId) {
    throw new Error('User must be logged in to create a request');
  }
  
  const currentUser = this.getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  try {
    const newRequest = await this.databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      ID.unique(),
      {
        user_id: this.userId,
        user_name: currentUser.name || 'Anonymous User',
        user_email: currentUser.email,
        message_type: requestData.message_type,
        priority: 'normal',
        status: 'new',
        is_read: false,
        movie_title: requestData.movie_title,
        movie_year: requestData.movie_year,
        movie_genre: requestData.movie_genre,
        content: requestData.content,
        subject: requestData.subject,
        admin_response: null,
        admin_response_at: null
      }
    );
    
    return newRequest;
  } catch (error) {
    console.error('Error creating movie request:', error);
    throw error;
  }
}

// Mark a request as read
async markRequestAsRead(requestId: string): Promise<boolean> {
  if (!this.isInitialized) {
    await this.initialize();
  }
  
  // Check authentication
  if (!this.isAuthenticated() || !this.userId) {
    return false;
  }
  
  try {
    // First verify this request belongs to the user
    const request = await this.databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId
    );
    
    if (request.user_id !== this.userId) {
      console.error('Request does not belong to this user');
      return false;
    }
    
    // Update the document
    await this.databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId,
      {
        is_read: true
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking request as read:', error);
    return false;
  }
}

// Update an existing request
async updateRequest(requestId: string, updateData: {
  movie_title?: string;
  movie_year?: string;
  movie_genre?: string;
  content?: string;
  subject?: string;
}): Promise<boolean> {
  if (!this.isInitialized) {
    await this.initialize();
  }
  
  // Check authentication
  if (!this.isAuthenticated() || !this.userId) {
    return false;
  }
  
  try {
    // First verify this request belongs to the user
    const request = await this.databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId
    );
    
    if (request.user_id !== this.userId) {
      console.error('Request does not belong to this user');
      return false;
    }
    
    // Only allow updates if the request is still new
    if (request.status !== 'new') {
      console.error('Cannot update a request that is already being processed');
      return false;
    }
    
    // Update the document
    await this.databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId,
      updateData
    );
    
    return true;
  } catch (error) {
    console.error('Error updating request:', error);
    return false;
  }
}

// Delete a request
async deleteRequest(requestId: string): Promise<boolean> {
  if (!this.isInitialized) {
    await this.initialize();
  }
  
  // Check authentication
  if (!this.isAuthenticated() || !this.userId) {
    return false;
  }
  
  try {
    // First verify this request belongs to the user
    const request = await this.databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId
    );
    
    if (request.user_id !== this.userId) {
      console.error('Request does not belong to this user');
      return false;
    }
    
    // Only allow deletion if the request is still new
    if (request.status !== 'new') {
      console.error('Cannot delete a request that is already being processed');
      return false;
    }
    
    // Delete the document
    await this.databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_USER_REQUESTS_COLLETCION_ID!,
      requestId
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting request:', error);
    return false;
  }
}

  // Update movie watching progress
  async updateWatchingProgress(movieId: string, progress: number): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check authentication using auth service
    if (!this.isAuthenticated() || !this.userId) {
      throw new Error('User must be logged in to update progress');
    }
    
    // Validate progress value (between 0 and 1)
    progress = Math.max(0, Math.min(1, progress));
    
    try {
      // Check if movie exists in user library
      const libraryResponses = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.equal('movieId', movieId)
        ]
      );
      
      if (libraryResponses.documents.length > 0) {
        // Update existing entry
        const libraryEntry = libraryResponses.documents[0];
        
        await this.databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
          libraryEntry.$id,
          {
            progress: progress,
            lastWatchedAt: Date.now()
          }
        );
      } else {
        // Create new entry
        await this.databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
          ID.unique(),
          {
            userId: this.userId,
            movieId: movieId,
            isWishlisted: false,
            progress: progress,
            lastWatchedAt: Date.now()
          }
        );
      }
      
      // Clear continue watching cache
      delete this.movieListCache['continue_watching'];
      
      return true;
    } catch (error) {
      console.error('Error updating watching progress:', error);
      return false;
    }
  }

  // Process movie documents from Appwrite with async video URL formatting
  private async processMovieDocumentsAsync(documents: any[]): Promise<Movie[]> {
    const processMoviePromises = documents.map(async (doc) => {
      // Parse genres
      let genres: string[] = [];
      if (doc.genre) {
        if (Array.isArray(doc.genre)) {
          genres = doc.genre;
        } else if (typeof doc.genre === 'string') {
          genres = doc.genre.split(',').map((g: string) => g.trim()).filter(Boolean);
        }
      }
      if (genres.length === 0) {
        genres = ['Action'];
      }

      // Process video URL asynchronously
      const rawVideoUrl = doc.video_url || '';
      const formattedVideoUrls = await this.formatVideoUrls(rawVideoUrl);
      const streamingHeaders = this.getStreamingHeaders(rawVideoUrl);
      
      return {
        id: doc.$id,
        title: doc.title || 'Untitled Movie',
        description: doc.description || doc.ai_summary || 'No description available',
        posterUrl: doc.poster_url || this.getFallbackPosterUrl(doc.$id),
        rating: this.parseToDouble(doc.rating) || 7.5,
        year: doc.release_year?.toString() || new Date().getFullYear().toString(),
        duration: doc.duration || '2h 0m',
        genres,
        isPremium: doc.premium_only || false,
        videoUrl: rawVideoUrl,
        videoUrls: formattedVideoUrls,
        streamingHeaders,
        isReady: rawVideoUrl ? true : false,
        viewCount: doc.view_count || 0,
        downloadCount: doc.download_count || 0,
        isFeatured: doc.is_featured || false,
        isTrending: doc.is_trending || false,
        progress: 0,
        userRating: 0,
        isWishlisted: false,
        $createdAt: doc.$createdAt || null // Add this line to include $createdAt
      };
    });

    return await Promise.all(processMoviePromises);
  }

  // Enhance movies with user data (wishlist, progress)
  private async enhanceMoviesWithUserData(movies: Movie[]): Promise<Movie[]> {
    if (!this.userId || movies.length === 0) {
      return movies;
    }
    
    try {
      // Get movie IDs
      const movieIds = movies.map(movie => movie.id);
      
      // Fetch user library entries for these movies
      const libraryResponses = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_USER_LIBRARY_COLLECTION_ID!,
        [
          Query.equal('userId', this.userId),
          Query.equal('movieId', movieIds)
        ]
      );
      
      // Create a map of movie IDs to user data
      const movieUserData = new Map();
      libraryResponses.documents.forEach(doc => {
        movieUserData.set(doc.movieId, {
          isWishlisted: doc.isWishlisted,
          progress: doc.progress,
          userRating: doc.rating
        });
      });
      
      // Enhance each movie with user data
      return movies.map(movie => {
        const userData = movieUserData.get(movie.id);
        if (userData) {
          return {
            ...movie,
            isWishlisted: userData.isWishlisted,
            progress: userData.progress,
            userRating: userData.userRating
          };
        }
        return movie;
      });
    } catch (error) {
      console.error('Error enhancing movies with user data:', error);
      return movies;
    }
  }

  // Parse any value to double
  private parseToDouble(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  // Get fallback poster URL
  private getFallbackPosterUrl(id: string): string {
    const fallbackIndex = (id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 4) + 1;
    return `/images/poster${fallbackIndex}.jpg`;
  }

  // Get fallback featured movies
  private getFallbackFeaturedMovies(): Movie[] {
    return [
      {
        id: 'fallback_featured_1',
        title: 'Action Hero Returns',
        description: 'The ultimate action-packed thriller.',
        posterUrl: '/images/poster1.jpg',
        rating: 8.5,
        year: '2023',
        duration: '2h 15m',
        genres: ['Action', 'Thriller'],
        isPremium: false,
        videoUrl: '',
        videoUrls: { sourceType: SOURCE_BUNNY },
        streamingHeaders: {},
        isReady: false,
        isFeatured: true,
        $createdAt: undefined
      }
    ];
  }

  // Clear cache
  clearCache(): void {
    this.movieListCache = {};
    this.cacheExpiry = {};
  }
}

// Create context for MovieService
interface MovieServiceContextType {
  service: MovieService;
  isInitialized: boolean;
}

const MovieServiceContext = createContext<MovieServiceContextType>({
  service: new MovieService(),
  isInitialized: false
});

// Provider component
export const MovieServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [service] = useState<MovieService>(new MovieService());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

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

  return (
    <MovieServiceContext.Provider value={{ service, isInitialized }}>
      {children}
    </MovieServiceContext.Provider>
  );
};

// Hook to use the movie service
export const useMovieService = () => useContext(MovieServiceContext);

export default MovieService;