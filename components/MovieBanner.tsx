/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieBanner.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Play, Info, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import VideoPlayer from '@/services/video_player_service';
import { useMovieService } from '@/services/movie_service';
import '@/styles/MovieBanner.scss';

interface MovieBannerProps {
  movies?: any[];
  autoPlayInterval?: number;
  showControls?: boolean;
  isLoading?: boolean;
}

// Video Player Modal Component
interface VideoPlayerModalProps {
  movie: any;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ movie, onClose }) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { service } = useMovieService();

  // Set up portal for modal
  useEffect(() => {
    let portal = document.getElementById('video-portal-root');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'video-portal-root';
      document.body.appendChild(portal);
    }
    setPortalElement(portal);

    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      // Clean up portal on unmount
      const existingPortal = document.getElementById('video-portal-root');
      if (existingPortal) {
        document.body.removeChild(existingPortal);
      }
    };
  }, []);

  // Handle progress updates
  const handleProgress = useCallback((progress: number) => {
    if (movie?.id) {
      service.updateWatchingProgress(movie.id, progress);
    }
  }, [movie?.id, service]);

  // Handle player errors
  const handleError = useCallback((error: any) => {
    console.error('Video playback error:', error);
    // You could show an error toast or notification here
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  if (!portalElement) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button overlay */}
      <div className="absolute top-4 right-4 z-60">
        <button
          onClick={onClose}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200"
          aria-label="Close video player"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Loading state */}
      {!isPlayerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
            <p className="text-white text-lg">Loading {movie.title}...</p>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="w-full h-full">
        <VideoPlayer
          movie={movie}
          onClose={onClose}
          onProgress={handleProgress}
          onError={handleError}
          autoPlay={true}
          initialProgress={movie.progress || 0}
          showControls={true}
        />
      </div>
    </div>,
    portalElement
  );
};

