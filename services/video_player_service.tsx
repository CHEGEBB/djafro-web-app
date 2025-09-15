/* eslint-disable @typescript-eslint/no-explicit-any */
// services/video_player_service.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import screenfull from 'screenfull';
import { Movie } from './movie_service';

// Define supported video source types
export const SOURCE_BUNNY = 'bunny';
export const SOURCE_YOUTUBE = 'youtube';
export const SOURCE_DAILYMOTION = 'dailymotion';

// Player state types
export interface PlayerState {
  playing: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  played: number;
  loaded: number;
  duration: number;
  seeking: boolean;
  fullscreen: boolean;
  buffering: boolean;
  error: string | null;
  currentQuality: string;
  availableQualities: string[];
}

// Video player component props
export interface VideoPlayerProps {
  movie: Movie;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: any) => void;
  autoPlay?: boolean;
  initialProgress?: number;
  showControls?: boolean;
}

// Video URL processing functions
const extractBunnyVideoInfo = (url: string): Record<string, string> => {
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
};

const detectVideoSource = (url: string): { type: string; url: string; videoId?: string } => {
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
};

const formatVideoUrls = async (baseUrl: string): Promise<Record<string, string>> => {
  if (!baseUrl) {
    return {};
  }

  try {
    const sourceInfo = detectVideoSource(baseUrl);
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
      
      // Format embed URL properly
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
      const videoInfo = extractBunnyVideoInfo(baseUrl);
      if (Object.keys(videoInfo).length === 0) {
        return { original: baseUrl, sourceType: SOURCE_BUNNY };
      }
      
      const { libraryId, videoId, pullZone } = videoInfo;
      
      // Generate video URLs
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
};

// Use this hook to manage video player state and controls
export const useVideoPlayer = (movie: Movie, options?: {
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  initialProgress?: number;
}) => {
  const {
    onProgress,
    onEnded,
    autoPlay = true,
    initialProgress = 0
  } = options || {};

  // Refs
  const playerRef = useRef<ReactPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [playerState, setPlayerState] = useState<PlayerState>({
    playing: autoPlay,
    volume: 1,
    muted: false,
    playbackRate: 1.0,
    played: initialProgress,
    loaded: 0,
    duration: 0,
    seeking: false,
    fullscreen: false,
    buffering: false,
    error: null,
    currentQuality: 'auto',
    availableQualities: []
  });

  const [showControls, setShowControls] = useState(true);
  const [sourceType, setSourceType] = useState<string>(SOURCE_BUNNY);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [processedVideoUrls, setProcessedVideoUrls] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Setup video sources and determine the source type
  useEffect(() => {
    if (!movie) return;

    console.log('Setting up video for movie:', movie.title);
    console.log('Movie video data:', { videoUrl: movie.videoUrl, videoUrls: movie.videoUrls });

    const setupVideo = async () => {
      let sourceUrl = '';
      let detectedSourceType = SOURCE_BUNNY;

      // First, try to format the video URLs properly
      const formattedUrls = await formatVideoUrls(movie.videoUrl || '');
      setProcessedVideoUrls(formattedUrls);
      
      detectedSourceType = formattedUrls.sourceType || SOURCE_BUNNY;

      if (detectedSourceType === SOURCE_YOUTUBE) {
        sourceUrl = formattedUrls.youtube || movie.videoUrl || '';
      } else if (detectedSourceType === SOURCE_DAILYMOTION) {
        sourceUrl = formattedUrls.dailymotion || formattedUrls.embed || movie.videoUrl || '';
      } else {
        // For Bunny Stream, prefer the best quality available
        if (formattedUrls['720p']) {
          sourceUrl = formattedUrls['720p'];
          setPlayerState(prev => ({...prev, currentQuality: '720p'}));
        } else if (formattedUrls['480p']) {
          sourceUrl = formattedUrls['480p'];
          setPlayerState(prev => ({...prev, currentQuality: '480p'}));
        } else if (formattedUrls['hls']) {
          sourceUrl = formattedUrls['hls'];
          setPlayerState(prev => ({...prev, currentQuality: 'hls'}));
        } else if (formattedUrls['original']) {
          sourceUrl = formattedUrls['original'];
        } else if (movie.videoUrl) {
          sourceUrl = movie.videoUrl;
        }
      }

      console.log('Selected video URL:', sourceUrl);
      console.log('Source type:', detectedSourceType);

      setSourceType(detectedSourceType);
      setVideoUrl(sourceUrl);
      setDebugInfo({
        sourceUrl,
        sourceType: detectedSourceType,
        canPlay: ReactPlayer.canPlay(sourceUrl),
        formattedUrls,
        movieData: movie
      });

      // Set available qualities
      const qualities = Object.keys(formattedUrls).filter(key => 
        key !== 'sourceType' && 
        key !== 'original' && 
        key !== 'youtube' && 
        key !== 'dailymotion' && 
        key !== 'embed' &&
        key !== 'hls'
      );

      setPlayerState(prev => ({
        ...prev,
        availableQualities: qualities
      }));
    };

    setupVideo();
  }, [movie]);

  // Set up auto-hide controls
  useEffect(() => {
    if (showControls && playerState.playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, playerState.playing]);

  // Save progress periodically
  useEffect(() => {
    if (!playerState.seeking && playerState.played > 0 && onProgress) {
      const progressTimer = setInterval(() => {
        onProgress(playerState.played);
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(progressTimer);
    }
    return undefined;
  }, [playerState.seeking, playerState.played, onProgress]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setPlayerState(prev => ({...prev, playing: !prev.playing}));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setPlayerState(prev => ({...prev, muted: !prev.muted}));
  }, []);

  // Seek to specific time (0-1 range)
  const seekTo = useCallback((value: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value, 'fraction');
    }
    setPlayerState(prev => ({...prev, played: value}));
  }, []);

  // Handle seeking operations
  const handleSeekStart = useCallback(() => {
    setPlayerState(prev => ({...prev, seeking: true}));
  }, []);

  const handleSeekChange = useCallback((newValue: number) => {
    setPlayerState(prev => ({...prev, played: newValue}));
  }, []);

  const handleSeekEnd = useCallback((newValue: number) => {
    setPlayerState(prev => ({...prev, seeking: false}));
    seekTo(newValue);
  }, [seekTo]);

  // Skip forward/backward
  const skipForward = useCallback((seconds: number = 10) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerState.duration;
      const newTime = Math.min(currentTime + seconds, duration);
      playerRef.current.seekTo(newTime, 'seconds');
    }
  }, [playerState.duration]);

  const skipBackward = useCallback((seconds: number = 10) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const newTime = Math.max(currentTime - seconds, 0);
      playerRef.current.seekTo(newTime, 'seconds');
    }
  }, []);

  // Change volume
  const changeVolume = useCallback((newVolume: number) => {
    setPlayerState(prev => ({
      ...prev, 
      volume: newVolume,
      muted: newVolume === 0
    }));
  }, []);

  // Change playback rate
  const changePlaybackRate = useCallback((rate: number) => {
    setPlayerState(prev => ({...prev, playbackRate: rate}));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current && screenfull.isEnabled) {
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request(containerRef.current);
      }
      setPlayerState(prev => ({...prev, fullscreen: !prev.fullscreen}));
    }
  }, []);

  // Change video quality
  const changeQuality = useCallback((quality: string) => {
    if (quality === playerState.currentQuality) return;
    
    if (processedVideoUrls && processedVideoUrls[quality]) {
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      setVideoUrl(processedVideoUrls[quality]);
      
      // After source change, seek to previous position
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(currentTime, 'seconds');
        }
      }, 500);
    }
    
    setPlayerState(prev => ({...prev, currentQuality: quality}));
  }, [processedVideoUrls, playerState.currentQuality]);

  // Handle player progress
  const handleProgress = useCallback(({ played, loaded }: { played: number, loaded: number }) => {
    if (!playerState.seeking) {
      setPlayerState(prev => ({...prev, played, loaded}));
    }
  }, [playerState.seeking]);

  // Handle player buffer start
  const handleBufferStart = useCallback(() => {
    console.log('Video buffering started');
    setPlayerState(prev => ({...prev, buffering: true}));
  }, []);

  // Handle player buffer end
  const handleBufferEnd = useCallback(() => {
    console.log('Video buffering ended');
    setPlayerState(prev => ({...prev, buffering: false}));
  }, []);

  // Handle player ready state
  const handleReady = useCallback(() => {
    console.log('Video player ready');
    setIsReady(true);
    
    // Seek to initial position if provided
    if (initialProgress > 0 && playerRef.current) {
      playerRef.current.seekTo(initialProgress, 'fraction');
    }
  }, [initialProgress]);

  // Handle errors
  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error);
    setPlayerState(prev => ({
      ...prev, 
      error: error?.message || 'An error occurred while playing the video'
    }));
  }, []);

  // Handle player ending
  const handleEnded = useCallback(() => {
    if (onEnded) {
      onEnded();
    }
    setPlayerState(prev => ({...prev, playing: false}));
  }, [onEnded]);

  // Handle duration change
  const handleDuration = useCallback((duration: number) => {
    console.log('Video duration:', duration);
    setPlayerState(prev => ({...prev, duration}));
  }, []);

  // Handle controls visibility
  const handleToggleControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(prev => !prev);
  }, []);

  // Helper for formatting time
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }, []);

  return {
    playerRef,
    containerRef,
    playerState,
    showControls,
    isReady,
    sourceType,
    videoUrl,
    processedVideoUrls,
    debugInfo,
    togglePlay,
    toggleMute,
    seekTo,
    handleSeekStart,
    handleSeekChange,
    handleSeekEnd,
    skipForward,
    skipBackward,
    changeVolume,
    changePlaybackRate,
    toggleFullscreen,
    changeQuality,
    handleProgress,
    handleBufferStart,
    handleBufferEnd,
    handleReady,
    handleError,
    handleEnded,
    handleDuration,
    handleToggleControls,
    formatTime
  };
};

