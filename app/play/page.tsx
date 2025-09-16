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
  const progressBarRef = useRef<HTMLDivElement>(null);
  
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
  
  // Seeking state management
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0);
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Progress saving interval reference
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Control visibility timeouts
  const fadeControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if we should auto-resume from saved progress
  const [autoResumeFromSaved, setAutoResumeFromSaved] = useState(true);
  
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
        
        // Store saved progress but don't auto-apply it immediately
        if (movieData.progress && movieData.progress > 0 && movieData.progress < 0.95) {
          const shouldAutoResume = autoResumeFromSaved;
          setAutoResumeFromSaved(shouldAutoResume);
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, service, isInitialized, autoResumeFromSaved]);

  // Get direct video source URL for HTML5 player
  const getVideoSource = useCallback(() => {
    if (!movie) return null;
    
    const { videoUrls } = movie;
    
    // Choose the best quality for HTML5 player
    if (videoUrls?.sourceType === 'bunny') {
      // Prefer MP4 sources over HLS for better seeking behavior
      if (videoUrls['720p']) return videoUrls['720p'];
      if (videoUrls['1080p']) return videoUrls['1080p'];
      if (videoUrls['480p']) return videoUrls['480p'];
      if (videoUrls['360p']) return videoUrls['360p'];
      
      // Fall back to HLS if no MP4 sources
      if (videoUrls.hls) {
        return videoUrls.hls;
      }
      
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
    if (!movie || !isInitialized || !isPlaying) return;
    
    // Clear any existing interval
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
      progressSaveIntervalRef.current = null;
    }
    
    // Set up new interval for progress saving
    progressSaveIntervalRef.current = setInterval(() => {
      if (progress > 0 && progress < 0.99 && !isSeeking && isPlaying) {
        service.updateWatchingProgress(movie.id, progress);
      }
    }, 15000); // Update every 15 seconds when playing
    
    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
    };
  }, [movie, progress, service, isInitialized, isSeeking, isPlaying]);
  
  // Save progress when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (movie && progress > 0 && progress < 0.99) {
        service.updateWatchingProgress(movie.id, progress);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also save progress when component unmounts
      if (movie && progress > 0 && progress < 0.99) {
        service.updateWatchingProgress(movie.id, progress);
      }
    };
  }, [movie, progress, service]);

  // Handle video events for HTML5 player
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isSeeking) return;
    
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
  }, [isSeeking]);
  
  const handleDurationChange = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }, []);
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
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
  
  const handleSeeked = useCallback(() => {
    setIsBuffering(false);
    setIsSeeking(false);
    
    // Resume playing if it was playing before seek, with a short delay
    // to allow buffering to catch up
    setTimeout(() => {
      if (wasPlayingBeforeSeek && videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error("Resume play after seek failed:", err);
        });
      }
    }, 300);
  }, [wasPlayingBeforeSeek]);
  
  const handleSeeking = useCallback(() => {
    setIsBuffering(true);
  }, []);
  
  // Improved canplay handler with controlled resume logic
  const handleCanPlay = useCallback(() => {
    setIsBuffering(false);
    setPlayerReady(true);
    
    // Only auto-seek to saved progress on initial load if autoResumeFromSaved is true
    if (videoRef.current && movie?.progress && movie.progress > 0 && movie.progress < 0.95 && autoResumeFromSaved) {
      // This is the first load, show a resume dialog/button
      setShowControls(true);
      
      // We'll handle auto-resume separately with resume dialog
      setAutoResumeFromSaved(false);
    } else {
      // For initial playback or if user chose to start from beginning
      videoRef.current?.play().catch(err => {
        console.error("Autoplay failed:", err);
        // Many browsers require user interaction before autoplay
      });
    }
  }, [movie, autoResumeFromSaved]);
  
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
  
  // Optimized seeking handlers
  const handleSeekStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration || !progressBarRef.current) return;
    
    setIsSeeking(true);
    setWasPlayingBeforeSeek(isPlaying);
    
    // Pause video during seeking to prevent stuttering
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
    }
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    setSeekProgress(newProgress);
    
    // Update display immediately for responsive UI
    setCurrentTime(newProgress * duration);
  }, [duration, isPlaying]);
  
  // Optimized seeking with mouse movement
  const handleSeekMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSeeking || !progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, moveX / rect.width));
    
    setSeekProgress(newProgress);
    setCurrentTime(newProgress * duration);
    
    // Clear any existing timeout to prevent rapid seeking
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
  }, [isSeeking, duration]);
  
  // Optimized seek end with improved buffering handling
  const handleSeekEnd = useCallback(() => {
    if (!videoRef.current || !duration) return;
    
    // Clear any pending seek timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }
    
    // Perform final seek with more aggressive buffering
    const seekTime = seekProgress * duration;
    
    if (!isNaN(seekTime)) {
      // First update state
      setProgress(seekProgress);
      setCurrentTime(seekTime);
      
      // Then perform the actual seek on the video element
      try {
        // For better seeking stability, try a different seeking approach:
        videoRef.current.currentTime = seekTime;
        
        // Set a short timeout before attempting to resume playback
        setTimeout(() => {
          setIsSeeking(false);
          
          if (wasPlayingBeforeSeek && videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error("Resume play after seek failed:", err);
              
              // If playback fails, try again after a slightly longer delay
              setTimeout(() => {
                videoRef.current?.play().catch(() => {
                  // If it still fails, let the user manually play
                  setIsBuffering(false);
                });
              }, 500);
            });
          } else {
            setIsBuffering(false);
          }
        }, 300);
      } catch (err) {
        console.error("Seeking error:", err);
        setIsBuffering(false);
        setIsSeeking(false);
      }
    }
  }, [seekProgress, duration, wasPlayingBeforeSeek]);
  
  // Resume from saved position
  const handleResumeFromSaved = useCallback(() => {
    if (!videoRef.current || !movie?.progress) return;
    
    const seekTime = movie.progress * videoRef.current.duration;
    
    if (!isNaN(seekTime) && seekTime > 0) {
      // Show buffering indicator
      setIsBuffering(true);
      
      // Perform the seek
      try {
        videoRef.current.currentTime = seekTime;
        
        // Wait for seeking to complete before playing
        const onSeekedComplete = () => {
          videoRef.current?.play().catch(err => {
            console.error("Resume playback failed:", err);
          });
          
          // Remove the one-time event listener
          videoRef.current?.removeEventListener('seeked', onSeekedComplete);
        };
        
        videoRef.current.addEventListener('seeked', onSeekedComplete);
      } catch (err) {
        console.error("Resume seeking error:", err);
        setIsBuffering(false);
        
        // Try to play from the beginning instead
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [movie]);
  
  // Start from beginning (ignore saved progress)
  const handleStartFromBeginning = useCallback(() => {
    if (!videoRef.current) return;
    
    // Reset to beginning
    videoRef.current.currentTime = 0;
    
    // Start playback
    videoRef.current.play().catch(err => {
      console.error("Start from beginning failed:", err);
    });
  }, []);
  
  // Improved seeking with 10-second intervals
  const handleForward = useCallback(() => {
    if (!videoRef.current) return;
    
    // Save the current playing state
    const wasPlaying = !videoRef.current.paused;
    
    // Calculate new time
    const newTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
    
    // Show buffering indicator
    setIsBuffering(true);
    
    // If playing, pause first to reduce stuttering
    if (wasPlaying) {
      videoRef.current.pause();
    }
    
    // Perform seek
    videoRef.current.currentTime = newTime;
    
    // Use the seeked event to resume playback
    const handleSeekComplete = () => {
      setIsBuffering(false);
      
      if (wasPlaying) {
        videoRef.current?.play().catch(() => {});
      }
      
      videoRef.current?.removeEventListener('seeked', handleSeekComplete);
    };
    
    videoRef.current.addEventListener('seeked', handleSeekComplete);
  }, []);
  
  const handleBackward = useCallback(() => {
    if (!videoRef.current) return;
    
    // Save the current playing state
    const wasPlaying = !videoRef.current.paused;
    
    // Calculate new time
    const newTime = Math.max(videoRef.current.currentTime - 10, 0);
    
    // Show buffering indicator
    setIsBuffering(true);
    
    // If playing, pause first to reduce stuttering
    if (wasPlaying) {
      videoRef.current.pause();
    }
    
    // Perform seek
    videoRef.current.currentTime = newTime;
    
    // Use the seeked event to resume playback
    const handleSeekComplete = () => {
      setIsBuffering(false);
      
      if (wasPlaying) {
        videoRef.current?.play().catch(() => {});
      }
      
      videoRef.current?.removeEventListener('seeked', handleSeekComplete);
    };
    
    videoRef.current.addEventListener('seeked', handleSeekComplete);
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
  
  // Improved controls visibility management
  useEffect(() => {
    const showPlayerControls = () => {
      setShowControls(true);
      
      // Clear any existing timeout
      if (fadeControlsTimeoutRef.current) {
        clearTimeout(fadeControlsTimeoutRef.current);
        fadeControlsTimeoutRef.current = null;
      }
      
      // Only auto-hide if playing and not buffering/seeking
      if (isPlaying && !isBuffering && !isSeeking) {
        fadeControlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };
    
    // Show controls on mouse movement
    const handleMouseMove = () => {
      showPlayerControls();
    };
    
    // Show controls on touch
    const handleTouchStart = () => {
      showPlayerControls();
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart);
    
    // Always show controls when paused or buffering
    if (!isPlaying || isBuffering || isSeeking) {
      setShowControls(true);
      
      if (fadeControlsTimeoutRef.current) {
        clearTimeout(fadeControlsTimeoutRef.current);
        fadeControlsTimeoutRef.current = null;
      }
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
      
      if (fadeControlsTimeoutRef.current) {
        clearTimeout(fadeControlsTimeoutRef.current);
        fadeControlsTimeoutRef.current = null;
      }
    };
  }, [isPlaying, isBuffering, isSeeking]);
  
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
  
  // Format time (seconds to MM:SS or HH:MM:SS for longer videos)
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      if (fadeControlsTimeoutRef.current) {
        clearTimeout(fadeControlsTimeoutRef.current);
      }
      
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
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
            onSeeking={handleSeeking}
            onSeeked={handleSeeked}
            onError={handleError}
            preload="auto"
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
        
        {/* Central playback controls for mobile and desktop */}
        {playerType === 'html5' && (
          <div 
            className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          >
            <div className="flex items-center justify-center gap-8 pointer-events-auto">
              {/* Skip backward button */}
              <button 
                onClick={handleBackward}
                className="bg-black/50 hover:bg-red-600/70 rounded-full p-3 transition-colors"
              >
                <SkipBack size={32} className="text-white" />
              </button>
              
              {/* Play/Pause button */}
              <button 
                onClick={togglePlay}
                className="bg-red-600 hover:bg-red-700 rounded-full p-6 transition-colors"
              >
                {isPlaying ? (
                  <Pause size={48} className="text-white" />
                ) : (
                  <Play size={48} className="text-white" />
                )}
              </button>
              
              {/* Skip forward button */}
              <button 
                onClick={handleForward}
                className="bg-black/50 hover:bg-red-600/70 rounded-full p-3 transition-colors"
              >
                <SkipForward size={32} className="text-white" />
              </button>
            </div>
          </div>
        )}
        
        {/* Resume from saved progress overlay */}
        {playerType === 'html5' && playerReady && movie.progress && movie.progress > 0 && movie.progress < 0.95 && autoResumeFromSaved && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md text-center">
              <h3 className="text-xl font-bold text-white mb-4">Resume Watching?</h3>
              <p className="text-gray-300 mb-6">
                Would you like to continue from {formatTime(movie.progress * duration)} or start from the beginning?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartFromBeginning}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  Start Over
                </button>
                <button
                  onClick={handleResumeFromSaved}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Resume
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Buffering indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-30">
            <Loader className="w-16 h-16 animate-spin text-red-600" />
          </div>
        )}
        
        {/* Controls overlay - only show for HTML5 player */}
        {playerType === 'html5' && (
          <div 
            className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/70 via-transparent to-black/70 z-10 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onClick={() => togglePlay()}
          >
            {/* Top bar with title and back button */}
            <div className="flex items-center justify-between w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
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
            
            {/* Empty middle section to allow play/pause toggle */}
            <div className="flex-grow" onClick={e => e.stopPropagation()}></div>
            
            {/* Bottom controls */}
            <div className="space-y-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
              {/* Progress bar */}
              <div 
                ref={progressBarRef}
                className="relative w-full h-3 bg-gray-700 rounded cursor-pointer group"
                onClick={handleSeekStart}
                onMouseMove={handleSeekMove}
                onMouseUp={handleSeekEnd}
                onMouseLeave={isSeeking ? handleSeekEnd : undefined}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleSeekStart({
                    clientX: touch.clientX,
                    currentTarget: e.currentTarget
                  } as unknown as React.MouseEvent<HTMLDivElement>);
                }}
                onTouchMove={(e) => {
                  if (!isSeeking) return;
                  const touch = e.touches[0];
                  handleSeekMove({
                    clientX: touch.clientX,
                    currentTarget: e.currentTarget
                  } as unknown as React.MouseEvent<HTMLDivElement>);
                }}
                onTouchEnd={handleSeekEnd}
              >
                {/* Buffered progress */}
                <div 
                  className="absolute h-full bg-gray-500 rounded-l"
                  style={{ width: `${buffered * 100}%` }}
                ></div>
                
                {/* Playback progress */}
                <div 
                  className="absolute h-full bg-red-600 rounded-l"
                  style={{ width: `${(isSeeking ? seekProgress : progress) * 100}%` }}
                ></div>
                
                {/* Seek thumb */}
                <div 
                  className="absolute h-5 w-5 bg-red-600 rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ 
                    left: `calc(${(isSeeking ? seekProgress : progress) * 100}% - 10px)`, 
                    top: '0px' 
                  }}
                ></div>
                
                {/* Preview of hover position (optional enhancement) */}
                {isSeeking && (
                  <div 
                    className="absolute bottom-6 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
                    style={{ 
                      left: `calc(${seekProgress * 100}% - 20px)`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {formatTime(seekProgress * duration)}
                  </div>
                )}
              </div>
              
              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause (small version for bottom controls) */}
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
                    {formatTime(isSeeking ? seekProgress * duration : currentTime)} / {formatTime(duration)}
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
        {(playerType === 'youtube' || playerType === 'dailymotion' || playerType === 'iframe') && (
          <div 
            className={`absolute inset-0 pointer-events-none z-10 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          >
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
          </div>
        )}
        
        {/* Loading indicator for iframe players */}
        {(playerType === 'youtube' || playerType === 'dailymotion' || playerType === 'iframe') && !playerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-center">
              <Loader className="w-16 h-16 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-white text-lg">Loading {playerType} player...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}