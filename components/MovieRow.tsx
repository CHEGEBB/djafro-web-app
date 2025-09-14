// components/MovieRow.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
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
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
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
  
  // Auto-scroll functionality (initially disabled)
  useEffect(() => {
    if (!autoScrollEnabled || !rowRef.current) return;
    
    const interval = setInterval(() => {
      if (!rowRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      
      // If we're near the end, go back to start
      if (scrollLeft + clientWidth >= scrollWidth - 100) {
        rowRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        // Otherwise continue scrolling
        rowRef.current.scrollTo({
          left: scrollLeft + 200,
          behavior: 'smooth'
        });
      }
      
      setScrollPosition(rowRef.current.scrollLeft);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoScrollEnabled]);
  
  // Toggle wishlist handler
  const handleToggleWishlist = async (movieId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onAddToWishlist) {
      await onAddToWishlist(movieId);
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="movie-row movie-row--loading">
        <h2 className="movie-row__title">{title}</h2>
        <div className="movie-row__container">
          <div className="movie-row__carousel">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="movie-row__card movie-row__card--loading"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // If no movies
  if (!movies || movies.length === 0) {
    return (
      <div className="movie-row movie-row--empty">
        <h2 className="movie-row__title">{title}</h2>
        <div className="movie-row__empty-message">
          No movies available in this category.
        </div>
      </div>
    );
  }
  
  return (
    <div className="movie-row">
      <div className="movie-row__header">
        <h2 className="movie-row__title">{title}</h2>
        
        {/* Optional: Category Explore Link */}
        {movies.length >= 5 && (
          <button className="movie-row__explore">
            Explore All
          </button>
        )}
      </div>
      
      <div className="movie-row__container">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="movie-row__arrow movie-row__arrow--left"
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
        )}
        
        {/* Movie List */}
        <div 
          ref={rowRef}
          className="movie-row__carousel"
          onScroll={handleScroll}
        >
          {movies.map((movie, index) => (
            <div 
              key={movie.id} 
              className={`movie-row__card ${hoveredCardIndex === index ? 'movie-row__card--expanded' : ''}`}
              onMouseEnter={() => setHoveredCardIndex(index)}
              onMouseLeave={() => setHoveredCardIndex(null)}
            >
              {/* Movie Poster */}
              <div className="movie-row__poster-container">
                <Image 
                  src={movie.posterUrl || '/images/placeholder.jpg'} 
                  alt={movie.title}
                  width={180}
                  height={270}
                  className="movie-row__poster"
                  loading="lazy"
                />
                
                {/* Overlay gradient */}
                <div className="movie-row__overlay"></div>
                
                {/* Wishlist badge */}
                {(movie.isWishlisted || showWishlistBadge) && (
                  <div className="movie-row__badge">
                    <div className="movie-row__badge-icon">
                      <Check size={12} />
                    </div>
                    <span className="movie-row__badge-text">My List</span>
                  </div>
                )}
                
                {/* Progress bar for continue watching */}
                {showProgress && movie.progress > 0 && (
                  <div className="movie-row__progress-container">
                    <div 
                      className="movie-row__progress-bar" 
                      style={{ width: `${movie.progress * 100}%`, backgroundColor: colors?.primary }}
                    ></div>
                  </div>
                )}
                
                {/* Action buttons on hover */}
                <div className="movie-row__actions">
                  <button className="movie-row__action movie-row__action--play">
                    <Play />
                  </button>
                  <button 
                    className="movie-row__action movie-row__action--wishlist"
                    onClick={(e) => handleToggleWishlist(movie.id, e)}
                  >
                    {movie.isWishlisted ? <Check /> : <Plus />}
                  </button>
                  <button className="movie-row__action movie-row__action--info">
                    <Info />
                  </button>
                </div>
              </div>
              
              {/* Movie info */}
              <div className="movie-row__info">
                <h3 className="movie-row__movie-title">{movie.title}</h3>
                <div className="movie-row__meta">
                  <span className="movie-row__year">{movie.year}</span>
                  <span className="movie-row__duration">{movie.duration || '1h 45m'}</span>
                </div>
                
                {/* Expanded card elements */}
                {hoveredCardIndex === index && (
                  <div className="movie-row__expanded-content">
                    <div className="movie-row__genres">
                      {movie.genres && movie.genres.slice(0, 2).map((genre: string, idx: number) => (
                        <span key={idx} className="movie-row__genre">{genre}</span>
                      ))}
                    </div>
                    <p className="movie-row__description">{movie.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="movie-row__arrow movie-row__arrow--right"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        )}
      </div>
      
      {/* Scroll indicator dots */}
      {movies.length > 5 && (
        <div className="movie-row__indicators">
          {Array(Math.ceil(movies.length / 5)).fill(0).map((_, index) => {
            const isActive = 
              scrollPosition >= (index * rowRef.current?.clientWidth || 0) * 0.8 && 
              scrollPosition < ((index + 1) * rowRef.current?.clientWidth || 0) * 0.8;
            
            return (
              <div 
                key={index} 
                className={`movie-row__indicator ${isActive ? 'movie-row__indicator--active' : ''}`}
                onClick={() => {
                  if (rowRef.current) {
                    rowRef.current.scrollTo({
                      left: index * rowRef.current.clientWidth * 0.8,
                      behavior: 'smooth'
                    });
                  }
                }}
              ></div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MovieRow;