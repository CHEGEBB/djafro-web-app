/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieBanner.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Info, Users, ChevronLeft, ChevronRight, Lock, Check, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { usePaymentService } from '@/services/payment_service';
import { useMovieService } from '@/services/movie_service';
import authService from '@/services/auth_service';
import '@/styles/MovieBanner.scss';

interface MovieBannerProps {
  movies?: any[];
  autoPlayInterval?: number;
  showControls?: boolean;
  isLoading?: boolean;
}

const AnimatedMovieBanner: React.FC<MovieBannerProps> = ({ 
  movies = [], 
  autoPlayInterval = 3000,
  showControls = true,
  isLoading = false
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const paymentService = usePaymentService();
  const { service: movieService } = useMovieService();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  
  // Autoplay logic
  useEffect(() => {
    if (!autoPlayInterval || movies.length <= 1 || isPaused || isLoading) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [autoPlayInterval, currentIndex, isPaused, isLoading, movies.length]);
  
  // Navigation functions
  const goToNext = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex + 1) % movies.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, movies.length]);
  
  const goToPrev = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex - 1 + movies.length) % movies.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, movies.length]);

  // Handle Watch Now button click
  const handleWatchNow = useCallback(async (movie: any) => {
    const hasVideo = movie.videoUrl || 
                    movie.videoUrls?.original || 
                    movie.videoUrls?.hls || 
                    movie.videoUrls?.['1080p'] || 
                    movie.videoUrls?.['720p'] || 
                    movie.videoUrls?.['480p'];
    
    if (!hasVideo) {
      console.warn('No video source available for movie:', movie.title);
      return;
    }

    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/dashboard');
      return;
    }

    // Check if premium and not paid - show payment modal
    if (movie.isPremium && movie.paymentStatus === 'premium') {
      setSelectedMovie(movie);
      setShowPaymentModal(true);
      return;
    }

    // Otherwise play the movie
    router.push(`/play?id=${movie.id}`);
  }, [router]);

  // Handle More Info button click
  const handleMoreInfo = useCallback((movie: any) => {
    router.push(`/movie/${movie.id}`);
  }, [router]);
  
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
    isPremium = false,
    paymentStatus = 'free',
    videoUrl,
    videoUrls
  } = currentMovie;

  // Check if movie has playable video
  const hasVideo = videoUrl || videoUrls?.original || videoUrls?.hls || videoUrls?.['1080p'] || videoUrls?.['720p'] || videoUrls?.['480p'];
  
  // Determine button text and style
  const getWatchButtonConfig = () => {
    if (!hasVideo) {
      return {
        text: 'Unavailable',
        disabled: true,
        icon: <Lock className="movie-banner__button-icon" />
      };
    }
    
    if (isPremium && paymentStatus === 'premium') {
      return {
        text: 'Purchase to Watch',
        disabled: false,
        icon: <Lock className="movie-banner__button-icon" />
      };
    }
    
    if (isPremium && paymentStatus === 'paid') {
      return {
        text: 'Watch Now',
        disabled: false,
        icon: <Play className="movie-banner__button-icon" />
      };
    }
    
    return {
      text: 'Watch Now',
      disabled: false,
      icon: <Play className="movie-banner__button-icon" />
    };
  };

  const watchButtonConfig = getWatchButtonConfig();

  // Get payment badge
  const getPaymentBadge = () => {
    if (!isPremium) {
      return {
        text: 'Free',
        className: 'bg-green-600 text-white'
      };
    }
    
    if (paymentStatus === 'paid') {
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

  const badge = getPaymentBadge();
  
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
                    animationPlayState: index === currentIndex && !isPaused ? 'running' : 'paused'
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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="movie-banner__title">{title}</h1>
            <span className={`${badge.className} text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1`}>
              {isPremium && paymentStatus !== 'paid' && <Lock size={12} />}
              {badge.text}
            </span>
          </div>
          
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
              className={`movie-banner__button movie-banner__button--primary ${watchButtonConfig.disabled ? 'movie-banner__button--disabled' : ''}`}
              style={{ backgroundColor: watchButtonConfig.disabled ? '#666' : (colors?.primary || '#E50914') }}
              onClick={() => !watchButtonConfig.disabled && handleWatchNow(currentMovie)}
              disabled={watchButtonConfig.disabled}
              title={watchButtonConfig.disabled ? 'Video not available' : (isPremium && paymentStatus === 'premium' ? 'Purchase to watch' : 'Play movie')}
            >
              {watchButtonConfig.icon}
              {watchButtonConfig.text}
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
            >
              <ChevronLeft />
            </button>
            <button 
              className="movie-banner__nav movie-banner__nav--next"
              onClick={goToNext}
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedMovie && (
        <PaymentModal
          movie={selectedMovie}
          paymentService={paymentService}
          movieService={movieService}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMovie(null);
          }}
          onPaymentSuccess={async () => {
            setShowPaymentModal(false);
            // Refresh the movie data to update payment status
            if (movieService?.getMovieById) {
              await movieService.getMovieById(selectedMovie.id);
            }
            // Redirect to play page
            router.push(`/play?id=${selectedMovie.id}`);
          }}
        />
      )}
    </>
  );
};

