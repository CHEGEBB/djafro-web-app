// services/movie_service.tsx
'use client'
import { Client, Databases, ID, Query, Models } from 'appwrite';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define types
export type Movie = {
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
  
  // Cache for movie lists
  private movieListCache: Record<string, Movie[]> = {};
  private cacheExpiry: Record<string, Date> = {};
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
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

      // Try to get current user ID if available
      try {
        // This assumes you have an auth service or a way to get the current user
        // You may need to adjust this based on your authentication system
        const account = await this.client.account.get();
        this.userId = account.$id;
      } catch (e) {
        // Not authenticated, continue as guest
        this.userId = null;
      }

      this.isInitialized = true;
      console.log('MovieService initialized successfully');
    } catch (error) {
      console.error('MovieService initialization error:', error);
    }
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

      const movies = this.processMovieDocuments(response.documents);
      
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

      let result = this.processMovieDocuments(response.documents);
      
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
        
        result = this.processMovieDocuments(ratingResponse.documents);
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

      let result = this.processMovieDocuments(response.documents);
      
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
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.search('genre', genre),
          Query.limit(15)
        ]
      );

      let result = this.processMovieDocuments(response.documents);
      
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

      let result = this.processMovieDocuments(response.documents);
      
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
        
        result = this.processMovieDocuments(ratingResponse.documents);
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

      let processedMovies = this.processMovieDocuments([response]);
      
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
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID!,
        [
          Query.search('title', query.trim()),
          Query.limit(20)
        ]
      );

      let result = this.processMovieDocuments(response.documents);
      
      // If user is logged in, fetch and merge wishlist/progress information
      if (this.userId) {
        result = await this.enhanceMoviesWithUserData(result);
      }
      
      return result;
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
          
          const processedBatch = this.processMovieDocuments(moviesResponse.documents);
          
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
          
          const processedBatch = this.processMovieDocuments(moviesResponse.documents);
          
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
    
    if (!this.userId) {
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

  // Update movie watching progress
  async updateWatchingProgress(movieId: string, progress: number): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.userId) {
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

  // Process movie documents from Appwrite
  private processMovieDocuments(documents: any[]): Movie[] {
    return documents.map(doc => {
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

      // Process video URL
      const rawVideoUrl = doc.video_url || '';
      const videoSourceInfo = this.detectVideoSource(rawVideoUrl);
      
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
        videoUrls: { 
          original: rawVideoUrl,
          sourceType: videoSourceInfo.type
        },
        streamingHeaders: {},
        isReady: rawVideoUrl ? true : false,
        viewCount: doc.view_count || 0,
        downloadCount: doc.download_count || 0,
        isFeatured: doc.is_featured || false,
        isTrending: doc.is_trending || false,
        progress: 0,
        userRating: 0,
        isWishlisted: false
      };
    });
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

  // Detect video source type
  private detectVideoSource(url: string): { type: string; url: string } {
    if (!url) {
      return { type: '', url: '' };
    }
    
    // Normalize URL by removing extra spaces
    const normalizedUrl = url.trim();
    
    // Check for Bunny Stream URLs (m3u8 playlists)
    if (normalizedUrl.endsWith('.m3u8') || normalizedUrl.includes('b-cdn.net')) {
      return { type: SOURCE_BUNNY, url: normalizedUrl };
    }
    
    // Check for YouTube URLs
    if (normalizedUrl.includes('youtube.com') || 
        normalizedUrl.includes('youtu.be') || 
        /^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
      
      // Extract video ID from YouTube URL
      let videoId = '';
      
      if (normalizedUrl.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(normalizedUrl);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (normalizedUrl.includes('youtu.be/')) {
        const urlObj = new URL(normalizedUrl);
        videoId = urlObj.pathname.split('/').pop() || '';
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
        // Already a YouTube video ID
        videoId = normalizedUrl;
      }
      
      if (videoId) {
        return { type: SOURCE_YOUTUBE, url: normalizedUrl };
      }
    }
    
    // Check for Dailymotion URLs
    if (normalizedUrl.includes('dailymotion.com/embed/video/') || 
        normalizedUrl.includes('dai.ly/')) {
      return { type: SOURCE_DAILYMOTION, url: normalizedUrl };
    }
    
    // Unknown URL type - try to handle as Bunny Stream
    return { type: SOURCE_BUNNY, url: normalizedUrl };
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
        isFeatured: true
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