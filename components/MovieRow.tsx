/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieRow.tsx
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMovieService } from '@/services/movie_service';
import authService from '@/services/auth_service';
import '@/styles/MovieRow.scss';

interface MovieRowProps {
  title: string;
  movies: any[];
  isLoading?: boolean;
  onAddToWishlist?: (movieId: string) => Promise<void>;
  showWishlistBadge?: boolean;
  showProgress?: boolean;
}

const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  isLoading = false,
  onAddToWishlist,
  showWishlistBadge = false,
  showProgress = false
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [updatingWishlist, setUpdatingWishlist] = useState<Set<string>>(new Set());
  
  // Manual scroll
  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    const scrollTo = direction === 'left' 
      ? scrollLeft - scrollAmount 
      : scrollLeft + scrollAmount;
    
    rowRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
    
    // Update scroll position after animation
    setTimeout(() => {
      if (rowRef.current) {
        setScrollPosition(rowRef.current.scrollLeft);
      }
    }, 500);
  };
  
  // Handle scroll event
  const handleScroll = () => {
    if (!rowRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setScrollPosition(scrollLeft);
    
    // Show left arrow if scrolled right
    setShowLeftArrow(scrollLeft > 20);
    
    // Hide right arrow if at end
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };
  
  // Handle movie click - Navigate to play page
  const handleMovieClick = useCallback((movie: any) => {
    // Check if movie has playable video
    const hasVideo = movie.videoUrl || 
                    movie.videoUrls?.original || 
                    movie.videoUrls?.hls || 
                    movie.videoUrls?.['1080p'] || 
                    movie.videoUrls?.['720p'] || 
                    movie.videoUrls?.['480p'];
    
    if (!hasVideo) {
      console.warn('No video source available for movie:', movie.title);
      // You could show a toast notification here
      return;
    }

    // Navigate to the play page with the movie ID
    router.push(`/play?id=${movie.id || movie.uniqueId}`);
  }, [router]);
  
  // Handle play button click
  const handlePlayClick = useCallback((movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    handleMovieClick(movie);
  }, [handleMovieClick]);
  
  // Toggle wishlist handler
  const handleToggleWishlist = useCallback(async (movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check if user is authenticated
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      // Redirect to login or show login modal
      router.push('/auth?redirect=/dashboard');
      return;
    }
    
    const movieId = movie.id || movie.uniqueId;
    
    // Prevent multiple simultaneous requests for the same movie
    if (updatingWishlist.has(movieId)) {
      return;
    }
    
    try {
      setUpdatingWishlist(prev => new Set(prev).add(movieId));
      
      // Use the service's built-in wishlist toggle if available
      if (isInitialized && service.toggleWishlist) {
        await service.toggleWishlist(movieId);
      } 
      // Fallback to the provided onAddToWishlist callback
      else if (onAddToWishlist) {
        await onAddToWishlist(movieId);
      }
      
      // The movie list will be refreshed by the parent component
      // or through the service's internal state management
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // You could show an error toast here
    } finally {
      setUpdatingWishlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  }, [onAddToWishlist, service, isInitialized, router, updatingWishlist]);
  
  // Handle more info click
  const handleMoreInfo = useCallback((movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    // Navigate to movie details page or open info modal
    console.log('Show more info for:', movie.title);
    // Example implementation:
    // router.push(`/movies/${movie.id}`);
  }, []);
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="movie-row movie-row--loading mb-8">
        <h2 className="movie-row__title text-xl font-semibold mb-4">{title}</h2>
        <div className="movie-row__container relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // If no movies
  if (!movies || movies.length === 0) {
    return (
      <div className="movie-row movie-row--empty mb-8">
        <h2 className="movie-row__title text-xl font-semibold mb-4">{title}</h2>
        <div className="py-10 text-center text-gray-500 bg-gray-800/30 rounded-lg">
          No movies available in this category.
        </div>
      </div>
    );
  }
  
  // Ensure each movie has a unique ID
  const moviesWithUniqueIds = movies.map((movie, index) => ({
    ...movie,
    uniqueId: movie.id || `movie-${title}-${index}`
  }));
  
  return (
    <div className="movie-row mb-8">
      <div className="movie-row__header flex items-center justify-between mb-4">
        <h2 className="movie-row__title text-xl font-semibold">{title}</h2>
        
        {/* Optional: Category Explore Link */}
        {movies.length >= 5 && (
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Explore All
          </button>
        )}
      </div>
      
      <div className="movie-row__container relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {/* Movie List */}
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          onScroll={handleScroll}
        >
          {moviesWithUniqueIds.map((movie, index) => {
            const movieId = movie.id || movie.uniqueId;
            const isWishlistUpdating = updatingWishlist.has(movieId);
            const hasVideo = movie.videoUrl || 
                           movie.videoUrls?.original || 
                           movie.videoUrls?.hls || 
                           movie.videoUrls?.['1080p'] || 
                           movie.videoUrls?.['720p'] || 
                           movie.videoUrls?.['480p'];
            
            return (
              <div 
                key={movie.uniqueId} 
                className={`
                  movie-row__card flex-shrink-0 cursor-pointer
                  w-36 sm:w-40 md:w-44 lg:w-48 xl:w-56 
                  transition-all duration-300
                  ${hoveredCardIndex === index ? 'scale-105 z-10' : 'scale-100 z-0'}
                  ${!hasVideo ? 'opacity-70 cursor-not-allowed' : ''}
                `}
                onMouseEnter={() => setHoveredCardIndex(index)}
                onMouseLeave={() => setHoveredCardIndex(null)}
                onClick={() => hasVideo && handleMovieClick(movie)}
                title={!hasVideo ? 'Video not available' : `Play ${movie.title}`}
              >
                {/* Movie Poster */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  <Image 
                    src={movie.posterUrl || '/images/placeholder.jpg'} 
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, (max-width: 1024px) 176px, (max-width: 1280px) 192px, 224px"
                    className="object-cover transition-transform duration-300 hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  {/* Unavailable overlay */}
                  {!hasVideo && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 py-1 bg-gray-800 rounded">
                        Unavailable
                      </span>
                    </div>
                  )}
                  
                  {/* Wishlist badge */}
                  {(movie.isWishlisted || showWishlistBadge) && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Check size={10} className="mr-1" />
                      <span>My List</span>
                    </div>
                  )}
                  
                  {/* Progress bar for continue watching */}
                  {showProgress && movie.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                      <div 
                        className="h-full"
                        style={{ 
                          width: `${movie.progress * 100}%`, 
                          backgroundColor: colors?.primary || '#E50914' 
                        }}
                      ></div>
                    </div>
                  )}
                  
                  {/* Action buttons on hover */}
                  {hasVideo && (
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button 
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        onClick={(e) => handlePlayClick(movie, e)}
                        title="Play movie"
                      >
                        <Play size={16} />
                      </button>
                      <button 
                        className={`p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors ${isWishlistUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => handleToggleWishlist(movie, e)}
                        disabled={isWishlistUpdating}
                        title={movie.isWishlisted ? 'Remove from My List' : 'Add to My List'}
                      >
                        {isWishlistUpdating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          movie.isWishlisted ? <Check size={16} /> : <Plus size={16} />
                        )}
                      </button>
                      <button 
                        className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                        onClick={(e) => handleMoreInfo(movie, e)}
                        title="More info"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Movie info */}
                <div className="mt-2">
                  <h3 className="text-sm font-medium truncate">{movie.title}</h3>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <span>{movie.year}</span>
                    <span className="mx-1.5">•</span>
                    <span>{movie.duration || '1h 45m'}</span>
                    {movie.rating && (
                      <>
                        <span className="mx-1.5">•</span>
                        <span className="text-yellow-400">★{movie.rating}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Expanded card elements - only show on hover */}
                  {hoveredCardIndex === index && (
                    <div className="mt-2 hidden md:block">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {movie.genres && movie.genres.slice(0, 2).map((genre: string, idx: number) => (
                          <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
                            {genre}
                          </span>
                        ))}
                      </div>
                      
                      {/* Show progress text for continue watching */}
                      {showProgress && movie.progress > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {Math.round(movie.progress * 100)}% watched
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
      
      {/* Scroll indicator dots for larger collections */}
      {movies.length > 5 && (
        <div className="flex justify-center space-x-1 mt-3">
          {Array(Math.ceil(movies.length / 5)).fill(0).map((_, index) => {
            const isActive = 
              scrollPosition >= (index * (rowRef.current?.clientWidth || 0) * 0.8) && 
              scrollPosition < ((index + 1) * (rowRef.current?.clientWidth || 0) * 0.8);
            
            return (
              <button
                key={`indicator-${index}`}
                className={`h-1.5 rounded-full transition-all ${
                  isActive 
                    ? 'w-6 bg-red-600' 
                    : 'w-1.5 bg-gray-600 hover:bg-gray-500'
                }`}
                onClick={() => {
                  if (rowRef.current) {
                    rowRef.current.scrollTo({
                      left: index * rowRef.current.clientWidth * 0.8,
                      behavior: 'smooth'
                    });
                  }
                }}
                aria-label={`Go to page ${index + 1}`}
              ></button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MovieRow;