// Video Player Component that uses the hook
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movie,
  onClose,
  onProgress,
  onError,
  autoPlay = true,
  initialProgress = 0,
  showControls: initialShowControls = true
}) => {
  const {
    playerRef,
    containerRef,
    playerState,
    showControls,
    isReady,
    sourceType,
    videoUrl,
    processedVideoUrls,
    debugInfo,
    togglePlay,
    toggleMute,
    handleSeekStart,
    handleSeekChange,
    handleSeekEnd,
    skipForward,
    skipBackward,
    changeVolume,
    changePlaybackRate,
    toggleFullscreen,
    changeQuality,
    handleProgress,
    handleBufferStart,
    handleBufferEnd,
    handleReady,
    handleError,
    handleEnded,
    handleDuration,
    handleToggleControls,
    formatTime
  } = useVideoPlayer(movie, {
    onProgress,
    autoPlay,
    initialProgress
  });

  const [isFullView, setIsFullView] = useState(false);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          togglePlay();
          e.preventDefault();
          break;
        case 'ArrowRight':
          skipForward();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          skipBackward();
          e.preventDefault();
          break;
        case 'f':
          toggleFullscreen();
          e.preventDefault();
          break;
        case 'm':
          toggleMute();
          e.preventDefault();
          break;
        case 'Escape':
          if (onClose) {
            onClose();
          }
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, skipForward, skipBackward, toggleFullscreen, toggleMute, onClose]);

  // Handle fullscreen changes from external sources (like browser controls)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullView(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!movie || !videoUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8">
        <div className="text-white text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold mb-2">Video Not Available</h3>
          <p className="text-gray-300 mb-4">
            {!movie ? 'No movie data provided' : 'No video source found for this movie'}
          </p>
          <div className="text-sm text-gray-400 bg-gray-800 p-4 rounded-lg">
            <p>Debug Info:</p>
            <pre className="text-xs overflow-auto max-h-32">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // Check if ReactPlayer can play this URL
  if (!ReactPlayer.canPlay(videoUrl)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8">
        <div className="text-white text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold mb-2">Unsupported Video Format</h3>
          <p className="text-gray-300 mb-4">
            ReactPlayer cannot play this video format: {videoUrl}
          </p>
          <div className="text-sm text-gray-400 bg-gray-800 p-4 rounded-lg">
            <p>Supported formats include:</p>
            <ul className="list-disc list-inside mt-2">
              <li>YouTube URLs</li>
              <li>MP4 files</li>
              <li>HLS streams (.m3u8)</li>
              <li>Vimeo URLs</li>
              <li>DailyMotion URLs</li>
            </ul>
            <p className="mt-2">Current URL: {videoUrl.substring(0, 50)}...</p>
            <p>Source Type: {sourceType}</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // Config for ReactPlayer based on source type
  const playerConfig: any = {
    youtube: {
      playerVars: { 
        showinfo: 0,
        rel: 0,
        modestbranding: 1,
        controls: 0
      }
    },
    dailymotion: {
      params: { 
        'ui-highlight': 'FE2C55',
        'sharing-enable': false,
        'ui-logo': false,
        'ui-start-screen-info': false
      }
    },
    file: {
      attributes: {
        controlsList: 'nodownload',
        disablePictureInPicture: true,
        playsInline: true,
        crossOrigin: 'anonymous'
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden ${isFullView ? 'fixed inset-0 z-50' : ''}`}
      onClick={handleToggleControls}
    >
      {/* Debug overlay for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50 max-w-sm">
          <p>URL: {videoUrl.substring(0, 40)}...</p>
          <p>Type: {sourceType}</p>
          <p>Can Play: {ReactPlayer.canPlay(videoUrl) ? 'Yes' : 'No'}</p>
          <p>Ready: {isReady ? 'Yes' : 'No'}</p>
          <p>Duration: {formatTime(playerState.duration)}</p>
        </div>
      )}

      {/* The actual video player */}
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playerState.playing}
        volume={playerState.volume}
        muted={playerState.muted}
        playbackRate={playerState.playbackRate}
        onProgress={handleProgress}
        onBuffer={handleBufferStart}
        onBufferEnd={handleBufferEnd}
        onReady={handleReady}
        onDuration={handleDuration}
        onError={error => {
          handleError(error);
          if (onError) onError(error);
        }}
        onEnded={handleEnded}
        config={playerConfig}
        className="react-player"
        controls={false}
      />

      {/* Loading overlay */}
      {(!isReady || playerState.buffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
            <p className="text-white">
              {!isReady ? 'Loading video...' : 'Buffering...'}
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {playerState.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 p-6">
          <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-white text-xl font-bold mb-2">Playback Error</h3>
          <p className="text-white text-center mb-4">{playerState.error}</p>
          <div className="text-sm text-gray-400 bg-gray-800 p-4 rounded-lg mb-4 max-w-lg">
            <p>Video URL: {videoUrl}</p>
            <p>Can Play: {ReactPlayer.canPlay(videoUrl) ? 'Yes' : 'No'}</p>
            <p>Source Type: {sourceType}</p>
          </div>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Video controls - only show when ready and no error */}
      {showControls && !playerState.error && isReady && (
        <div 
          className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/70 via-transparent to-black/70"
          onClick={e => e.stopPropagation()}
        >
          {/* Top controls - title and close */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white text-lg font-medium">{movie.title}</h3>
              {movie.year && (
                <p className="text-gray-300 text-sm">{movie.year} • {playerState.currentQuality.toUpperCase()}</p>
              )}
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Center controls - play/pause, skip */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-8 pointer-events-auto">
              <button 
                onClick={() => skipBackward()}
                className="p-2 text-white hover:bg-white/20 rounded-full transition"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              
              <button 
                onClick={togglePlay}
                className="p-3 bg-white/20 text-white hover:bg-white/30 rounded-full transition"
              >
                {playerState.playing ? (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={() => skipForward()}
                className="p-2 text-white hover:bg-white/20 rounded-full transition"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom controls - progress, volume, quality, fullscreen */}
          <div className="flex flex-col gap-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="text-white text-sm w-16 text-right">
                {formatTime(playerState.played * playerState.duration)}
              </div>
              
              <div className="flex-1 relative group">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={playerState.played}
                  onMouseDown={handleSeekStart}
                  onChange={e => handleSeekChange(parseFloat(e.target.value))}
                  onMouseUp={e => handleSeekEnd(parseFloat((e.target as HTMLInputElement).value))}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 ${playerState.played * 100}%, rgba(255,255,255,0.3) ${playerState.played * 100}%)`,
                  }}
                />
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-red-500 rounded-full pointer-events-none" 
                  style={{ width: `${playerState.loaded * 100}%` }}
                ></div>
              </div>
              
              <div className="text-white text-sm w-16">
                {formatTime(playerState.duration)}
              </div>
            </div>
            
            {/* Other controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="text-white hover:text-red-500 transition"
                >
                  {playerState.playing ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                
                <div className="flex items-center gap-2 group relative">
                  <button 
                    onClick={toggleMute}
                    className="text-white hover:text-red-500 transition"
                  >
                    {playerState.muted || playerState.volume === 0 ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="hidden group-hover:block w-24">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step="any"
                      value={playerState.volume}
                      onChange={e => changeVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ef4444 ${playerState.volume * 100}%, rgba(255,255,255,0.3) ${playerState.volume * 100}%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Playback Speed */}
                <div className="relative group">
                  <button className="text-white text-sm px-2 py-1 rounded hover:bg-white/20 transition">
                    {playerState.playbackRate}x
                  </button>
                  
                  <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 bg-black/80 rounded overflow-hidden">
                    {[0.5, 1, 1.5, 2].map(rate => (
                      <button 
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/20 transition ${playerState.playbackRate === rate ? 'text-red-500' : 'text-white'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Quality Selector */}
                {playerState.availableQualities.length > 0 && (
                  <div className="relative group">
                    <button className="text-white text-sm px-2 py-1 rounded hover:bg-white/20 transition">
                      {playerState.currentQuality === 'auto' ? 'Auto' : playerState.currentQuality}
                    </button>
                    
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 bg-black/80 rounded overflow-hidden">
                      {playerState.availableQualities.map(quality => (
                        <button 
                          key={quality}
                          onClick={() => changeQuality(quality)}
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/20 transition ${playerState.currentQuality === quality ? 'text-red-500' : 'text-white'}`}
                        >
                          {quality === 'auto' ? 'Auto' : quality}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen}
                  className="text-white hover:text-red-500 transition"
                >
                  {playerState.fullscreen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-11.25 4.5v-4.5m0 4.5h4.5m-4.5 0L9 15" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;