'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LayoutController from '@/components/LayoutController';
import { useMovieService, Movie } from '@/services/movie_service';
import { usePaymentService } from '@/services/payment_service';
import { ChevronLeft, ChevronRight, Star, Heart, FilmIcon, Play, Clock, Calendar, Filter, ChevronDown, X, Lock, Check } from 'lucide-react';
import '@/styles/MoviesPage.scss';
import authService from '@/services/auth_service';

// Interfaces
interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
}

interface MoviesSection {
  title: string;
  movies: Movie[];
  id: string;
  autoScroll?: boolean;
}

// Responsive Genre Selector Component
const ResponsiveGenreSelector: React.FC<{
  genres: string[];
  selectedGenre: string;
  onGenreSelect: (genre: string) => void;
  movieCount: number;
}> = ({ genres, selectedGenre, onGenreSelect, movieCount }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenreClick = (genre: string) => {
    onGenreSelect(genre);
    setIsDropdownOpen(false);
  };

  if (isMobile) {
    // Mobile Dropdown Design
    return (
      <div className="px-4 sm:px-6 mb-6">
        <div className="genre-filter-mobile">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Filter Movies</h3>
                <p className="text-gray-400 text-sm">{movieCount} movies available</p>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl px-6 py-4 flex items-center justify-between transition-all duration-300 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold text-lg">{selectedGenre}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {genres.map((genre, index) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreClick(genre)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        selectedGenre === genre
                          ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30'
                          : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-2 h-2 rounded-full ${selectedGenre === genre ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                      <span className="font-medium">{genre}</span>
                      {selectedGenre === genre && (
                        <div className="ml-auto">
                          <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filter for Mobile */}
          {selectedGenre !== 'All' && (
            <div className="mt-4 flex items-center justify-between bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-medium">Filtered by &ldquo;{selectedGenre}&rdquo;</span>
              </div>
              <button
                onClick={() => onGenreSelect('All')}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop/Tablet Horizontal Scrollable Design
  return (
    <div className="px-4 sm:px-6 lg:px-8 mb-8">
      <div className="genre-filter-desktop">
        {/* Desktop Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Filter by Genre
              </h3>
              <p className="text-gray-400 text-sm font-medium">{movieCount} movies available</p>
            </div>
          </div>
        </div>

        {/* Desktop Genre Pills */}
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
            {genres.map((genre, index) => (
              <button
                key={genre}
                onClick={() => onGenreSelect(genre)}
                className={`flex-shrink-0 relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white shadow-2xl shadow-red-500/40 border-2 border-red-400/50'
                    : 'bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 text-gray-300 border-2 border-gray-600/30 hover:border-gray-500/50 hover:text-white backdrop-blur-xl'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  minWidth: 'fit-content'
                }}
              >
                {selectedGenre === genre && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-600/20 rounded-2xl animate-pulse"></div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedGenre === genre ? 'bg-white' : 'bg-gray-500'}`}></div>
                  {genre}
                </span>
                {selectedGenre === genre && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Desktop Gradient Overlay for Scroll Indication */}
          <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
        </div>

        {/* Clear Filter for Desktop */}
        {selectedGenre !== 'All' && (
          <div className="mt-6 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-pink-500/5 to-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-2xl px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 font-semibold">
                Showing movies in &ldquo;{selectedGenre}&rdquo; genre
              </span>
            </div>
            <button
              onClick={() => onGenreSelect('All')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all duration-300 font-semibold"
            >
              <X className="w-4 h-4" />
              Clear Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Movie Hero Banner Component
const MovieHeroBanner: React.FC<{ 
  movies: Movie[]; 
  onPlay: (movie: Movie) => void; 
  onToggleWishlist: (movieId: string) => void 
}> = ({ movies, onPlay, onToggleWishlist }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    if (isAutoPlaying && movies.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }, 8000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, movies.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsAutoPlaying(false);
  };
  
  // Get payment badge
  const getPaymentBadge = (movie: Movie) => {
    if (!movie.isPremium) {
      return {
        text: 'Free',
        className: 'bg-green-600 text-white'
      };
    }
    
    if (movie.paymentStatus === 'paid') {
      return {
        text: 'Purchased',
        className: 'bg-blue-600 text-white'
      };
    }
    
    return {
      text: 'Premium',
      className: 'bg-yellow-600 text-white'
    };
  };

  // Check if the movie needs payment
  const needsPayment = (movie: Movie) => {
    return movie.isPremium && movie.paymentStatus === 'premium';
  };

  if (!currentMovie || movies.length === 0) {
    return (
      <div className="hero-banner-skeleton">
        <div className="bg-gray-800 animate-pulse rounded-lg h-[70vh] flex items-center justify-center">
          <FilmIcon className="w-20 h-20 text-gray-600" />
        </div>
      </div>
    );
  }
  
  const badge = getPaymentBadge(currentMovie);

  return (
    <div className="hero-banner">
      <div 
        className="hero-banner__background"
        style={{
          backgroundImage: `linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.6) 30%,
            rgba(0, 0, 0, 0.4) 70%,
            rgba(0, 0, 0, 0.8) 100%
          ), url(${currentMovie.posterUrl})`
        }}
      >
        <div className="hero-banner__content">
          <div className="hero-banner__info">
            <div className="hero-banner__meta">
              <span className="featured-badge">Featured</span>
              <span className={`ml-2 ${badge.className} text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1`}>
                {needsPayment(currentMovie) && <Lock size={10} />}
                {badge.text}
              </span>
              {currentMovie.year && <span className="hero-banner__year">{currentMovie.year}</span>}
              {currentMovie.rating && (
                <div className="hero-banner__rating">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{currentMovie.rating.toFixed(1)}</span>
                </div>
              )}
              {currentMovie.duration && <span className="hero-banner__duration">{currentMovie.duration}</span>}
            </div>

            <h1 className="hero-banner__title">{currentMovie.title}</h1>

            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <div className="hero-banner__genres">
                {currentMovie.genres.slice(0, 3).map((genre, index) => (
                  <span key={`${currentMovie.id}-genre-${index}`} className="hero-banner__genre">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {currentMovie.description && (
              <p className="hero-banner__overview">
                {currentMovie.description.length > 250 
                  ? `${currentMovie.description.substring(0, 250)}...` 
                  : currentMovie.description}
              </p>
            )}

            <div className="hero-banner__actions">
              <button 
                className="hero-banner__play-btn"
                onClick={() => onPlay(currentMovie)}
              >
                {needsPayment(currentMovie) ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Purchase</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    <span>Watch Now</span>
                  </>
                )}
              </button>
              <button 
                className={`hero-banner__wishlist-btn ${currentMovie.isWishlisted ? 'wishlisted' : ''}`}
                onClick={() => onToggleWishlist(currentMovie.id)}
              >
                <Heart className={`w-5 h-5 ${currentMovie.isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{currentMovie.isWishlisted ? 'Wishlisted' : 'My List'}</span>
              </button>
            </div>
          </div>

          {movies.length > 1 && (
            <>
              <button className="hero-banner__nav hero-banner__nav--prev" onClick={prevSlide}>
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button className="hero-banner__nav hero-banner__nav--next" onClick={nextSlide}>
                <ChevronRight className="w-7 h-7" />
              </button>

              <div className="hero-banner__indicators">
                {movies.map((_, index) => (
                  <button
                    key={`indicator-${index}`}
                    className={`hero-banner__indicator ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlaying(false);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Movie Card Component
const MovieCard: React.FC<MovieCardProps> = ({ movie, onPlay, onToggleWishlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get payment badge
  const getPaymentBadge = (movie: Movie) => {
    if (!movie.isPremium) {
      return {
        text: 'Free',
        className: 'bg-green-600 text-white'
      };
    }
    
    if (movie.paymentStatus === 'paid') {
      return {
        text: 'Purchased',
        className: 'bg-blue-600 text-white'
      };
    }
    
    return {
      text: 'Premium',
      className: 'bg-yellow-600 text-white'
    };
  };

  // Check if the movie needs payment
  const needsPayment = (movie: Movie) => {
    return movie.isPremium && movie.paymentStatus === 'premium';
  };
  
  const badge = getPaymentBadge(movie);
  
  return (
    <div 
      className="movie-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(movie)}
    >
      <div className="movie-card__poster">
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative">
          <Image 
            src={movie.posterUrl || '/images/placeholder.jpg'}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 280px"
          />
          
          {/* Payment Badge */}
          <div className={`absolute top-2 left-2 ${badge.className} text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 z-10`}>
            {needsPayment(movie) && <Lock size={10} />}
            {badge.text}
          </div>
          
          {movie.progress !== undefined && movie.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700 rounded-b-xl">
              <div 
                className="h-full bg-red-500 rounded-b-xl transition-all duration-300" 
                style={{ width: `${movie.progress * 100}%` }}
              />
            </div>
          )}

          {movie.isWishlisted && (
            <div className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </div>
          )}

          <div className={`movie-card__overlay ${isHovered ? 'visible' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-pink-400 transition-all duration-200 transform hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(movie);
                  }}
                >
                  {needsPayment(movie) ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Purchase
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Play
                    </>
                  )}
                </button>
                <button 
                  className={`p-2.5 rounded-full border-2 transition-all duration-200 ${
                    movie.isWishlisted 
                      ? 'bg-red-500/20 border-red-500 text-red-500' 
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(movie.id);
                  }}
                >
                  <Heart className={`w-4 h-4 ${movie.isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-300 mb-2">
                {movie.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                )}
                {movie.year && <span>{movie.year}</span>}
                {movie.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{movie.duration}</span>
                  </div>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {movie.genres.slice(0, 2).map((genre, index) => (
                    <span 
                      key={`${movie.id}-genre-${index}`} 
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="movie-card__info">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
          {movie.title}
        </h3>
        {movie.genres && movie.genres.length > 0 && (
          <p className="text-gray-500 text-xs">
            {movie.genres[0]}
          </p>
        )}
      </div>
    </div>
  );
};

// Auto-Scrolling Movies Section Component
const AutoScrollSection: React.FC<{
  section: MoviesSection;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  onSeeAll: (sectionId: string) => void;
}> = ({ section, onPlay, onToggleWishlist, onSeeAll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!section.autoScroll || isPaused) return;

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const scrollWidth = scrollElement.scrollWidth;
    const containerWidth = scrollElement.clientWidth;
    
    if (scrollWidth <= containerWidth) return;

    let animationId: number;
    let currentScroll = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      currentScroll += scrollSpeed;
      
      if (currentScroll >= scrollWidth - containerWidth) {
        currentScroll = 0;
      }
      
      scrollElement.scrollLeft = currentScroll;
      animationId = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 2000); // Start scrolling after 2 seconds

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [section.autoScroll, isPaused]);

  return (
    <div className="movies-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {section.title}
        </h2>
        <button 
          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors hover:underline"
          onClick={() => onSeeAll(section.id)}
        >
          See All →
        </button>
      </div>

      <div 
        className="movies-grid-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {section.movies.map((movie) => (
            <div key={`${section.id}-${movie.id}`} className="flex-shrink-0 w-44 md:w-52">
              <MovieCard 
                movie={movie} 
                onPlay={onPlay}
                onToggleWishlist={onToggleWishlist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// See All Component
const SeeAllModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  title: string;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
}> = ({ isOpen, onClose, movies, title, onPlay, onToggleWishlist }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <MovieCard 
                key={`seeall-${movie.id}`}
                movie={movie} 
                onPlay={onPlay}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal: React.FC<{
  movie: Movie;
  onClose: () => void;
  onPaymentSuccess: () => void;
}> = ({ movie, onClose, onPaymentSuccess }) => {
  const { processPesapalPayment, handlePesapalRedirect, refreshPaymentStatus } = usePaymentService();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showRedirect, setShowRedirect] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await processPesapalPayment(
        movie.id,
        phoneNumber
      );

      if (result.success) {
        if (result.data?.alreadyPaid) {
          setShowSuccess(true);
          setTimeout(() => {
            onPaymentSuccess();
          }, 1500);
        } else if (result.data?.redirectUrl) {
          setRedirectUrl(result.data.redirectUrl);
          setPaymentReference(result.data.reference || '');
          setShowRedirect(true);
          setIsProcessing(false);
        } else {
          setError('Please check your phone and enter your M-Pesa PIN.');
          setIsProcessing(false);
          
          if (result.data?.reference) {
            pollPaymentStatus(result.data.reference, movie.id);
          }
        }
      } else {
        setError(result.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = (reference: string, movieId: string) => {
    if (pollingActive) return;
    
    setPollingActive(true);
    let attempts = 0;
    const maxAttempts = 20;
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const isPaid = await refreshPaymentStatus(movieId);
        
        if (isPaid) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
          setShowSuccess(true);
          
          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);
        } else if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
          setError('Payment verification timeout. Please check your purchase history or try again.');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
          setIsProcessing(false);
        }
      }
    }, 6000);
  };

  const handleRedirect = async () => {
    if (!redirectUrl) return;
    
    try {
      if (paymentReference) {
        const pendingPayment = {
          reference: paymentReference,
          movieId: movie.id,
          timestamp: Date.now()
        };
        const paymentData = JSON.stringify(pendingPayment);
        document.cookie = `pendingPayment=${paymentData}; path=/; max-age=3600`;
      }
      
      const success = await handlePesapalRedirect(redirectUrl, movie.id);
      
      if (!success) {
        setError('Failed to open payment page. Please try again.');
      }
    } catch (error) {
      setError('Failed to open payment page. Please try again.');
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-300 mb-6">
            You can now watch <span className="font-semibold text-white">{movie.title}</span>
          </p>
          <button
            onClick={onPaymentSuccess}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded transition-colors font-semibold"
          >
            Watch Now
          </button>
        </div>
      </div>
    );
  }

  if (showRedirect) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Complete Payment</h2>
          
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              You will be redirected to Pesapal to complete your payment securely.
            </p>
            <div className="bg-gray-800 rounded p-4">
              <p className="text-sm text-gray-400">Amount</p>
              <p className="text-2xl font-bold mb-2">
                {process.env.NEXT_PUBLIC_CURRENCY || 'KES'} {process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || '20'}
              </p>
              <p className="text-sm text-gray-400">Movie</p>
              <p className="font-semibold">{movie.title}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              After completing payment, you&apos;ll be redirected back automatically.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRedirect}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Purchase Premium Movie</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isProcessing || pollingActive}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-start gap-4">
            <Image
              src={movie.posterUrl || '/images/placeholder.jpg'}
              alt={movie.title}
              width={80}
              height={120}
              className="rounded object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold">{movie.title}</h3>
              <p className="text-gray-400 text-sm">{movie.year} • {movie.duration}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded p-4 mb-4">
          <p className="text-sm text-gray-400">Price</p>
          <p className="text-2xl font-bold">{process.env.NEXT_PUBLIC_CURRENCY || 'KES'} {process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || '20'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0712345678 or 254712345678"
            className="w-full px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
            disabled={isProcessing || pollingActive}
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter your Kenyan M-Pesa mobile number
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-sm">
            {error}
          </div>
        )}

        {pollingActive && (
          <div className="mb-4 p-3 bg-blue-900/50 border border-blue-600 rounded text-sm flex items-center">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Waiting for payment confirmation...</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing || pollingActive}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || pollingActive || !phoneNumber.trim()}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing || pollingActive ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {pollingActive ? 'Verifying...' : 'Processing...'}
              </>
            ) : (
              'Pay Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Movies Page Component
export default function MoviesPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const { service: paymentService } = usePaymentService();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [moviesSections, setMoviesSections] = useState<MoviesSection[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [filteredSections, setFilteredSections] = useState<MoviesSection[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seeAllModal, setSeeAllModal] = useState<{
    isOpen: boolean;
    movies: Movie[];
    title: string;
  }>({ isOpen: false, movies: [], title: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Filter movies by genre
  const filterMoviesByGenre = useCallback((movies: Movie[], genre: string) => {
    if (genre === 'All') return movies;
    return movies.filter(movie => 
      movie.genres?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }, []);

  // Update sections when genre filter changes
  useEffect(() => {
    if (moviesSections.length === 0) return;

    const filtered = moviesSections.map(section => ({
      ...section,
      movies: filterMoviesByGenre(section.movies, selectedGenre)
    })).filter(section => section.movies.length > 0);

    setFilteredSections(filtered);
  }, [moviesSections, selectedGenre, filterMoviesByGenre]);

  // Load payment status for movies
  const loadPaymentStatus = useCallback(async (movies: Movie[]) => {
    if (!paymentService || !isInitialized) return movies;

    try {
      const userPaidMovies = await paymentService.getCurrentUserPurchasedMovieIds();
      
      return movies.map(movie => {
        // Mark movies as premium or paid based on payment status
        if (movie.isPremium) {
          if (userPaidMovies.includes(movie.id)) {
            return { ...movie, paymentStatus: 'paid' as 'paid' };
          } else {
            return { ...movie, paymentStatus: 'premium' as 'premium' };
          }
        }
        return { ...movie, paymentStatus: undefined }; // Ensure paymentStatus is defined
      });
    } catch (error) {
      console.error('Error loading payment status:', error);
      return movies;
    }
  }, [isInitialized, paymentService]);

  // Load all data
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      try {
        // Get all movies
        const movies: Movie[] = await service.getAllMovies({ limit: 1000 });
        
        // Load payment status for movies
        const moviesWithPaymentStatus = await loadPaymentStatus(movies);
        setAllMovies(moviesWithPaymentStatus);

        // Extract unique genres
        const genresSet = new Set<string>();
        moviesWithPaymentStatus.forEach(movie => {
          movie.genres?.forEach(genre => genresSet.add(genre));
        });
        const genres = ['All', ...Array.from(genresSet).sort()];
        setAvailableGenres(genres);

        // Get featured movies for banner
        const featured = moviesWithPaymentStatus.filter(movie => movie.isFeatured);
        if (featured.length > 0) {
          setFeaturedMovies(featured);
        } else {
          // Fallback to random high-rated movies if no featured movies
          const highRated = moviesWithPaymentStatus
            .filter(movie => movie.rating && movie.rating >= 7.5)
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
          setFeaturedMovies(highRated.length > 0 ? highRated : moviesWithPaymentStatus.slice(0, 5));
        }

        // Create movie sections
        const sections: MoviesSection[] = [
          {
            id: 'all_movies',
            title: 'All Movies',
            movies: moviesWithPaymentStatus,
            autoScroll: true
          },
          {
            id: 'recently_added',
            title: 'Recently Added',
            movies: moviesWithPaymentStatus
              .sort((a, b) => {
                const aTime = typeof a.$createdAt === 'string' ? new Date(a.$createdAt).getTime() : (a.$createdAt || 0);
                const bTime = typeof b.$createdAt === 'string' ? new Date(b.$createdAt).getTime() : (b.$createdAt || 0);
                return bTime - aTime;
              })
              .slice(0, 20),
            autoScroll: false
          },
          {
            id: 'top_rated',
            title: 'Top Rated',
            movies: moviesWithPaymentStatus
              .filter(movie => movie.rating)
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 20),
            autoScroll: false
          },
          {
            id: 'action_movies',
            title: 'Action & Adventure',
            movies: moviesWithPaymentStatus.filter(movie => 
              movie.genres?.some(genre => 
                ['Action', 'Adventure', 'Thriller'].includes(genre)
              )
            ).slice(0, 20),
            autoScroll: true
          },
          {
            id: 'drama_movies', 
            title: 'Drama & Romance',
            movies: moviesWithPaymentStatus.filter(movie => 
              movie.genres?.some(genre => 
                ['Drama', 'Romance'].includes(genre)
              )
            ).slice(0, 20),
            autoScroll: false
          },
          {
            id: 'comedy_movies',
            title: 'Comedy & Family',
            movies: moviesWithPaymentStatus.filter(movie => 
              movie.genres?.some(genre => 
                ['Comedy', 'Family', 'Animation'].includes(genre)
              )
            ).slice(0, 20),
            autoScroll: true
          },
          {
            id: 'sci_fi_movies',
            title: 'Sci-Fi & Fantasy',
            movies: moviesWithPaymentStatus.filter(movie => 
              movie.genres?.some(genre => 
                ['Science Fiction', 'Fantasy', 'Horror'].includes(genre)
              )
            ).slice(0, 20),
            autoScroll: false
          },
          {
            id: 'premium_movies',
            title: 'Premium Movies',
            movies: moviesWithPaymentStatus.filter(movie => movie.isPremium).slice(0, 20),
            autoScroll: true
          }
        ];

        // Filter out empty sections
        const validSections = sections.filter(section => section.movies.length > 0);
        setMoviesSections(validSections);

      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isInitialized, service, loadPaymentStatus]);

  const handlePlayMovie = async (movie: Movie) => {
    // Check if user is authenticated
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/movies');
      return;
    }

    // Check if premium and not paid
    if (movie.isPremium && movie.paymentStatus === 'premium') {
      setSelectedMovie(movie);
      setShowPaymentModal(true);
      return;
    }

    // Navigate to play page
    router.push(`/play?id=${movie.id}`);
  };
  
  const handleSeeAll = (sectionId: string) => {
    const sections = filteredSections.length > 0 ? filteredSections : moviesSections;
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSeeAllModal({
        isOpen: true,
        movies: section.movies,
        title: `${section.title}${selectedGenre !== 'All' ? ` - ${selectedGenre}` : ''}`
      });
    }
  };

  const handleToggleWishlist = async (movieId: string) => {
    // Check if user is authenticated
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/movies');
      return;
    }

    try {
      await service.toggleWishlist(movieId);
      
      // Update all movie arrays
      setFeaturedMovies(prev => prev.map(m => m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m));
      setAllMovies(prev => prev.map(m => m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m));
      setMoviesSections(prev => prev.map(section => ({
        ...section,
        movies: section.movies.map(m => m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m)
      })));
      setFilteredSections(prev => prev.map(section => ({
        ...section,
        movies: section.movies.map(m => m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m)
      })));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedMovie) return;
    
    try {
      // Refresh movie data
      const updatedMovie = await service.getMovieById(selectedMovie.id);
      
      // Update movie in all collections with payment status
      const updateMovieInCollection = (collection: Movie[]): Movie[] => {
        return collection.map(m => m.id === selectedMovie.id ? { ...m, paymentStatus: 'paid' } : m);
      };
      
      setFeaturedMovies(updateMovieInCollection(featuredMovies));
      setAllMovies(updateMovieInCollection(allMovies));
      setMoviesSections(prev => prev.map(section => ({
        ...section,
        movies: updateMovieInCollection(section.movies)
      })));
      setFilteredSections(prev => prev.map(section => ({
        ...section,
        movies: updateMovieInCollection(section.movies)
      })));
      
      // Close modal and navigate to play
      setShowPaymentModal(false);
      setSelectedMovie(null);
      router.push(`/play?id=${selectedMovie.id}`);
    } catch (error) {
      console.error('Error updating movie after payment:', error);
      // Navigate to play anyway
      router.push(`/play?id=${selectedMovie.id}`);
    }
  };

  if (isLoading) {
    return (
      <LayoutController>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading movies...</p>
          </div>
        </div>
      </LayoutController>
    );
  }

  const totalMovieCount = (filteredSections.length > 0 ? filteredSections : moviesSections)
    .reduce((total, section) => total + section.movies.length, 0);

  return (
    <LayoutController>
      <div className="min-h-screen bg-black text-white">
        {/* Hero Banner */}
        <div className="mb-12">
          <MovieHeroBanner 
            movies={featuredMovies}
            onPlay={handlePlayMovie}
            onToggleWishlist={handleToggleWishlist}
          />
        </div>

        {/* Responsive Genre Filter */}
        <ResponsiveGenreSelector
          genres={availableGenres}
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
          movieCount={totalMovieCount}
        />

        {/* Movies Sections */}
        <div className="px-4 md:px-6 lg:px-8 space-y-16">
          {(filteredSections.length > 0 ? filteredSections : moviesSections).map((section) => (
            <AutoScrollSection
              key={`${section.id}-${selectedGenre}`}
              section={section}
              onPlay={handlePlayMovie}
              onToggleWishlist={handleToggleWishlist}
              onSeeAll={handleSeeAll}
            />
          ))}
          
          {selectedGenre !== 'All' && filteredSections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FilmIcon className="w-20 h-20 text-gray-600 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">No movies found</h2>
              <p className="text-gray-400 mb-8">
                No movies available in the &ldquo;{selectedGenre}&rdquo; genre.
              </p>
              <button 
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
                onClick={() => setSelectedGenre('All')}
              >
                View All Movies
              </button>
            </div>
          )}
        </div>

        {/* See All Modal */}
        <SeeAllModal
          isOpen={seeAllModal.isOpen}
          onClose={() => setSeeAllModal({ isOpen: false, movies: [], title: '' })}
          movies={seeAllModal.movies}
          title={seeAllModal.title}
          onPlay={handlePlayMovie}
          onToggleWishlist={handleToggleWishlist}
        />

        {/* Payment Modal */}
        {showPaymentModal && selectedMovie && (
          <PaymentModal
            movie={selectedMovie}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedMovie(null);
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </LayoutController>
  );
}