// Payment Modal Component - Intasend STK Push
const PaymentModal: React.FC<{
  movie: any;
  paymentService: any;
  movieService: any;
  onClose: () => void;
  onPaymentSuccess: () => void;
}> = ({ movie, paymentService, movieService, onClose, onPaymentSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && pollingActive) {
      setPollingActive(false);
      setError('Payment verification timed out. If you completed payment, please refresh.');
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, pollingActive]);

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await paymentService.processIntasendPayment(
        movie.id,
        phoneNumber
      );

      if (result.success) {
        if (result.data?.alreadyPaid) {
          setShowSuccess(true);
          setTimeout(() => {
            onPaymentSuccess();
          }, 1500);
        } else {
          setError('');
          setIsProcessing(false);
          
          if (result.data?.reference) {
            setPollingActive(true);
            setCountdown(60);
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
    let attempts = 0;
    const maxAttempts = 12;
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const isPaid = await paymentService.refreshPaymentStatus(movieId);
        
        if (isPaid) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          if (countdownRef.current) {
            clearTimeout(countdownRef.current);
          }
          setPollingActive(false);
          setCountdown(0);
          setShowSuccess(true);
          
          if (movieService?.getMovieById) {
            await movieService.getMovieById(movieId);
          }
          
          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);
        } else if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
          setCountdown(0);
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
          setCountdown(0);
          setIsProcessing(false);
        }
      }
    }, 5000);
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
          <h2 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h2>
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

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-white/80">Price</p>
          <p className="text-3xl font-bold text-white">KES {process.env.NEXT_PUBLIC_MOVIE_PRICE || '10'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="07XX XXX XXX"
            className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/50"
            disabled={isProcessing || pollingActive}
          />
          <p className="text-xs text-gray-400 mt-2 flex items-center">
            <span className="mr-1">📱</span>
            You will receive an M-Pesa prompt on your phone
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {pollingActive && (
          <div className="mb-4 p-4 bg-blue-900/50 border border-blue-600 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-sm font-semibold">Check your phone 📱</span>
            </div>
            <p className="text-xs text-gray-300">Enter your M-Pesa PIN when prompted</p>
            <div className="mt-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-400 mt-1">Auto-checking payment status...</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing || pollingActive}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || pollingActive || !phoneNumber.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
          >
            {isProcessing || pollingActive ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {pollingActive ? 'Verifying...' : 'Processing...'}
              </>
            ) : (
              `LIPA NA MPESA ${process.env.NEXT_PUBLIC_MOVIE_PRICE || '10'} KSH 🔥`
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Intasend • M-Pesa
        </p>
      </div>
    </div>
  );
};

export default AnimatedMovieBanner;