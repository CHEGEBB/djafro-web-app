// app/play/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, 
         SkipForward, SkipBack, Loader, AlertCircle, Minimize } from 'lucide-react';
import { useMovieService, Movie } from '@/services/movie_service';

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const movieId = searchParams.get('id');
  const { service, isInitialized } = useMovieService();
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerType, setPlayerType] = useState<'html5' | 'youtube' | 'dailymotion' | 'iframe'>('html5');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Track player ready state
  const [playerReady, setPlayerReady] = useState(false);
  
  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      if (!isInitialized || !movieId) {
        setError("Unable to initialize player or missing movie ID");
        setLoading(false);
        return;
      }

      try {
        const movieData = await service.getMovieById(movieId);
        
        if (!movieData) {
          setError("Movie not found");
          setLoading(false);
          return;
        }
        
        setMovie(movieData);
        
        // Determine player type based on video source
        if (movieData.videoUrls?.sourceType === 'youtube') {
          setPlayerType('youtube');
        } else if (movieData.videoUrls?.sourceType === 'dailymotion') {
          setPlayerType('dailymotion');
        } else if (movieData.videoUrl?.includes('iframe.mediadelivery.net')) {
          setPlayerType('iframe');
        } else {
          setPlayerType('html5');
        }
        
        // If the movie has progress, restore it
        if (movieData.progress && movieData.progress > 0 && movieData.progress < 0.95) {
          setProgress(movieData.progress);
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, service, isInitialized]);

  // Get direct video source URL for HTML5 player
  const getVideoSource = useCallback(() => {
    if (!movie) return null;
    
    const { videoUrls } = movie;
    
    // Choose the best quality for HTML5 player
    if (videoUrls?.sourceType === 'bunny') {
      // Prefer HLS if available
      if (videoUrls.hls) {
        return videoUrls.hls;
      }
      
      // Otherwise try MP4 sources in order of quality
      if (videoUrls['1080p']) return videoUrls['1080p'];
      if (videoUrls['720p']) return videoUrls['720p'];
      if (videoUrls['480p']) return videoUrls['480p'];
      if (videoUrls['360p']) return videoUrls['360p'];
      
      // Fallback to original
      return videoUrls.original;
    }
    
    // Direct link for MP4
    if (movie.videoUrl?.endsWith('.mp4')) {
      return movie.videoUrl;
    }
    
    return null;
  }, [movie]);
  
  // Get embed URL for iframe players (YouTube/Dailymotion)
  const getEmbedUrl = useCallback(() => {
    if (!movie) return null;
    
    const { videoUrls } = movie;
    
    // Handle Dailymotion
    if (videoUrls?.sourceType === 'dailymotion') {
      // Extract video ID from dai.ly or dailymotion URL
      let videoId = '';
      
      if (movie.videoUrl.includes('dai.ly/')) {
        videoId = movie.videoUrl.split('dai.ly/')[1];
      } else if (movie.videoUrl.includes('dailymotion.com')) {
        const match = movie.videoUrl.match(/video\/([^/?]+)/);
        videoId = match ? match[1] : '';
      }
      
      if (videoId) {
        return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=0&ui-highlight=E50914`;
      }
    }
    
    // Handle YouTube
    if (videoUrls?.sourceType === 'youtube') {
      let videoId = '';
      
      if (movie.videoUrl.includes('youtube.com/watch?v=')) {
        videoId = new URL(movie.videoUrl).searchParams.get('v') || '';
      } else if (movie.videoUrl.includes('youtu.be/')) {
        videoId = movie.videoUrl.split('youtu.be/')[1];
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(movie.videoUrl)) {
        videoId = movie.videoUrl;
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=red&enablejsapi=1`;
      }
    }
    
    // Handle Bunny CDN with iframe
    if (videoUrls?.sourceType === 'bunny') {
      // If it's already an iframe URL, use it
      if (movie.videoUrl.includes('iframe.mediadelivery.net')) {
        return movie.videoUrl;
      }
      
      // Try to construct iframe URL from video data
      if (videoUrls.original && videoUrls.original.includes('iframe.mediadelivery.net')) {
        return videoUrls.original;
      }
    }
    
    // For other video types that might work in iframe
    return movie.videoUrl;
  }, [movie]);

  // Update progress to server periodically
  useEffect(() => {
    if (!movie || !isInitialized || progress <= 0) return;
    
    const updateInterval = setInterval(() => {
      if (progress > 0 && progress < 0.99) {
        service.updateWatchingProgress(movie.id, progress);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(updateInterval);
  }, [movie, progress, service, isInitialized]);

  // Handle video events for HTML5 player
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    setCurrentTime(video.currentTime);
    
    // Calculate progress as a fraction (0-1)
    if (video.duration > 0) {
      const newProgress = video.currentTime / video.duration;
      setProgress(newProgress);
    }
    
    // Calculate buffered
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered(bufferedEnd / video.duration);
    }
  }, []);
  
  const handleDurationChange = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }, []);
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);
  
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    // Mark as complete (progress = 1.0)
    if (movie) {
      service.updateWatchingProgress(movie.id, 1.0);
    }
  }, [movie, service]);
  
  const handleVolumeChange = useCallback(() => {
    if (!videoRef.current) return;
    setVolume(videoRef.current.volume);
    setIsMuted(videoRef.current.muted);
  }, []);
  
  const handleBuffer = useCallback(() => {
    setIsBuffering(true);
  }, []);
  
  const handleBufferEnd = useCallback(() => {
    setIsBuffering(false);
  }, []);
  
  const handleCanPlay = useCallback(() => {
    setIsBuffering(false);
    setPlayerReady(true);
    
    // If there's saved progress, seek to it
    if (videoRef.current && progress > 0 && progress < 0.95) {
      videoRef.current.currentTime = progress * videoRef.current.duration;
    }
    
    // Autoplay
    videoRef.current?.play().catch(err => {
      console.error("Autoplay failed:", err);
      // Many browsers require user interaction before autoplay
    });
  }, [progress]);
  
  const handleError = useCallback((e: any) => {
    console.error("Video error:", e);
    setError("Error playing video. Please try again later.");
  }, []);
  
  // Player controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error("Play failed:", err);
      });
    }
  }, [isPlaying]);
  
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
  }, []);
  
  const handleVolumeSet = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      videoRef.current.muted = true;
    } else if (isMuted) {
      videoRef.current.muted = false;
    }
  }, [isMuted]);
  
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !duration) return;
    
    const seekTime = parseFloat(e.target.value) * duration;
    videoRef.current.currentTime = seekTime;
  }, [duration]);
  
  const handleForward = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
  }, []);
  
  const handleBackward = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  }, []);
  
  // Enhanced fullscreen handling for both HTML5 and iframe players
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (playerType === 'html5' && videoRef.current) {
          // For HTML5 video, try video element first, then container
          if (videoRef.current.requestFullscreen) {
            await videoRef.current.requestFullscreen();
          } else if (containerRef.current?.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          }
        } else if (containerRef.current) {
          // For iframe players, fullscreen the container
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(`Error toggling fullscreen: ${err}`);
      // Fallback: just toggle the state for styling purposes
      setIsFullscreen(!isFullscreen);
    }
  }, [playerType, isFullscreen]);
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Controls visibility management
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (isPlaying && !isBuffering) {
          setShowControls(false);
        }
      }, 3000);
      
      setControlsTimeout(timeout);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, isBuffering, controlsTimeout]);
  
  // Back button handler
  const handleBack = useCallback(() => {
    // Save progress before going back
    if (movie && progress > 0) {
      service.updateWatchingProgress(movie.id, progress);
    }
    router.back();
  }, [router, movie, progress, service]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          handleBack();
        }
      } else if (e.key === ' ' || e.key === 'k') {
        // Space or K for play/pause (only for HTML5 player)
        if (playerType === 'html5') {
          e.preventDefault();
          togglePlay();
        }
      } else if (e.key === 'm') {
        // M for mute/unmute (only for HTML5 player)
        if (playerType === 'html5') {
          toggleMute();
        }
      } else if (e.key === 'ArrowRight') {
        // Right arrow for forward 10s (only for HTML5 player)
        if (playerType === 'html5') {
          handleForward();
        }
      } else if (e.key === 'ArrowLeft') {
        // Left arrow for backward 10s (only for HTML5 player)
        if (playerType === 'html5') {
          handleBackward();
        }
      } else if (e.key === 'f') {
        // F for fullscreen (works for all player types)
        toggleFullscreen();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, togglePlay, toggleMute, handleForward, handleBackward, toggleFullscreen, playerType]);
  
  // Format time (seconds to MM:SS)
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-600 border-r-red-600 border-b-gray-800 border-l-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium text-white">Loading video player...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !movie) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Play Video</h1>
          <p className="text-gray-400 mb-6">{error || "Video content is unavailable"}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-md text-white font-medium"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }
  
  // Determine appropriate player type and source
  const videoSource = getVideoSource();
  const embedUrl = getEmbedUrl();
  
  // If no playable source is available
  if (!videoSource && !embedUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Video Source</h1>
          <p className="text-gray-400 mb-6">This movie doesn't have a playable video source</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-md text-white font-medium"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video container */}
      <div 
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden ${isFullscreen ? 'bg-black' : ''}`}
      >
        {/* HTML5 Video Player */}
        {playerType === 'html5' && videoSource && (
          <video
            ref={videoRef}
            src={videoSource}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onPlay={handlePlay}
            onPlaying={handleBufferEnd}
            onPause={handlePause}
            onEnded={handleEnded}
            onVolumeChange={handleVolumeChange}
            onWaiting={handleBuffer}
            onCanPlay={handleCanPlay}
            onError={handleError}
          />
        )}
        
        {/* Iframe Players (YouTube, Dailymotion, etc) */}
        {(playerType === 'youtube' || playerType === 'dailymotion' || playerType === 'iframe') && embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
            allowFullScreen
            title={movie.title}
            onLoad={() => setPlayerReady(true)}
            onError={handleError}
          />
        )}
        
        {/* Buffering indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-30">
            <Loader className="w-12 h-12 animate-spin text-red-600" />
          </div>
        )}
        
        {/* Controls overlay - only show for HTML5 player */}
        {playerType === 'html5' && showControls && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/70 via-transparent to-black/70 z-20">
            {/* Top bar with title and back button */}
            <div className="flex items-center justify-between w-full">
              <button 
                onClick={handleBack} 
                className="flex items-center space-x-2 text-white hover:text-red-500 transition-colors"
              >
                <ArrowLeft size={24} />
                <span className="text-lg font-medium">Back</span>
              </button>
              
              <h1 className="text-white font-bold text-lg md:text-xl truncate max-w-md">
                {movie.title}
              </h1>
              
              <div className="w-24">
                {/* Spacer */}
              </div>
            </div>
            
            {/* Center play/pause button for mobile */}
            <div className="flex-grow flex items-center justify-center">
              {!playerReady ? (
                <Loader className="w-16 h-16 animate-spin text-red-600" />
              ) : (
                <button 
                  onClick={togglePlay}
                  className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-colors md:hidden"
                >
                  {isPlaying ? (
                    <Pause size={32} className="text-white" />
                  ) : (
                    <Play size={32} className="text-white" />
                  )}
                </button>
              )}
            </div>
            
            {/* Bottom controls */}
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="relative w-full h-2 bg-gray-700 rounded cursor-pointer group">
                {/* Buffered progress */}
                <div 
                  className="absolute h-full bg-gray-500 rounded-l"
                  style={{ width: `${buffered * 100}%` }}
                ></div>
                
                {/* Playback progress */}
                <div 
                  className="absolute h-full bg-red-600 rounded-l"
                  style={{ width: `${progress * 100}%` }}
                ></div>
                
                {/* Seek thumb */}
                <div 
                  className="absolute h-4 w-4 bg-red-600 rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress * 100}% - 8px)`, top: '0px' }}
                ></div>
                
                {/* Invisible range input for seeking */}
                <input 
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              
              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <button 
                    onClick={togglePlay}
                    className="text-white hover:text-red-500 transition-colors hidden md:block"
                  >
                    {isPlaying ? (
                      <Pause size={24} />
                    ) : (
                      <Play size={24} />
                    )}
                  </button>
                  
                  {/* Skip backward */}
                  <button 
                    onClick={handleBackward}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    <SkipBack size={24} />
                  </button>
                  
                  {/* Skip forward */}
                  <button 
                    onClick={handleForward}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    <SkipForward size={24} />
                  </button>
                  
                  {/* Volume control */}
                  <div className="flex items-center space-x-2 hidden md:flex">
                    <button 
                      onClick={toggleMute}
                      className="text-white hover:text-red-500 transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={20} />
                      ) : (
                        <Volume2 size={20} />
                      )}
                    </button>
                    
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeSet}
                      className="w-20 accent-red-600"
                    />
                  </div>
                  
                  {/* Time display */}
                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                {/* Right side controls */}
                <div>
                  {/* Fullscreen */}
                  <button 
                    onClick={toggleFullscreen}
                    className="text-white hover:text-red-500 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen (f)' : 'Enter fullscreen (f)'}
                  >
                    {isFullscreen ? (
                      <Minimize size={20} />
                    ) : (
                      <Maximize size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced controls for iframe players (YouTube, Dailymotion, etc) */}
        {(playerType === 'youtube' || playerType === 'dailymotion' || playerType === 'iframe') && showControls && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Top bar with title, back button */}
            <div className="flex items-center justify-between w-full p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
              <button 
                onClick={handleBack} 
                className="flex items-center space-x-2 text-white hover:text-red-500 transition-colors"
              >
                <ArrowLeft size={24} />
                <span className="text-lg font-medium">Back</span>
              </button>
              
              <h1 className="text-white font-bold text-lg md:text-xl truncate max-w-md">
                {movie.title}
              </h1>
              
              <button 
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors"
                title={isFullscreen ? 'Exit fullscreen (f)' : 'Enter fullscreen (f)'}
              >
                {isFullscreen ? (
                  <Minimize size={24} />
                ) : (
                  <Maximize size={24} />
                )}
              </button>
            </div>
            
            {/* Bottom bar for iframe players */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white text-sm">
                  <span className="px-2 py-1 bg-red-600 rounded text-xs font-medium">
                    {playerType.toUpperCase()}
                  </span>
                  <span>Player controls available in video</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white text-sm">
                  <span>Press F for fullscreen</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator for iframe players */}
        {(playerType === 'youtube' || playerType === 'dailymotion' || playerType === 'iframe') && !playerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-center">
              <Loader className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-white text-lg">Loading {playerType} player...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}