const AnimatedMovieBanner: React.FC<MovieBannerProps> = ({ 
  movies = [], 
  autoPlayInterval = 3000,
  showControls = true,
  isLoading = false
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  
  // Autoplay logic
  useEffect(() => {
    if (!autoPlayInterval || movies.length <= 1 || isPaused || isLoading || isVideoPlaying) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [autoPlayInterval, currentIndex, isPaused, isLoading, movies.length, isVideoPlaying]);
  
  // Navigation functions
  const goToNext = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex + 1) % movies.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Match this with CSS transition duration
  }, [isTransitioning, movies.length]);
  
  const goToPrev = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex - 1 + movies.length) % movies.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Match this with CSS transition duration
  }, [isTransitioning, movies.length]);

  // Handle Watch Now button click
  const handleWatchNow = useCallback((movie: any) => {
    // Validate that the movie has video sources
    if (!movie.videoUrl && !movie.videoUrls?.original && !movie.videoUrls?.hls) {
      console.warn('No video source available for movie:', movie.title);
      // You could show a toast notification here
      return;
    }

    setSelectedMovie(movie);
    setIsVideoPlaying(true);
  }, []);

  // Handle closing video player
  const handleCloseVideo = useCallback(() => {
    setIsVideoPlaying(false);
    setSelectedMovie(null);
  }, []);

  // Handle More Info button click
  const handleMoreInfo = useCallback((movie: any) => {
    // Navigate to movie details page or open info modal
    // You can implement this based on your routing setup
    console.log('Show more info for:', movie.title);
    // Example: router.push(`/movies/${movie.id}`);
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="movie-banner movie-banner--loading">
        <div className="movie-banner__gradient"></div>
        <div className="movie-banner__content">
          <div className="movie-banner__title-skeleton"></div>
          <div className="movie-banner__meta-skeleton"></div>
          <div className="movie-banner__description-skeleton"></div>
          <div className="movie-banner__buttons">
            <div className="movie-banner__button-skeleton"></div>
            <div className="movie-banner__button-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!movies || movies.length === 0) {
    return (
      <div className="movie-banner movie-banner--empty">
        <div className="movie-banner__gradient"></div>
        <div className="movie-banner__content">
          <div className="movie-banner__play-icon">
            <Play />
          </div>
          <h1 className="movie-banner__title">No Featured Movie</h1>
          <p className="movie-banner__description">Check back later for new featured content.</p>
          <button className="movie-banner__browse-button">
            Browse Movies
          </button>
        </div>
      </div>
    );
  }
  
  const currentMovie = movies[currentIndex];
  
  // Extract movie properties with fallbacks
  const { 
    id,
    title = 'Untitled Movie',
    description = 'No description available.',
    genres = [],
    posterUrl = '/images/placeholder.jpg',
    year = '2024',
    duration = '2h 00m',
    rating = 'HD',
    isWishlisted = false,
    videoUrl,
    videoUrls
  } = currentMovie;

  // Check if movie has playable video
  const hasVideo = videoUrl || videoUrls?.original || videoUrls?.hls || videoUrls?.['1080p'] || videoUrls?.['720p'] || videoUrls?.['480p'];
  
  return (
    <>
      <div 
        className="movie-banner" 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress indicators */}
        {movies.length > 1 && (
          <div className="movie-banner__indicators">
            {movies.map((_, index) => (
              <div 
                key={index} 
                className={`movie-banner__indicator ${index === currentIndex ? 'movie-banner__indicator--active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <div 
                  className="movie-banner__indicator-progress" 
                  style={{
                    animationDuration: `${autoPlayInterval}ms`,
                    animationPlayState: index === currentIndex && !isPaused && !isVideoPlaying ? 'running' : 'paused'
                  }}
                ></div>
              </div>
            ))}
          </div>
        )}
        
        {/* Background image */}
        <div className="movie-banner__backdrop">
          <Image 
            src={posterUrl || '/images/placeholder.jpg'}
            alt={title}
            fill
            priority
            className="movie-banner__image"
          />
          <div className="movie-banner__gradient"></div>
        </div>
        
        {/* Content */}
        <div className="movie-banner__content">
          <h1 className="movie-banner__title">{title}</h1>
          
          <div className="movie-banner__meta">
            <span className="movie-banner__rating">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            <span className="movie-banner__year">{year}</span>
            <span className="movie-banner__divider">•</span>
            <span className="movie-banner__duration">{duration}</span>
            <span className="movie-banner__watching">
              <Users className="movie-banner__watching-icon" />
              <span>+6 friends watching</span>
            </span>
          </div>
          
          <p className="movie-banner__description">{description}</p>
          
          {/* Genres */}
          {genres && genres.length > 0 && (
            <div className="movie-banner__genres">
              {genres.slice(0, 4).map((genre: string, index: number) => (
                <span 
                  key={`${genre}-${index}`}
                  className="movie-banner__genre"
                >
                  {genre}
                </span>
              ))}
              {genres.length > 4 && (
                <span className="movie-banner__genre-more">
                  +{genres.length - 4} more
                </span>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="movie-banner__buttons">
            <button 
              className={`movie-banner__button movie-banner__button--primary ${!hasVideo ? 'movie-banner__button--disabled' : ''}`}
              style={{ backgroundColor: colors?.primary || '#E50914' }}
              onClick={() => hasVideo && handleWatchNow(currentMovie)}
              disabled={!hasVideo}
              title={!hasVideo ? 'Video not available' : 'Play movie'}
            >
              <Play className="movie-banner__button-icon" />
              {hasVideo ? 'Watch Now' : 'Unavailable'}
            </button>
            <button 
              className="movie-banner__button movie-banner__button--secondary"
              onClick={() => handleMoreInfo(currentMovie)}
            >
              <Info className="movie-banner__button-icon" />
              More Info
            </button>
          </div>
        </div>
        
        {/* Navigation Controls */}
        {showControls && movies.length > 1 && (
          <>
            <button 
              className="movie-banner__nav movie-banner__nav--prev"
              onClick={goToPrev}
              disabled={isVideoPlaying}
            >
              <ChevronLeft />
            </button>
            <button 
              className="movie-banner__nav movie-banner__nav--next"
              onClick={goToNext}
              disabled={isVideoPlaying}
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {isVideoPlaying && selectedMovie && (
        <VideoPlayerModal
          movie={selectedMovie}
          onClose={handleCloseVideo}
        />
      )}
    </>
  );
};

export default AnimatedMovieBanner;