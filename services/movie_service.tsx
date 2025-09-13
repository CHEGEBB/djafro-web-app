/* eslint-disable @typescript-eslint/no-explicit-any */
// services/movie_service.tsx
import { Client, Databases, Storage, Account, Query, ID, TablesDB } from 'appwrite';
import { useEffect, useState } from 'react';

export interface VideoPlayerData {
  id: string;
  title: string;
  videoUrl: string;
  videoUrls: Record<string, string>;
  videoSourceType: string;
  streamingHeaders: Record<string, string>;
  thumbnailUrl: string;
  description: string;
  rating: number;
  year: string;
  duration: string;
  genres: string[];
  isPremium: boolean;
  isReady: boolean;
  progress: number;
  userRating: number;
  isWishlisted: boolean;
  requiresAdToPlay: boolean;
}

export class MovieService {
  // Singleton pattern
  private static _instance: MovieService;
  public static getInstance(): MovieService {
    if (!MovieService._instance) {
      MovieService._instance = new MovieService();
    }
    return MovieService._instance;
  }

  // Constants
  public static readonly SOURCE_BUNNY = 'bunny';
  public static readonly SOURCE_YOUTUBE = 'youtube';
  public static readonly SOURCE_DAILYMOTION = 'dailymotion';
  private static readonly AD_VIEW_THRESHOLD = 3;
  private static readonly AD_TIME_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
  private static readonly FEATURED_SELECTION_SIZE = 5;
  private static readonly FEATURED_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private static readonly FEATURED_ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Appwrite services
  private _client: Client;
  private _databases: Databases;
  private _tablesDB: TablesDB;
  private _storage: Storage;
  private _account: Account;

  // Cache and state
  private _progressCache: Map<string, any> = new Map();
  private _currentUserId: string | null = null;
  private _isPremiumUser = false;
  private _adViewCount = 0;
  private _lastAdShownTime: Date | null = null;
  private _movieListCache: Map<string, any[]> = new Map();
  private _cacheExpiry: Map<string, Date> = new Map();
  private _allFeaturedMoviesCache: any[] | null = null;
  private _featuredMoviesCacheTimestamp: Date | null = null;
  private _currentFeaturedSelection: any[] | null = null;
  private _random = Math.random;
  private _cacheDuration = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor() {
    // Initialize Appwrite client
    this._client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

    this._databases = new Databases(this._client);
    this._tablesDB = new TablesDB(this._client);
    this._storage = new Storage(this._client);
    this._account = new Account(this._client);
  }

  // Initialization method
  async initialize(): Promise<void> {
    try {
      // Get user ID if logged in
      await this._updateCurrentUserId();
      
      // Check if user is premium
      await this._checkUserPremiumStatus();
      
      // Load ad view tracking from local storage
      this._loadAdViewTracking();
    } catch (e) {
      console.error('MovieService initialization error:', e);
    }
  }

  private async _updateCurrentUserId(): Promise<void> {
    try {
      const session = await this._account.getSession('current');
      this._currentUserId = session.userId;
    } catch (e) {
      this._currentUserId = null;
    }
  }

  private async _ensureUserAuthenticated(): Promise<boolean> {
    if (!this._currentUserId) {
      await this._updateCurrentUserId();
    }
    return !!this._currentUserId;
  }

