// components/VideoPlayerModal.tsx
'use client'

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Movie } from '@/services/movie_service';
import VideoPlayer from '@/services/video_player_service';
import { useMovieService } from '@/services/movie_service';

interface VideoPlayerModalProps {
  movieId: string | null;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  movieId,
  onClose
}) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { service } = useMovieService();
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  // Load movie details
  useEffect(() => {
    if (!movieId) {
      setIsLoading(false);
      return;
    }

    const loadMovie = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading movie with ID:', movieId);
        
        const movieData = await service.getMovieById(movieId);
        console.log('Loaded movie data:', movieData);
        
        if (!movieData) {
          throw new Error('Movie not found');
        }
        
        // Check for various video sources
        const hasVideoUrl = movieData.videoUrl;
        const hasVideoUrls = movieData.videoUrls && (
          movieData.videoUrls.original ||
          movieData.videoUrls.youtube ||
          movieData.videoUrls.dailymotion ||
          movieData.videoUrls['1080p'] ||
          movieData.videoUrls['720p'] ||
          movieData.videoUrls['480p']
        );
        
        console.log('Video availability check:', {
          hasVideoUrl,
          hasVideoUrls,
          videoUrl: movieData.videoUrl,
          videoUrls: movieData.videoUrls
        });
        
        if (!hasVideoUrl && !hasVideoUrls) {
          throw new Error('No video source available for this movie');
        }

        setMovie(movieData);
      } catch (err) {
        console.error('Error loading movie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load movie');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovie();
  }, [movieId, service]);

  // Update viewing progress
  const handleProgress = useCallback((progress: number) => {
    if (!movieId || !movie) return;
    
    console.log('Updating progress for movie:', movie.title, 'Progress:', progress);
    service.updateWatchingProgress(movieId, progress);
  }, [movieId, movie, service]);

  // Handle video player errors
  const handleVideoError = useCallback((err: any) => {
    console.error('Video player error:', err);
    const errorMessage = err?.message || err?.error || 'Unknown playback error occurred';
    setError(`Playback error: ${errorMessage}`);
  }, []);

  // Set up portal for modal
  useEffect(() => {
    // Try to find existing portal root, or create one if it doesn't exist
    let portal = document.getElementById('portal-root');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'portal-root';
      document.body.appendChild(portal);
    }
    setPortalElement(portal);
    
    // Prevent scrolling on the body when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // If portal element is not ready or movieId is null, don't render
  if (!portalElement || !movieId) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-black/90 rounded-lg p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mb-4"></div>
          <p className="text-white text-lg">Loading movie...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your video</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-black/90 p-8 rounded-lg max-w-md mx-4">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-4">Playback Error</h3>
            <p className="text-white/80 mb-6 leading-relaxed">{error}</p>
            
            {movie && (
              <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded mb-6">
                <p className="font-medium mb-2">Debug Information:</p>
                <p>Movie: {movie.title}</p>
                <p>Video URL: {movie.videoUrl || 'None'}</p>
                <p>Source Type: {movie.videoUrls?.sourceType || 'Unknown'}</p>
                {movie.videoUrls?.dailymotion && (
                  <p>Dailymotion URL: {movie.videoUrls.dailymotion}</p>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  if (movie) {
                    // Force re-render of video player
                    const movieCopy = { ...movie };
                    setMovie(null);
                    setTimeout(() => setMovie(movieCopy), 100);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!movie) {
      return (
        <div className="bg-black/90 p-8 rounded-lg mx-4">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-white text-lg mb-4">No movie selected</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          title="Close (ESC)"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Movie title overlay */}
        <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-4 py-2 rounded-lg">
          <h2 className="text-lg font-semibold">{movie.title}</h2>
          {movie.year && (
            <p className="text-sm text-gray-300">({movie.year})</p>
          )}
        </div>

        <VideoPlayer
          movie={movie}
          onClose={onClose}
          onProgress={handleProgress}
          onError={handleVideoError}
          autoPlay={true}
          initialProgress={movie.progress || 0}
          showControls={true}
        />
      </div>
    );
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {renderContent()}
    </div>,
    portalElement
  );
};

export default VideoPlayerModal;