// services/movie_service.tsx
'use client'
import { Client, Databases, Storage, Account, ID, Models, Query, TablesDB } from 'appwrite';
import { useEffect, useState } from 'react';

// Types needed for the service
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

  getBestVideoUrl(): string;
  getAvailableQualities(): string[];
  readonly isYouTubeVideo: boolean;
  readonly isDailymotionVideo: boolean;
  readonly isBunnyVideo: boolean;
  readonly youtubeVideoId: string | null;
  readonly dailymotionVideoId: string | null;
  readonly dailymotionEmbedUrl: string | null;
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

  // Client services
  private _client: Client;
  private _databases: Databases;
  private _tablesDB: TablesDB;
  private _storage: Storage;
  private _account: Account;
  
  // Local cache for tracking progress temporarily
  private _progressCache: Map<string, any> = new Map();
  private _currentUserId: string | null = null;
  
  // User preferences for ads
  private _isPremiumUser = false;
  private _adViewCount = 0;
  private _lastAdShownTime: Date | null = null;
  
  // Constants for ad frequency control
  static readonly AD_VIEW_THRESHOLD = 3; // Show ad after this many free views
  static readonly AD_TIME_INTERVAL = 15 * 60 * 1000; // Minimum time between ads (15 min)
  
  // Video source types
  static readonly SOURCE_BUNNY = 'bunny';
  static readonly SOURCE_YOUTUBE = 'youtube';
  static readonly SOURCE_DAILYMOTION = 'dailymotion';
  
  // Featured movies cache and timestamp for rotation
  private _allFeaturedMoviesCache: any[] | null = null;
  private _featuredMoviesCacheTimestamp: Date | null = null;
  private _currentFeaturedSelection: any[] | null = null;
  
  // Constants for featured movies rotation
  static readonly FEATURED_SELECTION_SIZE = 5; // Number of featured movies to show at once
  static readonly FEATURED_CACHE_DURATION = 60 * 60 * 1000; // How long to keep all featured movies cached (60 min)
  static readonly FEATURED_ROTATION_INTERVAL = 10 * 60 * 1000; // How often to rotate featured selection (10 min)

  // Using memory cache for frequently used movie lists
  private _movieListCache: Map<string, any[]> = new Map();
  private _cacheExpiry: Map<string, Date> = new Map();
  static readonly _cacheDuration = 10 * 60 * 1000; // 10 minutes

  // Flag to check if user preferences collection exists
  private _userPreferencesCollectionExists = false;

  private constructor() {
    // Initialize client
    this._client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');
    
    this._databases = new Databases(this._client);
    this._tablesDB = new TablesDB(this._client);
    this._storage = new Storage(this._client);
    this._account = new Account(this._client);
  }

  async initialize(): Promise<void> {
    try {
      // Get user ID if logged in
      await this._updateCurrentUserId();
      
      // Check if user preferences collection exists
      await this._checkUserPreferencesCollection();
      
      // Only check premium status if user preferences collection exists
      if (this._userPreferencesCollectionExists) {
        await this._checkUserPremiumStatus();
      }
      
      // Load ad view tracking from storage
      this._loadAdViewTracking();
      
    } catch (e) {
      console.error('MovieService initialization error:', e);
      // Continue without blocking - important to not block the app
    }
  }

  private async _checkUserPreferencesCollection(): Promise<void> {
    try {
      const userPrefsCollectionId = process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences';
      
      // Try to list tables in the database to see if user_preferences exists
      const collections = await this._databases.listCollections(
        process.env.NEXT_PUBLIC_DATABASE_ID || ''
      );
      
      this._userPreferencesCollectionExists = collections.collections.some(
        collection => collection.$id === userPrefsCollectionId
      );
      
    } catch (e) {
      console.error('Error checking user preferences collection:', e);
      this._userPreferencesCollectionExists = false;
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
    if (this._currentUserId === null) {
      await this._updateCurrentUserId();
    }
    return this._currentUserId !== null;
  }
  
  // User preferences and ad management
  private async _checkUserPremiumStatus(): Promise<void> {
    try {
      if (!this._userPreferencesCollectionExists) {
        this._isPremiumUser = false;
        return;
      }
      
      if (await this._ensureUserAuthenticated()) {
        // Check premium status from user preferences in database
        try {
          const response = await this._databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID || '',
            process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
            [
              Query.equal('userId', this._currentUserId!),
              Query.limit(1),
            ]
          );
          
          if (response.documents.length > 0) {
            const userPrefs = response.documents[0];
            this._isPremiumUser = userPrefs.is_premium || false;
          }
        } catch (e) {
          console.error('Error checking premium status from database:', e);
          this._isPremiumUser = false;
        }
      } else {
        this._isPremiumUser = false;
      }
    } catch (e) {
      console.error('Error in _checkUserPremiumStatus:', e);
      this._isPremiumUser = false;
    }
  }
  
  get isPremiumUser(): boolean {
    return this._isPremiumUser;
  }
  
  async setPremiumUser(isPremium: boolean): Promise<void> {
    this._isPremiumUser = isPremium;
    
    // Update in database if user is authenticated and collection exists
    if (this._currentUserId && this._userPreferencesCollectionExists) {
      await this._updateUserPremiumStatus(isPremium);
    }
  }
  
  private async _updateUserPremiumStatus(isPremium: boolean): Promise<void> {
    if (!this._userPreferencesCollectionExists) return;
    
    try {
      if (await this._ensureUserAuthenticated()) {
        const response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
          [
            Query.equal('userId', this._currentUserId!),
            Query.limit(1),
          ]
        );
        
        if (response.documents.length === 0) {
          // Create new preferences
          await this._databases.createDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID || '',
            process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
            ID.unique(),
            {
              userId: this._currentUserId!,
              is_premium: isPremium,
              ad_preferences: {
                view_count: this._adViewCount,
                last_ad_time: this._lastAdShownTime?.getTime(),
              },
            }
          );
        } else {
          // Update existing preferences
          await this._databases.updateDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID || '',
            process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
            response.documents[0].$id,
            {
              is_premium: isPremium,
            }
          );
        }
      }
    } catch (e) {
      console.error('Error updating premium status:', e);
    }
  }
  
  private _loadAdViewTracking(): void {
    try {
      if (typeof window !== 'undefined') {
        const savedTracking = localStorage.getItem('adViewTracking');
        if (savedTracking) {
          const tracking = JSON.parse(savedTracking);
          this._adViewCount = tracking.viewCount || 0;
          this._lastAdShownTime = tracking.lastAdTime ? new Date(tracking.lastAdTime) : null;
        }
      }
    } catch (e) {
      // Use defaults
      this._adViewCount = 0;
      this._lastAdShownTime = null;
    }
  }
  
  private _updateAdViewTracking(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('adViewTracking', JSON.stringify({
          viewCount: this._adViewCount,
          lastAdTime: this._lastAdShownTime?.getTime()
        }));
      }
      
      if (this._userPreferencesCollectionExists && this._ensureUserAuthenticated()) {
        this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
          [
            Query.equal('userId', this._currentUserId!),
            Query.limit(1),
          ]
        ).then(response => {
          if (response.documents.length > 0) {
            this._databases.updateDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID || '',
              process.env.NEXT_PUBLIC_USER_PREFERENCES_COLLECTION_ID || 'user_preferences',
              response.documents[0].$id,
              {
                ad_preferences: {
                  view_count: this._adViewCount,
                  last_ad_time: this._lastAdShownTime?.getTime(),
                }
              }
            );
          }
        });
      }
    } catch (e) {
      console.error('Error updating ad view tracking:', e);
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
  
  // Bunny.net Stream Configuration
  private _getBunnyApiHeaders(): Record<string, string> {
    return {
      'AccessKey': process.env.BUNNY_API_KEY || '',
      'Content-Type': 'application/json',
      'User-Agent': 'DJAfroMoviesBox/1.0.0',
      'Accept': 'application/json',
    };
  }

  private _getBunnyStreamingHeaders(): Record<string, string> {
    // Web browsers need simpler headers
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
  }

  private _extractBunnyVideoInfo(url: string): Record<string, string> {
    try {
      // Handle iframe URLs
      if (url.includes('iframe.mediadelivery.net/play/')) {
        const uri = new URL(url);
        const segments = uri.pathname.split('/').filter(segment => segment);
        
        if (segments.length >= 3 && segments[0] === 'play') {
          const libraryId = segments[1];
          const videoId = segments[2];
          
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
        const pathSegments = uri.pathname.split('/').filter(segment => segment);
        
        if (pathSegments.length > 0) {
          const videoId = pathSegments[0];
          
          // Extract library ID from hostname
          const libraryMatch = /vz-([a-f0-9-]+)-/.exec(host);
          const libraryId = libraryMatch?.[1] || '';
          
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
        const segments = uri.pathname.split('/').filter(segment => segment);
        
        if (segments.length >= 3 && segments[0] === 'embed') {
          const libraryId = segments[1];
          const videoId = segments[2];
          
          return {
            'libraryId': libraryId,
            'videoId': videoId,
            'pullZone': `vz-${libraryId}-17b.b-cdn.net`,
          };
        }
      }
    } catch (e) {
      // Error extracting video info
    }
    
    return {};
  }

  private async _getBunnyVideoInfo(libraryId: string, videoId: string): Promise<any | null> {
    try {
      const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getBunnyApiHeaders(),
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  // Video URL Processing
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
        const uri = new URL(normalizedUrl);
        const segments = uri.pathname.split('/').filter(segment => segment);
        if (segments.length > 0) {
          videoId = segments[segments.length - 1];
        }
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(normalizedUrl)) {
        // Already a YouTube video ID
        videoId = normalizedUrl;
      }
      
      if (videoId) {
        return { type: MovieService.SOURCE_YOUTUBE, url: normalizedUrl, videoId };
      }
    }
    
    // Check for Dailymotion URLs
    if (normalizedUrl.includes('dailymotion.com/embed/video/') || 
        normalizedUrl.includes('dai.ly/')) {
      
      // Extract video ID from Dailymotion URL
      let videoId = '';
      
      if (normalizedUrl.includes('dailymotion.com/embed/video/')) {
        const uri = new URL(normalizedUrl);
        const segments = uri.pathname.split('/').filter(segment => segment);
        if (segments.length > 2) {
          videoId = segments[segments.length - 1];
        }
      } else if (normalizedUrl.includes('dai.ly/')) {
        const uri = new URL(normalizedUrl);
        const segments = uri.pathname.split('/').filter(segment => segment);
        if (segments.length > 0) {
          videoId = segments[segments.length - 1];
        }
      }
      
      if (videoId) {
        return { type: MovieService.SOURCE_DAILYMOTION, url: normalizedUrl, videoId };
      }
    }
    
    // Unknown URL type - try to handle as Bunny Stream
    return { type: MovieService.SOURCE_BUNNY, url: normalizedUrl };
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
        // Check if it's already a Bunny CDN URL - use directly!
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
        
        const libraryId = videoInfo['libraryId']!;
        const bunnyVideoId = videoInfo['videoId']!;
        const pullZone = videoInfo['pullZone']!;
        
        // Generate video URLs based on platform
        const videoUrls: Record<string, string> = {};
        videoUrls['sourceType'] = MovieService.SOURCE_BUNNY;
        
        // For web, prefer MP4 over HLS due to browser limitations
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
      
      // For Bunny Stream, use existing logic
      
      // DIRECT BUNNY URLs should be used as-is
      if (url.includes('b-cdn.net')) {
        return url;
      }
      
      const videoUrls = await this.formatVideoUrls(url, '');
      
      // For web, prefer MP4 formats
      if (videoUrls['720p']) {
        return videoUrls['720p'];
      }
      if (videoUrls['480p']) {
        return videoUrls['480p'];
      }
      if (videoUrls['hls']) {
        return videoUrls['hls'];
      }
      
      // Fallback
      return videoUrls['original'] || url;
      
    } catch (e) {
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
    
    // For Bunny Stream, use existing logic
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
      
      // For Bunny Stream, use existing logic
      const response = await fetch(url, {
        method: 'HEAD',
        headers: this.getStreamingHeaders(url),
      });
      
      return response.status === 200 || response.status === 206;
    } catch (e) {
      return false;
    }
  }

  // Movie Fetching Methods
  async getMovieById(movieId: string): Promise<any | null> {
    try {
      // Try using TablesDB first (new API)
      try {
        const response = await this._tablesDB.getRow(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          movieId
        );
        
        const processedMovies = await this._processMovieDocumentsAsync([response]);
        return processedMovies.length > 0 ? processedMovies[0] : null;
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        const response = await this._databases.getDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          movieId
        );
        
        const processedMovies = await this._processMovieDocumentsAsync([response]);
        return processedMovies.length > 0 ? processedMovies[0] : null;
      }
    } catch (e) {
      console.error('Error fetching movie by ID:', e);
      return null;
    }
  }

  getEmptyStateMovie(): any {
    return {
      'id': 'empty_state',
      'title': 'No Movies Available',
      'description': 'Check back later for new content.',
      'posterUrl': 'assets/images/poster1.jpg',
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
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      const result = await this._processMovieDocumentsAsync(response.documents);
      
      // Sort by rating and limit to 15
      result.sort((a, b) => b.rating - a.rating);
      const limitedResult = result.slice(0, 15);
      
      // For non-premium users, inject banner ad placeholder into the results
      if (!this._isPremiumUser && limitedResult.length > 5) {
        // Inject an ad card every 5 movies
        limitedResult.splice(5, 0, {
          'id': 'ad_trending_banner',
          'isAdPlaceholder': true,
          'adType': 'banner',
        });
      }
      
      // Cache the result
      this._movieListCache.set(cacheKey, limitedResult);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + MovieService._cacheDuration));
      
      return limitedResult;
    } catch (e) {
      console.error('Error fetching trending movies:', e);
      return [];
    }
  }

  async getDjAfroSpecials(): Promise<any[]> {
    const cacheKey = 'dj_afro_specials';
    
    // Check cache first
    if (this._movieListCache.has(cacheKey)) {
      const expiry = this._cacheExpiry.get(cacheKey);
      if (expiry && expiry > new Date()) {
        return [...this._movieListCache.get(cacheKey)!];
      }
    }
    
    try {
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      const result = await this._processMovieDocumentsAsync(response.documents);
      
      // Sort by rating
      result.sort((a, b) => b.rating - a.rating);
      
      // For non-premium users, inject ad placeholders into the results
      if (!this._isPremiumUser && result.length > 20) {
        // Add native ad after 8th movie
        result.splice(8, 0, {
          'id': 'ad_specials_native_1',
          'isAdPlaceholder': true,
          'adType': 'native',
        });
        
        // Add banner ad after 20th movie
        result.splice(20, 0, {
          'id': 'ad_specials_banner_1',
          'isAdPlaceholder': true,
          'adType': 'banner',
        });
      }
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + MovieService._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error fetching DJ Afro specials:', e);
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
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      const result = await this._processMovieDocumentsAsync(response.documents);
      
      // Sort by creation date
      result.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
      const limitedResult = result.slice(0, 12);
      
      // Cache the result
      this._movieListCache.set(cacheKey, limitedResult);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + MovieService._cacheDuration));
      
      return limitedResult;
    } catch (e) {
      console.error('Error fetching new releases:', e);
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
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      // Filter documents by genre manually
      const filtered = response.documents.filter((doc: any) => {
        if (!doc.genre) return false;
        if (Array.isArray(doc.genre)) {
          return doc.genre.includes(genre);
        }
        if (typeof doc.genre === 'string') {
          return doc.genre.split(',').map(g => g.trim()).includes(genre);
        }
        return false;
      }).slice(0, 15);
      
      const result = await this._processMovieDocumentsAsync(filtered);
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + MovieService._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error fetching movies by genre:', e);
      return [];
    }
  }
  
  async getPopularDownloads(): Promise<any[]> {
    const cacheKey = 'popular_downloads';
    
    // Check cache first
    if (this._movieListCache.has(cacheKey)) {
      const expiry = this._cacheExpiry.get(cacheKey);
      if (expiry && expiry > new Date()) {
        return [...this._movieListCache.get(cacheKey)!];
      }
    }
    
    try {
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      // Sort by download count
      const sorted = response.documents.sort((a: any, b: any) => {
        const countA = a.download_count || 0;
        const countB = b.download_count || 0;
        return countB - countA;
      }).slice(0, 10);
      
      const result = await this._processMovieDocumentsAsync(sorted);
      
      // Cache the result
      this._movieListCache.set(cacheKey, result);
      this._cacheExpiry.set(cacheKey, new Date(Date.now() + MovieService._cacheDuration));
      
      return result;
    } catch (e) {
      console.error('Error fetching popular downloads:', e);
      return [];
    }
  }

  // Modified method to get ALL featured movies and randomize display
  private async _getAllFeaturedMovies(): Promise<any[]> {
    try {
      // Check if we already have a cached list of all featured movies
      if (this._allFeaturedMoviesCache && this._featuredMoviesCacheTimestamp) {
        const cacheAge = Date.now() - this._featuredMoviesCacheTimestamp.getTime();
        
        // Use cached list if it's still fresh (less than the cache duration)
        if (cacheAge < MovieService.FEATURED_CACHE_DURATION) {
          return this._allFeaturedMoviesCache;
        }
      }
      
      // Fetch all featured movies with a higher limit
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      // Filter documents by is_featured manually
      const featured = response.documents.filter((doc: any) => doc.is_featured === true);
      
      const result = await this._processMovieDocumentsAsync(featured.slice(0, 50));
      
      // Update cache
      this._allFeaturedMoviesCache = result;
      this._featuredMoviesCacheTimestamp = new Date();
      
      return result;
    } catch (e) {
      console.error('Error fetching all featured movies:', e);
      // If there's an error, return empty list or fallback
      return this._getFallbackFeaturedMovies();
    }
  }

  // Modified method to get a random selection of featured movies
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
            const randomIndex = Math.floor(Math.random() * availableMovies.length);
            selectedMovies.push(availableMovies.splice(randomIndex, 1)[0]);
          }
          
          // Update current selection
          this._currentFeaturedSelection = selectedMovies;
        } else {
          // Not enough movies to randomize, use all available
          this._currentFeaturedSelection = allFeatured;
        }
      }
      
      return this._currentFeaturedSelection || [];
    } catch (e) {
      console.error('Error fetching featured movies:', e);
      return this._getFallbackFeaturedMovies();
    }
  }

  async searchMovies(query: string): Promise<any[]> {
    try {
      if (!query.trim()) return [];
      
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      // Manual search since we can't use appwrite search on client
      const searchTerms = query.trim().toLowerCase().split(/\s+/);
      const filtered = response.documents.filter((doc: any) => {
        if (!doc.title) return false;
        const title = doc.title.toLowerCase();
        return searchTerms.some(term => title.includes(term));
      }).slice(0, 20);
      
      return await this._processMovieDocumentsAsync(filtered);
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
  }): Promise<any[]> {
    try {
      let response;
      
      try {
        // Try TablesDB first
        response = await this._tablesDB.listRows(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      } catch (tablesError) {
        console.log('TablesDB API failed, falling back to legacy API', tablesError);
        
        // Fallback to legacy API
        response = await this._databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_MOVIES_COLLECTION_ID || '',
          []
        );
      }
      
      let filtered = response.documents;
      
      // Filter by genre if specified
      if (genre && genre !== 'All') {
        filtered = filtered.filter((doc: any) => {
          if (!doc.genre) return false;
          if (Array.isArray(doc.genre)) {
            return doc.genre.includes(genre);
          }
          if (typeof doc.genre === 'string') {
            return doc.genre.split(',').map(g => g.trim()).includes(genre);
          }
          return false;
        });
      }
      
      // Sort results
      filtered.sort((a: any, b: any) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        
        // Handle special cases
        if (sortBy === '$createdAt' || sortBy === '$updatedAt') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        
        // Handle strings
        if (typeof valA === 'string' && typeof valB === 'string') {
          return ascending 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        // Handle numbers
        return ascending 
          ? (valA ?? 0) - (valB ?? 0) 
          : (valB ?? 0) - (valA ?? 0);
      });
      
      // Apply pagination
      const paginatedResults = filtered.slice(offset, offset + limit);
      
      const result = await this._processMovieDocumentsAsync(paginatedResults);
      
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
      console.error('Error fetching all movies:', e);
      return [];
    }
  }
  
  // Enhanced Movie Processing
  private async _processMovieDocumentsAsync(documents: any[]): Promise<any[]> {
    if (!documents || documents.length === 0) {
      return [];
    }
    
    const processedMovies: any[] = [];
    const movieData: Record<string, any> = {};
    
    // Phase 1: Process basic movie data
    for (const doc of documents) {
      try {
        if (!doc || !doc.$id) continue; // Skip invalid documents
        
        const movieId = doc.$id;
        
        // Genre parsing
        let genres: string[] = [];
        if (doc.genre) {
          if (Array.isArray(doc.genre)) {
            genres = doc.genre;
          } else if (typeof doc.genre === 'string') {
            genres = doc.genre
                .split(',')
                .map((g: string) => g.trim())
                .filter((g: string) => g);
          }
        }
        if (genres.length === 0) genres = ['Action'];

        // Process video URL with enhanced error handling
        const rawVideoUrl = doc.video_url || '';
        
        // Create basic movie object
        const movie: any = {
          'id': movieId,
          'title': doc.title || 'Untitled Movie',
          'description': doc.description ||
              doc.ai_summary ||
              'No description available',
          'rating': this._parseToDouble(doc.rating) ?? 7.5,
          'year': doc.release_year?.toString() ||
              new Date().getFullYear().toString(),
          'duration': doc.duration || '2h 0m',
          'genres': genres,
          'isPremium': doc.premium_only ?? false,
          'rawVideoUrl': rawVideoUrl,
          'isFeatured': doc.is_featured ?? false,
          'isTrending': doc.is_trending ?? false,
          'viewCount': doc.view_count ?? 0,
          'downloadCount': doc.download_count ?? 0,
          '$createdAt': doc.$createdAt,
          '$updatedAt': doc.$updatedAt,
        };

        // Poster/image handling
        if (doc.poster_url && doc.poster_url.toString()) {
          movie['posterUrl'] = doc.poster_url;
        } else {
          const fallbackIndex = (movie['id'].split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 4) + 1;
          movie['posterUrl'] = `assets/images/poster${fallbackIndex}.jpg`;
        }
        
        movieData[movieId] = movie;
        
        // Phase 2: Process video URL (synchronously for web version)
        if (rawVideoUrl) {
          // Handle video URL formatting
          const videoData = await this._processVideoUrl(movieId, rawVideoUrl);
          Object.assign(movieData[movieId], videoData);
        } else {
          Object.assign(movieData[movieId], {
            'videoUrl': '',
            'videoUrls': {'sourceType': MovieService.SOURCE_BUNNY},
            'videoSourceType': MovieService.SOURCE_BUNNY,
            'streamingHeaders': {},
            'isReady': false,
          });
        }
        
        // Add default user data
        Object.assign(movieData[movieId], {
          'progress': 0.0,
          'userRating': 0.0,
          'isWishlisted': false,
        });
        
      } catch (e) {
        // Skip this document if processing fails
        console.error('Error processing movie:', e);
        continue;
      }
    }
    
    // Phase 3: Finalize and return processed movies
    for (const doc of documents) {
      if (!doc || !doc.$id) continue;
      
      const movieId = doc.$id;
      if (movieData[movieId]) {
        processedMovies.push(movieData[movieId]);
      }
    }
    
    return processedMovies;
  }
  
  // Helper to process video URLs
  private async _processVideoUrl(movieId: string, rawVideoUrl: string): Promise<any> {
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
        'isReady': processedVideoUrl ? true : false,
      };
    } catch (e) {
      return {
        'videoUrl': rawVideoUrl,
        'videoUrls': {'original': rawVideoUrl, 'sourceType': MovieService.SOURCE_BUNNY},
        'videoSourceType': MovieService.SOURCE_BUNNY,
        'streamingHeaders': {},
        'isReady': false,
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

  private _getFallbackFeaturedMovies(): any[] {
    return [
      {
        'id': 'fallback_featured_1',
        'title': 'Action Hero Returns',
        'description': 'The ultimate action-packed thriller.',
        'imageAsset': 'assets/images/banner1.jpg',
        'posterUrl': 'assets/images/poster1.jpg',
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

  // Force refresh of featured movies selection
  refreshFeaturedMovies(): void {
    this._currentFeaturedSelection = null;
  }

  // Utility Methods
  async clearCache(): Promise<void> {
    try {
      this._progressCache.clear();
      this._movieListCache.clear();
      this._cacheExpiry.clear();
      this._allFeaturedMoviesCache = null;
      this._currentFeaturedSelection = null;
      this._featuredMoviesCacheTimestamp = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adViewTracking');
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
  
  get isUserAuthenticated(): boolean {
    return this._currentUserId !== null;
  }
  
  get currentUserId(): string | null {
    return this._currentUserId;
  }
}

// Implementation of VideoPlayerData
export class VideoPlayerDataImpl implements VideoPlayerData {
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

  constructor({
    id,
    title,
    videoUrl,
    videoUrls,
    videoSourceType,
    streamingHeaders,
    thumbnailUrl,
    description,
    rating,
    year,
    duration,
    genres,
    isPremium,
    isReady = false,
    progress = 0.0,
    userRating = 0.0,
    isWishlisted = false,
    requiresAdToPlay = false,
  }: {
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
    isReady?: boolean;
    progress?: number;
    userRating?: number;
    isWishlisted?: boolean;
    requiresAdToPlay?: boolean;
  }) {
    this.id = id;
    this.title = title;
    this.videoUrl = videoUrl;
    this.videoUrls = videoUrls;
    this.videoSourceType = videoSourceType;
    this.streamingHeaders = streamingHeaders;
    this.thumbnailUrl = thumbnailUrl;
    this.description = description;
    this.rating = rating;
    this.year = year;
    this.duration = duration;
    this.genres = genres;
    this.isPremium = isPremium;
    this.isReady = isReady;
    this.progress = progress;
    this.userRating = userRating;
    this.isWishlisted = isWishlisted;
    this.requiresAdToPlay = requiresAdToPlay;
  }

  static fromMovie(movie: any): VideoPlayerData {
    return new VideoPlayerDataImpl({
      id: movie.id,
      title: movie.title,
      videoUrl: movie.videoUrl || '',
      videoUrls: movie.videoUrls || {},
      videoSourceType: movie.videoSourceType || MovieService.SOURCE_BUNNY,
      streamingHeaders: movie.streamingHeaders || {},
      thumbnailUrl: movie.posterUrl,
      description: movie.description,
      rating: movie.rating ?? 0.0,
      year: movie.year.toString(),
      duration: movie.duration,
      genres: movie.genres || [],
      isPremium: movie.isPremium || false,
      isReady: movie.isReady || false,
      progress: movie.progress ?? 0.0,
      userRating: movie.userRating ?? 0.0,
      isWishlisted: movie.isWishlisted || false,
    });
  }

  getBestVideoUrl(): string {
    if (this.videoSourceType === MovieService.SOURCE_YOUTUBE) {
      return this.videoUrls['youtube'] || this.videoUrl;
    }
    
    if (this.videoSourceType === MovieService.SOURCE_DAILYMOTION) {
      return this.videoUrls['dailymotion'] || this.videoUrl;
    }
    
    return this.videoUrls['720p'] || this.videoUrls['480p'] || this.videoUrls['360p'] || this.videoUrls['hls'] || this.videoUrl;
  }

  getAvailableQualities(): string[] {
    if (this.videoSourceType === MovieService.SOURCE_YOUTUBE || 
        this.videoSourceType === MovieService.SOURCE_DAILYMOTION) {
      return [];
    }
    
    return Object.keys(this.videoUrls).filter(key => 
        key !== 'original' && 
        key !== 'sourceType' && 
        key !== 'youtube' && 
        key !== 'dailymotion' && 
        key !== 'embed'
    );
  }
  
  get isYouTubeVideo(): boolean { 
    return this.videoSourceType === MovieService.SOURCE_YOUTUBE; 
  }
  
  get isDailymotionVideo(): boolean { 
    return this.videoSourceType === MovieService.SOURCE_DAILYMOTION; 
  }
  
  get isBunnyVideo(): boolean { 
    return this.videoSourceType === MovieService.SOURCE_BUNNY; 
  }
  
  get youtubeVideoId(): string | null { 
    return this.isYouTubeVideo ? (this.videoUrls['youtube'] || null) : null; 
  }
  
  get dailymotionVideoId(): string | null { 
    return this.isDailymotionVideo ? (this.videoUrls['dailymotion'] || null) : null; 
  }
  
  get dailymotionEmbedUrl(): string | null { 
    return this.isDailymotionVideo ? (this.videoUrls['embed'] || null) : null; 
  }
}

// Hook for using the movie service
export function useMovieService() {
  const [service] = useState(() => MovieService.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initService = async () => {
      await service.initialize();
      setIsInitialized(true);
    };
    
    initService();
  }, [service]);
  
  return { service, isInitialized };
}