  // User Premium Status
  private async _checkUserPremiumStatus(): Promise<void> {
    try {
      if (await this._ensureUserAuthenticated()) {
        // Check premium status from user preferences in database
        const response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_preferences',
          [
            Query.equal('userId', this._currentUserId!),
            Query.limit(1),
          ],
        );
        
        if (response.rows.length > 0) {
          this._isPremiumUser = response.rows[0].data['is_premium'] ?? false;
        }
      } else {
        this._isPremiumUser = false;
      }
    } catch (e) {
      this._isPremiumUser = false;
    }
  }

  get isPremiumUser(): boolean {
    return this._isPremiumUser;
  }

  async setPremiumUser(isPremium: boolean): Promise<void> {
    this._isPremiumUser = isPremium;
    
    // Update in database if user is authenticated
    if (this._currentUserId) {
      await this._updateUserPremiumStatus(isPremium);
    }
  }

  private async _updateUserPremiumStatus(isPremium: boolean): Promise<void> {
    try {
      if (await this._ensureUserAuthenticated()) {
        const response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_preferences',
          [
            Query.equal('userId', this._currentUserId!),
            Query.limit(1),
          ],
        );
        
        if (response.rows.length === 0) {
          // Create new preferences
          await this._tablesDB.createRow(
            process.env.NEXT_PUBLIC_DATABASE_ID || '',
            'user_preferences',
            ID.unique(),
            {
              'userId': this._currentUserId!,
              'is_premium': isPremium,
              'ad_preferences': {
                'view_count': this._adViewCount,
                'last_ad_time': this._lastAdShownTime?.getTime(),
              },
            },
          );
        } else {
          // Update existing preferences
          await this._tablesDB.updateRow(
            process.env.NEXT_PUBLIC_DATABASE_ID || '',
            'user_preferences',
            response.rows[0].$id,
            {
              'is_premium': isPremium,
            },
          );
        }
      }
    } catch (e) {
      console.error('Error updating premium status:', e);
    }
  }

  // Ad Management
  private _loadAdViewTracking(): void {
    try {
      // Load from localStorage on client side
      if (typeof window !== 'undefined') {
        const adViewCount = localStorage.getItem('adViewCount');
        if (adViewCount) {
          this._adViewCount = parseInt(adViewCount, 10);
        }
        
        const lastAdTime = localStorage.getItem('lastAdShownTime');
        if (lastAdTime) {
          this._lastAdShownTime = new Date(parseInt(lastAdTime, 10));
        }
      }
    } catch (e) {
      this._adViewCount = 0;
      this._lastAdShownTime = null;
    }
  }

  private _updateAdViewTracking(): void {
    try {
      // Save to localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem('adViewCount', this._adViewCount.toString());
        if (this._lastAdShownTime) {
          localStorage.setItem('lastAdShownTime', this._lastAdShownTime.getTime().toString());
        }
      }
      
      // If user is authenticated, also update in database
      if (this._currentUserId) {
        this._syncAdViewTrackingToServer();
      }
    } catch (e) {
      console.error('Error updating ad view tracking:', e);
    }
  }

  private async _syncAdViewTrackingToServer(): Promise<void> {
    try {
      if (!await this._ensureUserAuthenticated()) return;
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_preferences',
        [
          Query.equal('userId', this._currentUserId!),
          Query.limit(1),
        ],
      );
      
      if (response.rows.length > 0) {
        await this._tablesDB.updateRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_preferences',
          response.rows[0].$id,
          {
            'ad_preferences': {
              'view_count': this._adViewCount,
              'last_ad_time': this._lastAdShownTime?.getTime(),
            },
          },
        );
      }
    } catch (e) {
      console.error('Error syncing ad view tracking to server:', e);
    }
  }

  incrementAdViewCount(): void {
    this._adViewCount++;
    this._updateAdViewTracking();
  }

  resetAdViewCount(): void {
    this._adViewCount = 0;
    this._lastAdShownTime = new Date();
    this._updateAdViewTracking();
  }

  shouldShowAd(): boolean {
    // Premium users don't see ads
    if (this._isPremiumUser) return false;
    
    // Check frequency threshold
    if (this._adViewCount < MovieService.AD_VIEW_THRESHOLD) return false;
    
    // Check time interval
    if (this._lastAdShownTime) {
      const timeElapsed = Date.now() - this._lastAdShownTime.getTime();
      if (timeElapsed < MovieService.AD_TIME_INTERVAL) return false;
    }
    
    return true;
  }

  // Video Source Detection and Processing
  detectVideoSource(url: string): { type: string; url: string; videoId?: string } {
    if (!url) {
      return { type: '', url: '' };
    }
    
    // Normalize URL by removing extra spaces
    const normalizedUrl = url.trim();
    
    // Check for Bunny Stream URLs (m3u8 playlists)
    if (normalizedUrl.endsWith('.m3u8') || normalizedUrl.includes('b-cdn.net')) {
      return { type: MovieService.SOURCE_BUNNY, url: normalizedUrl };
    }
    
    // Check for YouTube URLs
    if (normalizedUrl.includes('youtube.com') || 
        normalizedUrl.includes('youtu.be') || 
        /^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
      
      // Extract video ID from YouTube URL
      let videoId = '';
      
      if (normalizedUrl.includes('youtube.com/watch?v=')) {
        const uri = new URL(normalizedUrl);
        videoId = uri.searchParams.get('v') || '';
      } else if (normalizedUrl.includes('youtu.be/')) {
        const segments = new URL(normalizedUrl).pathname.split('/');
        if (segments.length > 1) {
          videoId = segments[segments.length - 1];
        }
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
        // Already a YouTube video ID
        videoId = normalizedUrl;
      }
      
      if (videoId) {
        return { 
          type: MovieService.SOURCE_YOUTUBE, 
          url: normalizedUrl, 
          videoId 
        };
      }
    }
    
    // Check for Dailymotion URLs
    if (normalizedUrl.includes('dailymotion.com/embed/video/') || 
        normalizedUrl.includes('dai.ly/')) {
      
      // Extract video ID from Dailymotion URL
      let videoId = '';
      
      if (normalizedUrl.includes('dailymotion.com/embed/video/')) {
        const segments = new URL(normalizedUrl).pathname.split('/');
        if (segments.length > 3) {
          videoId = segments[segments.length - 1];
        }
      } else if (normalizedUrl.includes('dai.ly/')) {
        const segments = new URL(normalizedUrl).pathname.split('/');
        if (segments.length > 1) {
          videoId = segments[segments.length - 1];
        }
      }
      
      if (videoId) {
        return { 
          type: MovieService.SOURCE_DAILYMOTION, 
          url: normalizedUrl, 
          videoId 
        };
      }
    }
    
    // Unknown URL type - try to handle as Bunny Stream
    return { type: MovieService.SOURCE_BUNNY, url: normalizedUrl };
  }

  // Bunny.net helpers
  private _getBunnyApiHeaders(): Record<string, string> {
    return {
      'AccessKey': process.env.BUNNY_API_KEY || '',
      'Content-Type': 'application/json',
      'User-Agent': 'DJAfroMoviesWeb/1.0.0',
      'Accept': 'application/json',
    };
  }

  private _getBunnyStreamingHeaders(): Record<string, string> {
    // Web optimized headers
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Referer': 'https://iframe.mediadelivery.net/',
      'Origin': 'https://iframe.mediadelivery.net',
    };
  }

  private _extractBunnyVideoInfo(url: string): Record<string, string> {
    try {
      // Handle iframe URLs
      if (url.includes('iframe.mediadelivery.net/play/')) {
        const uri = new URL(url);
        const segments = uri.pathname.split('/');
        
        if (segments.length >= 4 && segments[1] === 'play') {
          const libraryId = segments[2];
          const videoId = segments[3];
          
          return {
            'libraryId': libraryId,
            'videoId': videoId,
            'pullZone': `vz-${libraryId}-17b.b-cdn.net`,
          };
        }
      }
      
      // Handle direct CDN URLs
      else if (url.includes('b-cdn.net')) {
        const uri = new URL(url);
        const host = uri.hostname;
        const pathSegments = uri.pathname.split('/');
        
        if (pathSegments.length > 1) {
          const videoId = pathSegments[1];
          
          // Extract library ID from hostname
          const libraryMatch = /vz-([a-f0-9-]+)-/.exec(host);
          const libraryId = libraryMatch ? libraryMatch[1] : '';
          
          return {
            'libraryId': libraryId,
            'videoId': videoId,
            'pullZone': host,
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
            'libraryId': libraryId,
            'videoId': videoId,
            'pullZone': `vz-${libraryId}-17b.b-cdn.net`,
          };
        }
      }
    } catch (e) {
      console.error('Error extracting Bunny video info:', e);
    }
    
    return {};
  }

  async formatVideoUrls(baseUrl: string, videoId: string): Promise<Record<string, string>> {
    if (!baseUrl) {
      return {};
    }

    try {
      // Detect the video source
      const sourceInfo = this.detectVideoSource(baseUrl);
      const sourceType = sourceInfo.type;
      
      // Handle YouTube URLs
      if (sourceType === MovieService.SOURCE_YOUTUBE) {
        const ytVideoId = sourceInfo.videoId;
        
        return {
          'youtube': ytVideoId || '',
          'original': baseUrl,
          'sourceType': MovieService.SOURCE_YOUTUBE,
        };
      }
      
      // Handle Dailymotion URLs
      else if (sourceType === MovieService.SOURCE_DAILYMOTION) {
        const dmVideoId = sourceInfo.videoId;
        
        // Format embed URL
        const embedUrl = `https://dailymotion.com/embed/video/${dmVideoId}`;
        
        return {
          'dailymotion': dmVideoId || '',
          'embed': embedUrl,
          'original': baseUrl,
          'sourceType': MovieService.SOURCE_DAILYMOTION,
        };
      }
      
      // Handle Bunny.net URLs
      else {
        // Check if it's already a Bunny CDN URL - use directly
        if (baseUrl.includes('b-cdn.net')) {
          const videoUrls: Record<string, string> = {};
          
          // If it's an HLS playlist URL, use it directly
          if (baseUrl.includes('playlist.m3u8')) {
            videoUrls['hls'] = baseUrl;
            videoUrls['original'] = baseUrl;
            videoUrls['sourceType'] = MovieService.SOURCE_BUNNY;
            
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
            videoUrls['sourceType'] = MovieService.SOURCE_BUNNY;
            
            // Try to construct other quality URLs
            if (baseUrl.includes('play_720p.mp4')) {
              videoUrls['720p'] = baseUrl;
              const baseUrlWithoutQuality = baseUrl.replace('play_720p.mp4', '');
              videoUrls['1080p'] = `${baseUrlWithoutQuality}play_1080p.mp4`;
              videoUrls['480p'] = `${baseUrlWithoutQuality}play_480p.mp4`;
              videoUrls['360p'] = `${baseUrlWithoutQuality}play_360p.mp4`;
              videoUrls['hls'] = `${baseUrlWithoutQuality}playlist.m3u8`;
            } else {
              // Use the provided URL as the main quality
              videoUrls['720p'] = baseUrl;
            }
          }
          
          return videoUrls;
        }
        
        // For non-direct URLs, try extraction
        const videoInfo = this._extractBunnyVideoInfo(baseUrl);
        if (Object.keys(videoInfo).length === 0) {
          return {'original': baseUrl, 'sourceType': MovieService.SOURCE_BUNNY};
        }
        
        const libraryId = videoInfo['libraryId'];
        const bunnyVideoId = videoInfo['videoId'];
        const pullZone = videoInfo['pullZone'];
        
        // Generate video URLs optimized for web
        const videoUrls: Record<string, string> = {
          'sourceType': MovieService.SOURCE_BUNNY
        };
        
        // For web, prefer MP4 but provide HLS as an option
        videoUrls['720p'] = `https://${pullZone}/${bunnyVideoId}/play_720p.mp4`;
        videoUrls['480p'] = `https://${pullZone}/${bunnyVideoId}/play_480p.mp4`;
        videoUrls['360p'] = `https://${pullZone}/${bunnyVideoId}/play_360p.mp4`;
        videoUrls['1080p'] = `https://${pullZone}/${bunnyVideoId}/play_1080p.mp4`;
        videoUrls['hls'] = `https://${pullZone}/${bunnyVideoId}/playlist.m3u8`;
        
        // Keep original as fallback
        videoUrls['original'] = baseUrl;
        
        return videoUrls;
      }
    } catch (e) {
      console.error('Error formatting video URLs:', e);
      return {'original': baseUrl, 'sourceType': MovieService.SOURCE_BUNNY};
    }
  }

  async formatVideoUrl(url: string): Promise<string> {
    if (!url) return '';

    try {
      // Detect source type
      const sourceInfo = this.detectVideoSource(url);
      const sourceType = sourceInfo.type;
      
      // For YouTube and Dailymotion, just return the original URL
      // as they will be handled by specialized players
      if (sourceType === MovieService.SOURCE_YOUTUBE || sourceType === MovieService.SOURCE_DAILYMOTION) {
        return url;
      }
      
      // DIRECT BUNNY URLs should be used as-is
      if (url.includes('b-cdn.net')) {
        return url;
      }
      
      const videoUrls = await this.formatVideoUrls(url, '');
      
      // Choose best format for web platform
      if (videoUrls['720p']) {
        return videoUrls['720p'];
      }
      if (videoUrls['hls']) {
        return videoUrls['hls'];
      }
      if (videoUrls['480p']) {
        return videoUrls['480p'];
      }
      
      // Fallback
      return videoUrls['original'] || url;
    } catch (e) {
      console.error('Error formatting video URL:', e);
      return url;
    }
  }

  getStreamingHeaders(videoUrl: string): Record<string, string> {
    // Detect source type
    const sourceInfo = this.detectVideoSource(videoUrl);
    const sourceType = sourceInfo.type;
    
    // For YouTube and Dailymotion, no special headers needed
    if (sourceType === MovieService.SOURCE_YOUTUBE || sourceType === MovieService.SOURCE_DAILYMOTION) {
      return {};
    }
    
    // For Bunny Stream, use bunny headers
    if (videoUrl.includes('b-cdn.net') || videoUrl.includes('bunnycdn.com')) {
      return this._getBunnyStreamingHeaders();
    }
    
    // For other sources, return minimal headers
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  async testVideoUrl(url: string): Promise<boolean> {
    try {
      // Detect source type
      const sourceInfo = this.detectVideoSource(url);
      const sourceType = sourceInfo.type;
      
      // For YouTube and Dailymotion, assume the URL is valid
      if (sourceType === MovieService.SOURCE_YOUTUBE || sourceType === MovieService.SOURCE_DAILYMOTION) {
        return true;
      }
      
      // For Bunny Stream, test the URL
      const response = await fetch(url, {
        method: 'HEAD',
        headers: this.getStreamingHeaders(url),
      });
      
      return response.status === 200 || response.status === 206;
    } catch (e) {
      console.error('Error testing video URL:', e);
      return false;
    }
  }

  // Movie Fetching Methods
  async getMovieById(movieId: string): Promise<any> {
    try {
      // Use the TablesDB API to get the row
      const response = await this._tablesDB.getRow(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        movieId,
      );
      
      const processedMovies = await this._processMovieDocumentsAsync([response]);
      return processedMovies.length > 0 ? processedMovies[0] : null;
    } catch (e) {
      console.error('Error getting movie by ID:', e);
      return null;
    }
  }

  getEmptyStateMovie(): any {
    return {
      'id': 'empty_state',
      'title': 'No Movies Available',
      'description': 'Check back later for new content.',
      'posterUrl': '/images/poster1.jpg',
      'rating': 0.0,
      'year': new Date().getFullYear().toString(),
      'duration': '0m',
      'genres': ['Drama'],
      'isPremium': false,
      'videoUrl': '',
      'videoUrls': {},
      'streamingHeaders': {},
      'isReady': false,
    };
  }

  async getTrendingMovies(): Promise<any[]> {
    const cacheKey = 'trending_movies';
    
    // Check cache first
    if (this._movieListCache.has(cacheKey)) {
      const expiry = this._cacheExpiry.get(cacheKey);
      if (expiry && expiry > new Date()) {
        return [...this._movieListCache.get(cacheKey)!];
      }
    }
    
    try {
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        [
          Query.orderDesc('rating'),
          Query.limit(15),
        ],
      );
      
      const result = await this._processMovieDocumentsAsync(response.rows);
      
      // For non-premium users, inject banner ad placeholder into the results
      if (!this._isPremiumUser && result.length > 5) {
        // Inject an ad card every 5 movies
        result.splice(5, 0, {
          'id': 'ad_trending_banner',
          'isAdPlaceholder': true,
          'adType': 'banner',
        });
      }
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + this._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error getting trending movies:', e);
      return [];
    }
  }

  async getNewReleases(): Promise<any[]> {
    const cacheKey = 'new_releases';
    
    // Check cache first
    if (this._movieListCache.has(cacheKey)) {
      const expiry = this._cacheExpiry.get(cacheKey);
      if (expiry && expiry > new Date()) {
        return [...this._movieListCache.get(cacheKey)!];
      }
    }
    
    try {
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        [
          Query.orderDesc('$createdAt'),
          Query.limit(12),
        ],
      );
      
      const result = await this._processMovieDocumentsAsync(response.rows);
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + this._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error getting new releases:', e);
      return [];
    }
  }

  async getMoviesByGenre(genre: string): Promise<any[]> {
    const cacheKey = `genre_${genre}`;
    
    // Check cache first
    if (this._movieListCache.has(cacheKey)) {
      const expiry = this._cacheExpiry.get(cacheKey);
      if (expiry && expiry > new Date()) {
        return [...this._movieListCache.get(cacheKey)!];
      }
    }
    
    try {
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        [
          // Use proper array contains query
          Query.equal('genre', [genre]),
          Query.limit(15),
        ],
      );
      
      const result = await this._processMovieDocumentsAsync(response.rows);
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + this._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error getting movies by genre:', e);
      return [];
    }
  }

  async getFeaturedMovies(): Promise<any[]> {
    try {
      // Check if we need to generate a new featured selection
      const now = new Date();
      let needsNewSelection = !this._currentFeaturedSelection;
      
      if (!needsNewSelection && this._featuredMoviesCacheTimestamp) {
        // Calculate time since last selection
        const selectionAge = now.getTime() - this._featuredMoviesCacheTimestamp.getTime();
        
        // Generate new selection if the current one is older than the rotation interval
        needsNewSelection = selectionAge >= MovieService.FEATURED_ROTATION_INTERVAL;
      }
      
      if (needsNewSelection) {
        // Get all available featured movies
        const allFeatured = await this._getAllFeaturedMovies();
        
        if (allFeatured.length === 0) {
          return this._getFallbackFeaturedMovies();
        }
        
        // If we have enough featured movies, select random ones
        if (allFeatured.length > MovieService.FEATURED_SELECTION_SIZE) {
          // Create a copy of the list so we can modify it
          const availableMovies = [...allFeatured];
          const selectedMovies: any[] = [];
          
          // Select random movies until we have enough or run out
          while (selectedMovies.length < MovieService.FEATURED_SELECTION_SIZE && availableMovies.length > 0) {
            const randomIndex = Math.floor(this._random() * availableMovies.length);
            selectedMovies.push(availableMovies.splice(randomIndex, 1)[0]);
          }
          
          // Update current selection
          this._currentFeaturedSelection = selectedMovies;
        } else {
          // Not enough movies to randomize, use all available
          this._currentFeaturedSelection = allFeatured;
        }
      }
      
      return this._currentFeaturedSelection!;
    } catch (e) {
      console.error('Error getting featured movies:', e);
      return this._getFallbackFeaturedMovies();
    }
  }

  async _getAllFeaturedMovies(): Promise<any[]> {
    try {
      // Check if we already have a cached list of all featured movies
      if (this._allFeaturedMoviesCache && this._featuredMoviesCacheTimestamp) {
        const cacheAge = Date.now() - this._featuredMoviesCacheTimestamp.getTime();
        
        // Use cached list if it's still fresh
        if (cacheAge < MovieService.FEATURED_CACHE_DURATION) {
          return this._allFeaturedMoviesCache;
        }
      }
      
      // Fetch all featured movies with a higher limit
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        [
          Query.equal('is_featured', true),
          Query.limit(50), // Get up to 50 featured movies
        ],
      );
      
      const result = await this._processMovieDocumentsAsync(response.rows);
      
      // Update cache
      this._allFeaturedMoviesCache = result;
      this._featuredMoviesCacheTimestamp = new Date();
      
      return result;
    } catch (e) {
      console.error('Error getting all featured movies:', e);
      return this._getFallbackFeaturedMovies();
    }
  }

  private _getFallbackFeaturedMovies(): any[] {
    return [
      {
        'id': 'fallback_featured_1',
        'title': 'Action Hero Returns',
        'description': 'The ultimate action-packed thriller.',
        'imageAsset': '/images/banner1.jpg',
        'posterUrl': '/images/poster1.jpg',
        'rating': 8.5,
        'year': '2023',
        'duration': '2h 15m',
        'genres': ['Action', 'Thriller'],
        'isPremium': false,
        'videoUrl': '',
        'videoUrls': {'sourceType': MovieService.SOURCE_BUNNY},
        'videoSourceType': MovieService.SOURCE_BUNNY,
        'streamingHeaders': {},
        'isReady': false,
        'progress': 0.0,
        'userRating': 0.0,
        'isWishlisted': false,
      },
    ];
  }

  async searchMovies(query: string): Promise<any[]> {
    try {
      if (!query.trim()) return [];
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        [
          Query.search('title', query.trim()),
          Query.limit(20),
        ],
      );
      
      return await this._processMovieDocumentsAsync(response.rows);
    } catch (e) {
      console.error('Error searching movies:', e);
      return [];
    }
  }

  async getAllMovies({
    offset = 0,
    limit = 5000,
    genre,
    sortBy = 'title',
    ascending = true,
  }: {
    offset?: number;
    limit?: number;
    genre?: string;
    sortBy?: string;
    ascending?: boolean;
  } = {}): Promise<any[]> {
    try {
      const queries: any[] = [];
      
      // Add genre filter if specified
      if (genre && genre !== 'All') {
        // Use proper array contains query
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
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
        queries,
      );
      
      const result = await this._processMovieDocumentsAsync(response.rows);
      
      // For non-premium users, inject ad placeholders at regular intervals
      if (!this._isPremiumUser && result.length > 10) {
        // Add a banner ad after every 20 movies
        for (let i = 20; i < result.length; i += 20) {
          if (i < result.length) {
            result.splice(i, 0, {
              'id': `ad_all_movies_banner_${i}`,
              'isAdPlaceholder': true,
              'adType': 'banner',
            });
          }
        }
        
        // Add a native ad after every 50 movies
        for (let i = 50; i < result.length; i += 50) {
          if (i < result.length) {
            result.splice(i, 0, {
              'id': `ad_all_movies_native_${i}`,
              'isAdPlaceholder': true,
              'adType': 'native',
            });
          }
        }
      }
      
      return result;
    } catch (e) {
      console.error('Error getting all movies:', e);
      return [];
    }
  }

  // User Progress & Library Management
  async updateMovieProgress(movieId: string, progress: number): Promise<void> {
    try {
      const now = Date.now();
      
      // Update local cache first for immediate response
      this._progressCache.set(movieId, {
        'progress': progress,
        'lastWatchedAt': now,
        'needsSync': true,
      });
      
      // If user is logged in, sync with server
      if (await this._ensureUserAuthenticated()) {
        await this._syncMovieProgressToServer(movieId, progress, now);
      }
    } catch (e) {
      console.error('Error updating movie progress:', e);
    }
  }

  async _syncMovieProgressToServer(
    movieId: string, 
    progress: number, 
    timestamp: number
  ): Promise<void> {
    try {
      if (!(await this._ensureUserAuthenticated())) return;
      
      // Check if entry already exists using TablesDB API
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('movieId', movieId),
          Query.limit(1),
        ],
      );
      
      if (response.rows.length === 0) {
        // Create new entry using TablesDB API
        await this._tablesDB.createRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          ID.unique(),
          {
            'userId': this._currentUserId!,
            'movieId': movieId,
            'type': ['progress'], // Use array instead of string
            'progress': progress,
            'lastWatchedAt': timestamp,
            'isWishlisted': false, // Default values for required fields
            'rating': 0.0,
          },
        );
      } else {
        // Update existing entry using TablesDB API
        const existingRow = response.rows[0];
        const currentTypes = Array.isArray(existingRow.data['type']) 
          ? existingRow.data['type'] as string[]
          : [];
        
        // Add 'progress' to types if not already present
        const newTypes = [...currentTypes];
        if (!newTypes.includes('progress')) {
          newTypes.push('progress');
        }
        
        await this._tablesDB.updateRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          existingRow.$id,
          {
            'progress': progress,
            'lastWatchedAt': timestamp,
            'type': newTypes,
          },
        );
      }
      
      // Mark as synced in local cache
      const cachedData = this._progressCache.get(movieId);
      if (cachedData) {
        cachedData.needsSync = false;
        this._progressCache.set(movieId, cachedData);
      }
    } catch (e) {
      console.error('Error syncing movie progress to server:', e);
    }
  }

  async getMovieProgress(movieId: string): Promise<number> {
    try {
      // Check local cache first for immediate response
      const cachedData = this._progressCache.get(movieId);
      if (cachedData) {
        return cachedData.progress as number;
      }
      
      // If user is logged in, try to get from server
      if (await this._ensureUserAuthenticated()) {
        const response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          [
            Query.equal('userId', this._currentUserId!),
            Query.equal('movieId', movieId),
            Query.equal('type', 'progress'),
            Query.limit(1),
          ],
        );
        
        if (response.rows.length > 0) {
          const progress = response.rows[0].data['progress'] ?? 0.0;
          return typeof progress === 'number' ? progress : 0.0;
        }
      }
      
      return 0.0;
    } catch (e) {
      console.error('Error getting movie progress:', e);
      return 0.0;
    }
  }

  async toggleWishlist(movieId: string, add: boolean): Promise<boolean> {
    try {
      if (!(await this._ensureUserAuthenticated())) {
        return false;
      }
      
      // Check if any entry exists for this user and movie
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('movieId', movieId),
          Query.limit(1),
        ],
      );
      
      if (response.rows.length === 0) {
        // Create new entry with wishlist status
        await this._tablesDB.createRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          ID.unique(),
          {
            'userId': this._currentUserId!,
            'movieId': movieId,
            'type': add ? ['wishlist'] : [], // Use array instead of string
            'isWishlisted': add,
            'progress': 0.0, // Default values for other fields
            'rating': 0.0,
            'lastWatchedAt': Date.now(),
          },
        );
      } else {
        // Update existing entry
        const existingRow = response.rows[0];
        const currentTypes = Array.isArray(existingRow.data['type'])
          ? existingRow.data['type'] as string[]
          : [];
        
        // Update type array based on wishlist action
        let newTypes: string[] = [];
        if (add) {
          // Add 'wishlist' to types if not already present
          newTypes = [...currentTypes];
          if (!newTypes.includes('wishlist')) {
            newTypes.push('wishlist');
          }
        } else {
          // Remove 'wishlist' from types
          newTypes = currentTypes.filter(type => type !== 'wishlist');
        }
        
        await this._tablesDB.updateRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          existingRow.$id,
          {
            'isWishlisted': add,
            'type': newTypes,
          },
        );
      }
      
      return true;
    } catch (e) {
      console.error('Error toggling wishlist:', e);
      return false;
    }
  }

  async isMovieWishlisted(movieId: string): Promise<boolean> {
    try {
      if (!(await this._ensureUserAuthenticated())) return false;
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('movieId', movieId),
          Query.equal('isWishlisted', true),
          Query.limit(1),
        ],
      );
      
      return response.rows.length > 0;
    } catch (e) {
      console.error('Error checking if movie is wishlisted:', e);
      return false;
    }
  }

  async rateMovie(movieId: string, rating: number): Promise<boolean> {
    try {
      if (!(await this._ensureUserAuthenticated())) {
        return false;
      }
      
      // Check if any entry exists for this user and movie
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('movieId', movieId),
          Query.limit(1),
        ],
      );
      
      if (response.rows.length === 0) {
        // Create new entry with rating
        await this._tablesDB.createRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          ID.unique(),
          {
            'userId': this._currentUserId!,
            'movieId': movieId,
            'type': ['rating'], // Use array instead of string
            'rating': rating,
            'progress': 0.0, // Default values
            'isWishlisted': false,
            'lastWatchedAt': Date.now(),
          },
        );
      } else {
        // Update existing entry
        const existingRow = response.rows[0];
        const currentTypes = Array.isArray(existingRow.data['type'])
          ? existingRow.data['type'] as string[]
          : [];
        
        // Add 'rating' to types if not already present
        const newTypes = [...currentTypes];
        if (!newTypes.includes('rating')) {
          newTypes.push('rating');
        }
        
        await this._tablesDB.updateRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          'user_library',
          existingRow.$id,
          {
            'rating': rating,
            'type': newTypes, // Use array instead of string
          },
        );
      }
      
      return true;
    } catch (e) {
      console.error('Error rating movie:', e);
      return false;
    }
  }

  async getMovieRating(movieId: string): Promise<number> {
    try {
      if (!(await this._ensureUserAuthenticated())) return 0.0;
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('movieId', movieId),
          Query.isNotNull('rating'),
          Query.greaterThan('rating', 0.0),
          Query.limit(1),
        ],
      );
      
      if (response.rows.length > 0) {
        const rating = response.rows[0].data['rating'] ?? 0.0;
        return typeof rating === 'number' ? rating : 0.0;
      }
      
      return 0.0;
    } catch (e) {
      console.error('Error getting movie rating:', e);
      return 0.0;
    }
  }

  async getContinueWatchingMovies(): Promise<any[]> {
    try {
      if (!(await this._ensureUserAuthenticated())) return [];
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.greaterThan('progress', 0.0),
          Query.lessThan('progress', 0.95), // Not completely watched
          Query.orderDesc('lastWatchedAt'),
          Query.limit(10),
        ],
      );
      
      const result: any[] = [];
      const futures: Promise<void>[] = [];
      const movieDataMap: Record<string, any> = {};
      
      // First, collect all movie IDs and fetch them in parallel
      for (const row of response.rows) {
        const movieId = row.data['movieId'] as string;
        futures.push(this.getMovieById(movieId).then((movie) => {
          if (movie) {
            movieDataMap[movieId] = movie;
          }
        }));
      }
      
      // Wait for all movie fetches to complete
      await Promise.all(futures);
      
      // Now process the library rows with the fetched movie data
      for (const row of response.rows) {
        const movieId = row.data['movieId'] as string;
        const movie = movieDataMap[movieId];
        
        if (movie) {
          const progress = row.data['progress'] ?? 0.0;
          const lastWatchedAt = row.data['lastWatchedAt'] 
            ? new Date(row.data['lastWatchedAt'])
            : null;
          
          result.push({
            ...movie,
            'progress': progress,
            'lastWatchedAt': lastWatchedAt,
            'libraryItemId': row.$id,
          });
        }
      }
      
      return result;
    } catch (e) {
      console.error('Error getting continue watching movies:', e);
      return [];
    }
  }

  async getWishlistMovies(): Promise<any[]> {
    try {
      if (!(await this._ensureUserAuthenticated())) return [];
      
      const response = await this._tablesDB.listRows(
        process.env.NEXT_PUBLIC_DATABASE_ID || '',
        'user_library',
        [
          Query.equal('userId', this._currentUserId!),
          Query.equal('isWishlisted', true),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ],
      );
      
      const result: any[] = [];
      const futures: Promise<void>[] = [];
      const movieDataMap: Record<string, any> = {};
      
      // First, collect all movie IDs and fetch them in parallel
      for (const row of response.rows) {
        const movieId = row.data['movieId'] as string;
        futures.push(this.getMovieById(movieId).then((movie) => {
          if (movie) {
            movieDataMap[movieId] = movie;
          }
        }));
      }
      
      // Wait for all movie fetches to complete
      await Promise.all(futures);
      
      // Now process the library rows with the fetched movie data
      for (const row of response.rows) {
        const movieId = row.data['movieId'] as string;
        const movie = movieDataMap[movieId];
        
        if (movie) {
          result.push({
            ...movie,
            'libraryItemId': row.$id,
            'addedAt': row.$createdAt,
          });
        }
      }
      
      return result;
    } catch (e) {
      console.error('Error getting wishlist movies:', e);
      return [];
    }
  }

  // Helper Methods
  private async _processMovieDocumentsAsync(rows: any[]): Promise<any[]> {
    const processedMovies: any[] = [];
    const futures: Promise<void>[] = [];
    const movieData: Record<string, any> = {};
    
    // Phase 1: Process basic movie data
    for (const row of rows) {
      try {
        const movieId = row.$id;
        
        // Genre parsing
        let genres: string[] = [];
        if (row.data['genre']) {
          if (Array.isArray(row.data['genre'])) {
            genres = row.data['genre'] as string[];
          } else if (typeof row.data['genre'] === 'string') {
            genres = row.data['genre']
              .split(',')
              .map((g: string) => g.trim())
              .filter((g: string) => g.length > 0);
          }
        }
        if (genres.length === 0) genres = ['Action'];

        // Process video URL with enhanced error handling
        const rawVideoUrl = row.data['video_url'] ?? '';
        
        // Create basic movie object
        const movie: Record<string, any> = {
          'id': movieId,
          'title': row.data['title'] ?? 'Untitled Movie',
          'description': row.data['description'] ??
              row.data['ai_summary'] ??
              'No description available',
          'rating': this._parseToDouble(row.data['rating']) ?? 7.5,
          'year': row.data['release_year']?.toString() ??
              new Date().getFullYear().toString(),
          'duration': row.data['duration'] ?? '2h 0m',
          'genres': genres,
          'isPremium': row.data['premium_only'] ?? false,
          'rawVideoUrl': rawVideoUrl,
          'isFeatured': row.data['is_featured'] ?? false,
          'isTrending': row.data['is_trending'] ?? false,
          'viewCount': row.data['view_count'] ?? 0,
          'downloadCount': row.data['download_count'] ?? 0,
        };

        // Poster/image handling
        if (row.data['poster_url'] && row.data['poster_url'].length > 0) {
          movie['posterUrl'] = row.data['poster_url'];
        } else {
          const fallbackIndex = Math.abs(movieId.split('').reduce((a: any, b: string) => {
            return a + b.charCodeAt(0);
          }, 0) % 4) + 1;
          movie['posterUrl'] = `/images/poster${fallbackIndex}.jpg`;
        }
        
        movieData[movieId] = movie;
        
        // Phase 2: Prepare async operations for each movie
        if (rawVideoUrl) {
          // Handle video URL formatting
          futures.push(this._processVideoUrl(movieId, rawVideoUrl).then((videoData) => {
            Object.assign(movieData[movieId], videoData);
          }));
        } else {
          Object.assign(movieData[movieId], {
            'videoUrl': '',
            'videoUrls': {'sourceType': MovieService.SOURCE_BUNNY},
            'videoSourceType': MovieService.SOURCE_BUNNY,
            'streamingHeaders': {},
            'isReady': false,
          });
        }
        
        // Add user data if authenticated
        if (this._currentUserId) {
          // We'll bundle these requests to reduce load
          futures.push(this._getUserDataForMovie(movieId).then((userData) => {
            Object.assign(movieData[movieId], userData);
          }));
        } else {
          Object.assign(movieData[movieId], {
            'progress': 0.0,
            'userRating': 0.0,
            'isWishlisted': false,
          });
        }
      } catch (e) {
        console.error('Error processing movie document:', e);
        // Skip this document if processing fails
        continue;
      }
    }
    
    // Wait for all async operations to complete
    if (futures.length > 0) {
      await Promise.all(futures);
    }
    
    // Phase 3: Finalize and return processed movies
    for (const row of rows) {
      const movieId = row.$id;
      if (movieData[movieId]) {
        processedMovies.push(movieData[movieId]);
      }
    }
    
    return processedMovies;
  }
  
  // Helper to process video URLs asynchronously
  private async _processVideoUrl(movieId: string, rawVideoUrl: string): Promise<Record<string, any>> {
    try {
      // Detect video source
      const sourceInfo = this.detectVideoSource(rawVideoUrl);
      const videoSourceType = sourceInfo.type;
      
      const processedVideoUrl = await this.formatVideoUrl(rawVideoUrl);
      const videoUrls = await this.formatVideoUrls(rawVideoUrl, movieId);
      
      return {
        'videoUrl': processedVideoUrl,
        'videoUrls': videoUrls,
        'videoSourceType': videoSourceType,
        'streamingHeaders': this.getStreamingHeaders(processedVideoUrl),
        'isReady': !!processedVideoUrl,
      };
    } catch (e) {
      console.error('Error processing video URL:', e);
      return {
        'videoUrl': rawVideoUrl,
        'videoUrls': {'original': rawVideoUrl, 'sourceType': MovieService.SOURCE_BUNNY},
        'videoSourceType': MovieService.SOURCE_BUNNY,
        'streamingHeaders': {},
        'isReady': false,
      };
    }
  }
  
  // Helper to get user-specific data for a movie
  private async _getUserDataForMovie(movieId: string): Promise<Record<string, any>> {
    try {
      const progress = await this.getMovieProgress(movieId);
      const rating = await this.getMovieRating(movieId);
      const isWishlisted = await this.isMovieWishlisted(movieId);
      
      return {
        'progress': progress,
        'userRating': rating,
        'isWishlisted': isWishlisted,
      };
    } catch (e) {
      console.error('Error getting user data for movie:', e);
      return {
        'progress': 0.0,
        'userRating': 0.0,
        'isWishlisted': false,
      };
    }
  }

  private _parseToDouble(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  // Public Utility Methods
  async clearCache(): Promise<void> {
    this._progressCache.clear();
    this._movieListCache.clear();
    this._cacheExpiry.clear();
    this._allFeaturedMoviesCache = null;
    this._currentFeaturedSelection = null;
    this._featuredMoviesCacheTimestamp = null;
  }
  
  refreshFeaturedMovies(): void {
    this._currentFeaturedSelection = null;
  }
  
  async prepareMovieForPlayback(movie: any): Promise<VideoPlayerData> {
    const videoData = this._createVideoPlayerData(movie);
    
    // For premium content, check if user is premium or needs to watch an ad
    if (videoData.isPremium && !this._isPremiumUser) {
      videoData.requiresAdToPlay = true;
    }
    
    return videoData;
  }
  
  private _createVideoPlayerData(movie: any): VideoPlayerData {
    return {
      id: movie.id || '',
      title: movie.title || '',
      videoUrl: movie.videoUrl || '',
      videoUrls: movie.videoUrls || {},
      videoSourceType: movie.videoSourceType || MovieService.SOURCE_BUNNY,
      streamingHeaders: movie.streamingHeaders || {},
      thumbnailUrl: movie.posterUrl || '',
      description: movie.description || '',
      rating: typeof movie.rating === 'number' ? movie.rating : 0.0,
      year: movie.year?.toString() || '',
      duration: movie.duration || '',
      genres: Array.isArray(movie.genres) ? movie.genres : [],
      isPremium: !!movie.isPremium,
      isReady: !!movie.isReady,
      progress: typeof movie.progress === 'number' ? movie.progress : 0.0,
      userRating: typeof movie.userRating === 'number' ? movie.userRating : 0.0,
      isWishlisted: !!movie.isWishlisted,
      requiresAdToPlay: false,
    };
  }
  
  get isUserAuthenticated(): boolean {
    return !!this._currentUserId;
  }
  
  get currentUserId(): string | null {
    return this._currentUserId;
  }
}

// Hook for using MovieService in React components
export function useMovieService() {
  const [movieService] = useState(() => MovieService.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      const initService = async () => {
        await movieService.initialize();
        setIsInitialized(true);
      };
      
      initService();
    }
  }, [movieService, isInitialized]);
  
  return { movieService, isInitialized };
}