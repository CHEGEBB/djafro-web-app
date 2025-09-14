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
        const movieData = await service.getMovieById(movieId);
        
        if (!movieData) {
          throw new Error('Movie not found');
        }
        
        if (!movieData.videoUrl && !movieData.videoUrls?.original) {
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
    if (!movieId) return;
    service.updateWatchingProgress(movieId, progress);
  }, [movieId, service]);

  // Set up portal for modal
  useEffect(() => {
    setPortalElement(document.getElementById('portal-root'));
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // If portal element is not ready or movieId is null, don't render
  if (!portalElement || !movieId) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Loading movie...</p>
        </div>
      ) : error ? (
        <div className="bg-black p-8 rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">Error</h3>
          <p className="text-white mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      ) : movie ? (
        <div className="w-full h-full">
          <VideoPlayer
            movie={movie}
            onClose={onClose}
            onProgress={handleProgress}
            onError={(err) => setError('Playback error: ' + (err.message || 'Unknown error'))}
            autoPlay={true}
            initialProgress={movie.progress || 0}
          />
        </div>
      ) : (
        <div className="bg-black p-8 rounded-lg">
          <p className="text-white">No movie selected</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Close
          </button>
        </div>
      )}
    </div>,
    portalElement
  );
};

export default VideoPlayerModal;