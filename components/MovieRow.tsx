/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieRow.tsx - With Payment Integration
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Lock, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMovieService } from '@/services/movie_service';
import { usePaymentService } from '@/services/payment_service';
import authService from '@/services/auth_service';
import '@/styles/MovieRow.scss';

interface MovieRowProps {
  title: string;
  movies: any[];
  isLoading?: boolean;
  onAddToWishlist?: (movieId: string) => Promise<void>;
  showWishlistBadge?: boolean;
  showProgress?: boolean;
  rowId: string;
  enableAutoScroll?: boolean;
}

const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  isLoading = false,
  onAddToWishlist,
  showWishlistBadge = false,
  showProgress = false,
  rowId,
  enableAutoScroll = false
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const paymentService = usePaymentService();
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [updatingWishlist, setUpdatingWishlist] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  
  const moviesWithUniqueIds = React.useMemo(() => {
    return movies.map((movie, index) => ({
      ...movie,
      uniqueId: `${rowId}-${movie.id || movie.title}-${index}`,
      originalId: movie.id
    }));
  }, [movies, rowId]);

  useEffect(() => {
    if (!enableAutoScroll || !rowRef.current || moviesWithUniqueIds.length <= 5 || isPaused) {
      return;
    }

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!rowRef.current || isPaused) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          rowRef.current.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          const cardWidth = 200;
          rowRef.current.scrollTo({
            left: scrollLeft + cardWidth,
            behavior: 'smooth'
          });
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [enableAutoScroll, moviesWithUniqueIds.length, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };
  
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
    
    setTimeout(() => {
      if (rowRef.current) {
        setScrollPosition(rowRef.current.scrollLeft);
      }
    }, 500);
  };
  
  const handleScroll = () => {
    if (!rowRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setScrollPosition(scrollLeft);
    
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };
  
  const handleMovieClick = useCallback(async (movie: any) => {
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

    if (movie.isPremium && movie.paymentStatus === 'premium') {
      setSelectedMovie(movie);
      setShowPaymentModal(true);
      return;
    }

    router.push(`/play?id=${movie.originalId || movie.id}`);
  }, [router]);
  
  const handlePlayClick = useCallback(async (movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    await handleMovieClick(movie);
  }, [handleMovieClick]);
  
  const handleToggleWishlist = useCallback(async (movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/dashboard');
      return;
    }
    
    const movieId = movie.originalId || movie.id;
    
    if (updatingWishlist.has(movieId)) {
      return;
    }
    
    try {
      setUpdatingWishlist(prev => new Set(prev).add(movieId));
      
      if (isInitialized && service.toggleWishlist) {
        await service.toggleWishlist(movieId);
      } else if (onAddToWishlist) {
        await onAddToWishlist(movieId);
      }
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setUpdatingWishlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  }, [onAddToWishlist, service, isInitialized, router, updatingWishlist]);
  
  const handleMoreInfo = useCallback((movie: any, event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(`/movie/${movie.originalId || movie.id}`);
  }, [router]);

  const getPaymentBadge = (movie: any) => {
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
  
  if (isLoading) {
    return (
      <div className="movie-row movie-row--loading mb-8">
        <h2 className="movie-row__title text-xl font-semibold mb-4">{title}</h2>
        <div className="movie-row__container relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={`${rowId}-skeleton-${i}`} className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!moviesWithUniqueIds || moviesWithUniqueIds.length === 0) {
    return (
      <div className="movie-row movie-row--empty mb-8">
        <h2 className="movie-row__title text-xl font-semibold mb-4">{title}</h2>
        <div className="py-10 text-center text-gray-500 bg-gray-800/30 rounded-lg">
          No movies available in this category.
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div 
        className="movie-row mb-8"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="movie-row__header flex items-center justify-between mb-4">
          <h2 className="movie-row__title text-xl font-semibold">{title}</h2>
          
          {enableAutoScroll && moviesWithUniqueIds.length > 5 && (
            <div className="flex items-center text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full mr-2 ${isPaused ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`}></div>
              {isPaused ? 'Paused' : 'Auto-scrolling'}
            </div>
          )}
          
          {moviesWithUniqueIds.length >= 5 && (
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Explore All
            </button>
          )}
        </div>
        
        <div className="movie-row__container relative">
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          <div 
            ref={rowRef}
            className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide smooth-scroll"
            onScroll={handleScroll}
          >
            {moviesWithUniqueIds.map((movie, index) => {
              const movieId = movie.originalId || movie.id;
              const isWishlistUpdating = updatingWishlist.has(movieId);
              const hasVideo = movie.videoUrl || 
                             movie.videoUrls?.original || 
                             movie.videoUrls?.hls || 
                             movie.videoUrls?.['1080p'] || 
                             movie.videoUrls?.['720p'] || 
                             movie.videoUrls?.['480p'];
              const badge = getPaymentBadge(movie);
              
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
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                    <Image 
                      src={movie.posterUrl || '/images/placeholder.jpg'} 
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, (max-width: 1024px) 176px, (max-width: 1280px) 192px, 224px"
                      className="object-cover transition-transform duration-300 hover:scale-110"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    <div className={`absolute top-2 left-2 ${badge.className} text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1`}>
                      {movie.isPremium && movie.paymentStatus !== 'paid' && <Lock size={10} />}
                      {badge.text}
                    </div>
                    
                    {!hasVideo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium px-2 py-1 bg-gray-800 rounded">
                          Unavailable
                        </span>
                      </div>
                    )}
                    
                    {(movie.isWishlisted || showWishlistBadge) && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <Check size={10} className="mr-1" />
                        <span>My List</span>
                      </div>
                    )}
                    
                    {showProgress && movie.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${movie.progress * 100}%`, 
                            backgroundColor: colors?.primary || '#E50914' 
                          }}
                        ></div>
                      </div>
                    )}
                    
                    {hasVideo && (
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <button 
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 hover:scale-110"
                          onClick={(e) => handlePlayClick(movie, e)}
                          title={movie.isPremium && movie.paymentStatus === 'premium' ? 'Purchase to play' : 'Play movie'}
                        >
                          {movie.isPremium && movie.paymentStatus === 'premium' ? <Lock size={16} /> : <Play size={16} />}
                        </button>
                        <button 
                          className={`p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${isWishlistUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                          onClick={(e) => handleMoreInfo(movie, e)}
                          title="More info"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
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
                    
                    {hoveredCardIndex === index && (
                      <div className="mt-2 hidden md:block">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {movie.genres && movie.genres.slice(0, 2).map((genre: string, idx: number) => (
                            <span key={`${movie.uniqueId}-genre-${idx}`} className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
                              {genre}
                            </span>
                          ))}
                        </div>
                        
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
          
          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        
        {moviesWithUniqueIds.length > 5 && (
          <div className="flex justify-center space-x-1 mt-3">
            {Array(Math.ceil(moviesWithUniqueIds.length / 5)).fill(0).map((_, index) => {
              const isActive = 
                scrollPosition >= (index * (rowRef.current?.clientWidth || 0) * 0.8) && 
                scrollPosition < ((index + 1) * (rowRef.current?.clientWidth || 0) * 0.8);
              
              return (
                <button
                  key={`${rowId}-indicator-${index}`}
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

      {showPaymentModal && selectedMovie && (
        <PaymentModal
          movie={selectedMovie}
          paymentContext={paymentService}
          movieService={service}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMovie(null);
          }}
          onPaymentSuccess={async () => {
            setShowPaymentModal(false);
            router.push(`/play?id=${selectedMovie.originalId || selectedMovie.id}`);
          }}
        />
      )}
    </>
  );
};

const PaymentModal: React.FC<{
  movie: any;
  paymentContext: any;
  movieService: any;
  onClose: () => void;
  onPaymentSuccess: () => void;
}> = ({ movie, paymentContext, movieService, onClose, onPaymentSuccess }) => {
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
      const result = await paymentContext.processPesapalPayment(
        movie.originalId || movie.id,
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
            pollPaymentStatus(result.data.reference, movie.originalId || movie.id);
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
        const isPaid = await paymentContext.refreshPaymentStatus(movieId);
        
        if (isPaid) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
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
          movieId: movie.originalId || movie.id,
          timestamp: Date.now()
        };
        const paymentData = JSON.stringify(pendingPayment);
        document.cookie = `pendingPayment=${paymentData}; path=/; max-age=3600`;
      }
      
      const success = await paymentContext.handlePesapalRedirect(redirectUrl, movie.originalId || movie.id);
      
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

export default MovieRow;