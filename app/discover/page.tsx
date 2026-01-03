/* eslint-disable @typescript-eslint/no-explicit-any */
// app/discover/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, X, Play, Star, Heart, 
  ArrowUpRight, Compass, TrendingUp, Clock,
  ChevronRight, ChevronLeft, Calendar, Zap, Lock, Check,
  Film, Sparkles, Eye, Award, Timer
} from 'lucide-react';
import LayoutController from '@/components/LayoutController';
import { useMovieService } from '@/services/movie_service';
import { usePaymentService } from '@/services/payment_service';
import authService from '@/services/auth_service';
import '@/styles/DiscoverAnimations.scss';
import Head from 'next/head';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  rating: number;
  year: string;
  duration: string;
  genres: string[];
  isPremium: boolean;
  progress?: number;
  isWishlisted?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  paymentStatus?: 'free' | 'premium' | 'paid';
}

interface GenreCardProps {
  genre: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

interface FilterState {
  genre: string;
  sortBy: 'latest' | 'rating' | 'title';
  yearRange: [number, number];
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>, 
  options = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, options]);

  return isIntersecting;
}

// ============================================================================
// COMPONENTS
// ============================================================================

// Enhanced Payment Modal for Intasend
const PaymentModal: React.FC<{
  movie: Movie;
  onClose: () => void;
  onPaymentSuccess: () => void;
}> = ({ movie, onClose, onPaymentSuccess }) => {
  const { processIntasendPayment, refreshPaymentStatus } = usePaymentService();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0 && pollingActive) {
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
      const result = await processIntasendPayment(
        movie.id,
        phoneNumber
      );

      if (result.success) {
        if (result.data?.alreadyPaid) {
          setShowSuccess(true);
          setTimeout(() => {
            onPaymentSuccess();
          }, 1500);
        } else if (result.data?.reference) {
          // STK Push sent successfully
          setIsProcessing(false);
          setPollingActive(true);
          setCountdown(60);
          pollPaymentStatus(result.data.reference, movie.id);
        } else {
          setError('Payment initiation failed. Please try again.');
          setIsProcessing(false);
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
        const isPaid = await refreshPaymentStatus(movieId);
        
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
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setPollingActive(false);
          setCountdown(0);
        }
      }
    }, 5000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <motion.div 
          className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border border-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Check size={40} className="text-white" />
            </div>
          </div>
          <motion.h2 
            className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Payment Successful! 🎉
          </motion.h2>
          <motion.p 
            className="text-gray-300 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            You can now watch <span className="font-semibold text-white">{movie.title}</span>
          </motion.p>
          <motion.button
            onClick={onPaymentSuccess}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-red-500/30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Watch Now
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-800"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Purchase Movie</h2>
            <p className="text-gray-400 text-sm">Powered by Intasend • M-Pesa</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group"
            disabled={isProcessing || pollingActive}
          >
            <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={movie.posterUrl || '/images/placeholder.jpg'}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{movie.title}</h3>
              <p className="text-gray-400 text-sm">{movie.year} • {movie.duration}</p>
              <div className="flex items-center gap-2 mt-2">
                {movie.genres.slice(0, 2).map((genre, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-md border border-red-600/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Amount</p>
                <p className="text-3xl font-bold text-white">KES 10</p>
              </div>
              <div className="bg-red-600/20 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">One-time purchase • Lifetime access</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              M-Pesa Phone Number
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07XX XXX XXX"
              className="w-full px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 text-white placeholder-gray-500 transition-all"
              disabled={isProcessing || pollingActive}
            />
          </label>
          <p className="text-xs text-gray-400 mt-2 flex items-center">
            <span className="mr-2">📱</span>
            You will receive an M-Pesa prompt on this number
          </p>
        </div>
        
        {error && (
          <motion.div 
            className="mb-4 p-3 bg-red-900/30 border border-red-600/50 rounded-lg text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-300">{error}</span>
            </div>
          </motion.div>
        )}

        {pollingActive && (
          <motion.div 
            className="mb-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-sm font-semibold text-blue-300">Check your phone 📱</span>
            </div>
            <p className="text-xs text-gray-300 mb-3">Enter your M-Pesa PIN when prompted</p>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400 font-mono">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-400 mt-1">Auto-checking payment status...</p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3">
          <motion.button
            onClick={onClose}
            disabled={isProcessing || pollingActive}
            className="flex-1 px-4 py-3 bg-gray-900/50 hover:bg-gray-800 rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handlePayment}
            disabled={isProcessing || pollingActive || !phoneNumber.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-lg hover:shadow-red-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing || pollingActive ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {pollingActive ? 'Verifying...' : 'Processing...'}
              </>
            ) : (
              'LIPA NA MPESA 10 KSH 🔥'
            )}
          </motion.button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure Payment</span>
            </div>
            <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Lock size={10} />
              <span>Encrypted</span>
            </div>
            <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Sparkles size={10} />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced Movie Card Component
const MovieCard: React.FC<{
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  delay?: number;
  showProgress?: boolean;
}> = ({ movie, onPlay, onToggleWishlist, delay = 0, showProgress = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  const getPaymentBadge = useCallback((movie: Movie) => {
    if (!movie.isPremium) {
      return {
        text: 'Free',
        className: 'bg-green-600/90 text-white shadow-lg shadow-green-600/20',
        icon: <Sparkles size={10} />,
        gradient: 'from-green-500 to-emerald-500'
      };
    }
    
    if (movie.paymentStatus === 'paid') {
      return {
        text: 'Purchased',
        className: 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20',
        icon: <Check size={10} />,
        gradient: 'from-blue-500 to-indigo-500'
      };
    }
    
    return {
      text: 'Premium',
      className: 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg shadow-yellow-600/20',
      icon: <Lock size={10} />,
      gradient: 'from-yellow-500 to-amber-500'
    };
  }, []);
  
  const needsPayment = useMemo(() => {
    return movie.isPremium && movie.paymentStatus === 'premium';
  }, [movie.isPremium, movie.paymentStatus]);
  
  const badge = getPaymentBadge(movie);
  
  return (
    <motion.div 
      ref={cardRef}
      className="relative group"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isVisible ? { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          delay: delay * 0.05,
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1]
        }
      } : { opacity: 0, y: 20, scale: 0.95 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        
        {/* Poster Image */}
        <Image 
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className={`object-cover transition-all duration-500 ${
            isHovered ? 'scale-110 blur-sm' : 'scale-100 blur-0'
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          priority={delay < 6}
        />
        
        {/* Progress Bar */}
        {showProgress && movie.progress !== undefined && movie.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-900/80 z-20">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-500 to-pink-500"
              style={{ width: `${movie.progress * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${movie.progress * 100}%` }}
              transition={{ duration: 1, delay: delay * 0.1 }}
            />
          </div>
        )}
        
        {/* Payment Badge */}
        <motion.div 
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 z-20 ${badge.className}`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: delay * 0.05 + 0.2 }}
          whileHover={{ scale: 1.1 }}
        >
          {badge.icon}
          {badge.text}
        </motion.div>
        
        {/* Wishlist Button */}
        <motion.button 
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center z-20 transition-all ${
            movie.isWishlisted 
              ? 'bg-red-500/90 text-white' 
              : 'bg-black/60 text-gray-300 hover:bg-red-500/90 hover:text-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(movie.id);
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay * 0.05 + 0.3, type: "spring" }}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-4 h-4 ${movie.isWishlisted ? 'fill-current' : ''}`} />
        </motion.button>
        
        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40 z-10 flex flex-col justify-end p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Title */}
                <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">
                  {movie.title}
                </h3>
                
                {/* Meta Info */}
                <div className="flex items-center gap-3 text-xs text-gray-300 mb-3">
                  {movie.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {movie.year && <span>{movie.year}</span>}
                  {movie.duration && (
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>{movie.duration}</span>
                    </div>
                  )}
                </div>
                
                {/* Genres */}
                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {movie.genres.slice(0, 2).map((genre, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-white/10 backdrop-blur-sm text-white text-xs rounded-md"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Play Button */}
                <motion.button
                  onClick={() => onPlay(movie)}
                  className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: needsPayment 
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #dc2626 0%, #db2777 100%)'
                  }}
                >
                  {needsPayment ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Purchase
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Watch Now
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Glow Effect on Hover */}
        <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
          isHovered ? 'shadow-2xl shadow-red-500/20' : 'shadow-lg shadow-black/20'
        }`} />
      </div>
      
      {/* Movie Info (Visible Always) */}
      <div className="mt-3 px-1">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1 group-hover:text-red-400 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs">
            {movie.genres[0] || 'Movie'}
          </p>
          {movie.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs text-yellow-500 font-medium">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Genre Card Component
const GenreCard: React.FC<GenreCardProps> = ({ 
  genre, count, color, icon, isActive, onClick 
}) => {
  const colorMap = {
    red: 'from-red-500/20 to-pink-500/20 border-red-500/30',
    blue: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    indigo: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
  };
  
  const activeColorMap = {
    red: 'from-red-600 to-pink-600 shadow-2xl shadow-red-500/30',
    blue: 'from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30',
    green: 'from-green-600 to-emerald-600 shadow-2xl shadow-green-500/30',
    purple: 'from-purple-600 to-violet-600 shadow-2xl shadow-purple-500/30',
    yellow: 'from-yellow-600 to-amber-600 shadow-2xl shadow-yellow-500/30',
    orange: 'from-orange-600 to-amber-500 shadow-2xl shadow-orange-500/30',
    pink: 'from-pink-600 to-rose-600 shadow-2xl shadow-pink-500/30',
    indigo: 'from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/30',
  };
  
  const gradientClass = isActive ? activeColorMap[color as keyof typeof activeColorMap] || activeColorMap.red : colorMap[color as keyof typeof colorMap] || colorMap.red;
  
  return (
    <motion.button
      onClick={onClick}
      className={`relative rounded-xl p-4 transition-all duration-300 overflow-hidden border ${
        isActive ? 'border-transparent' : 'hover:border-gray-600'
      }`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} ${
        isActive ? 'opacity-100' : 'opacity-50'
      }`} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-start">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg backdrop-blur-sm flex items-center justify-center ${
            isActive ? 'bg-white/20' : 'bg-black/30'
          }`}>
            {icon}
          </div>
        </div>
        
        <div className="text-left">
          <h3 className="text-white font-bold text-lg mb-1">{genre}</h3>
          <p className="text-gray-300 text-sm">{count} movies</p>
        </div>
      </div>
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-white"
          layoutId="activeGenreIndicator"
        />
      )}
      
      {/* Glow Effect */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}
    </motion.button>
  );
};

// Featured Movie Banner Component
const FeaturedMovieBanner: React.FC<{
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
}> = ({ movie, onPlay, onToggleWishlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  const needsPayment = useMemo(() => {
    return movie.isPremium && movie.paymentStatus === 'premium';
  }, [movie.isPremium, movie.paymentStatus]);
  
  return (
    <div 
      className="relative rounded-3xl overflow-hidden mb-12 h-[70vh] max-h-[600px] min-h-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image with Gradient */}
      <div className="absolute inset-0">
        <Image
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-700"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <motion.div 
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles size={16} />
              Featured
            </motion.div>
            
            {movie.isPremium && (
              <motion.div 
                className={`${movie.paymentStatus === 'paid' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-yellow-600 to-amber-600'} text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {movie.paymentStatus === 'paid' ? <Check size={16} /> : <Lock size={16} />}
                {movie.paymentStatus === 'paid' ? 'Purchased' : 'Premium'}
              </motion.div>
            )}
            
            {movie.genres.slice(0, 2).map((genre, index) => (
              <motion.div 
                key={genre}
                className="bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm border border-white/20"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                {genre}
              </motion.div>
            ))}
            
            {movie.rating > 0 && (
              <motion.div 
                className="bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border border-yellow-500/30"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Star className="fill-yellow-500 text-yellow-500" size={16} />
                {movie.rating.toFixed(1)}/10
              </motion.div>
            )}
          </div>
          
          {/* Title */}
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {movie.title}
          </motion.h1>
          
          {/* Meta Info */}
          <motion.div 
            className="flex items-center gap-4 text-gray-300 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {movie.year && <span className="text-lg">📅 {movie.year}</span>}
            {movie.duration && <span className="text-lg">⏱️ {movie.duration}</span>}
          </motion.div>
          
          {/* Description */}
          <motion.p 
            className="text-gray-300 text-lg mb-8 max-w-2xl line-clamp-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {movie.description}
          </motion.p>
          
          {/* Actions */}
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={() => onPlay(movie)}
              className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all duration-300 ${
                needsPayment
                  ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {needsPayment ? (
                <>
                  <Lock size={20} />
                  Purchase for KES 10
                </>
              ) : (
                <>
                  <Play className="fill-current" size={20} />
                  Watch Now
                </>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => onToggleWishlist(movie.id)}
              className={`px-6 py-4 rounded-xl font-bold text-lg flex items-center gap-3 backdrop-blur-sm border transition-all ${
                movie.isWishlisted 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={movie.isWishlisted ? 'fill-current' : ''} size={20} />
              {movie.isWishlisted ? 'Wishlisted' : 'Add to List'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Floating Stats */}
      <div className="absolute right-8 top-8 hidden lg:block">
        <div className="flex flex-col gap-3">
          <motion.div 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{movie.rating.toFixed(1)}</div>
              <div className="text-xs text-gray-400">Rating</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Search Component
const SearchBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isSearching: boolean;
}> = ({ value, onChange, onClear, isSearching }) => {
  return (
    <motion.div 
      className="relative mb-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className={`w-5 h-5 ${isSearching ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search movies by title, actor, genre..."
          className="w-full py-4 pl-12 pr-12 bg-gray-900/50 backdrop-blur-xl text-white rounded-2xl border border-gray-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all placeholder-gray-500"
        />
        {value && (
          <motion.button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
            onClick={onClear}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-gray-300" />
          </motion.button>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-800 rounded-md mx-1">/</kbd> to focus search
        </div>
        <div className="text-gray-500">
          <span className="text-red-400">💡</span> Try searching by actor, director, or keyword
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Stats Component
const StatsRow: React.FC<{
  totalMovies: number;
  categories: number;
  featuredMovies: number;
}> = ({ totalMovies, categories, featuredMovies }) => {
  const stats = [
    {
      icon: <Film className="w-6 h-6" />,
      label: "Total Movies",
      value: totalMovies,
      color: "from-red-500/20 to-pink-500/20",
      border: "border-red-500/30"
    },
    {
      icon: <Filter className="w-6 h-6" />,
      label: "Categories",
      value: categories,
      color: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-500/30"
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Featured",
      value: featuredMovies,
      color: "from-yellow-500/20 to-amber-500/20",
      border: "border-yellow-500/30"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      label: "New Today",
      value: Math.floor(Math.random() * 10) + 1,
      color: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {stats.map((stat, index) => (
        <motion.div 
          key={stat.label}
          className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-5 border ${stat.border}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
            <div className="p-3 rounded-xl bg-white/10">
              {stat.icon}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-white to-gray-300"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stat.value / (totalMovies || 1)) * 100)}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Carousel Component for Trending Movies
const Carousel: React.FC<{
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  autoScroll?: boolean;
}> = ({ title, movies, onPlay, onToggleWishlist, autoScroll = false }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { current } = carouselRef;
      const scrollAmount = direction === 'left' 
        ? -current.clientWidth * 0.75
        : current.clientWidth * 0.75;
      
      current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 300);
    }
  };
  
  useEffect(() => {
    if (!autoScroll || isPaused || !carouselRef.current) return;
    
    const carousel = carouselRef.current;
    const scrollWidth = carousel.scrollWidth;
    const clientWidth = carousel.clientWidth;
    
    if (scrollWidth <= clientWidth) return;
    
    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;
    
    const animate = () => {
      scrollPosition += scrollSpeed;
      
      if (scrollPosition >= scrollWidth - clientWidth) {
        scrollPosition = 0;
      }
      
      carousel.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };
    
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationId);
    };
  }, [autoScroll, isPaused]);
  
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [movies.length]);
  
  if (movies.length === 0) return null;
  
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-gray-400 text-sm">Most popular movies right now</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-3 rounded-full transition-all ${canScrollLeft ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-3 rounded-full transition-all ${canScrollRight ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onScroll={checkScrollButtons}
      >
        {movies.map((movie, index) => (
          <div 
            key={movie.id} 
            className="flex-shrink-0 w-[45vw] xs:w-[40vw] sm:w-[30vw] md:w-[22vw] lg:w-[18vw]"
          >
            <MovieCard
              movie={movie}
              onPlay={onPlay}
              onToggleWishlist={onToggleWishlist}
              delay={index}
              showProgress={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DiscoverPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const { service: paymentService } = usePaymentService();
  
  // State Management
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  // Memoized values
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Load payment status for movies (memoized)
  const loadPaymentStatus = useCallback(async (movies: Movie[]) => {
    if (!paymentService || !isInitialized) return movies;

    try {
      const userPaidMovies = await paymentService.getCurrentUserPurchasedMovieIds();
      
      return movies.map(movie => {
        if (movie.isPremium) {
          if (userPaidMovies.includes(movie.id)) {
            return { ...movie, paymentStatus: 'paid' as const };
          } else {
            return { ...movie, paymentStatus: 'premium' as const };
          }
        }
        return { ...movie, paymentStatus: 'free' as const };
      });
    } catch (error) {
      console.error('Error loading payment status:', error);
      return movies.map(movie => ({
        ...movie,
        paymentStatus: movie.isPremium ? ('premium' as const) : ('free' as const)
      }));
    }
  }, [isInitialized, paymentService]);
  
  // Load all data once (prevents duplicate fetches)
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      
      try {
        // Fetch all movies once
        const movies = await service.getAllMovies({ limit: 1000 });
        if (!isMounted) return;
        
        // Load payment status for all movies
        const moviesWithPayment = await loadPaymentStatus(movies);
        if (!isMounted) return;
        
        setAllMovies(moviesWithPayment);
        
        // Set featured movie
        const featured = moviesWithPayment.filter(movie => movie.isFeatured);
        if (featured.length > 0) {
          const randomIndex = Math.floor(Math.random() * featured.length);
          setFeaturedMovie(featured[randomIndex]);
        }
        
        // Set trending movies (top rated + recent)
        const trending = [...moviesWithPayment]
          .sort((a, b) => {
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (Math.abs(ratingDiff) > 0.5) return ratingDiff;
            return Math.random() - 0.5;
          })
          .slice(0, 20);
        setTrendingMovies(trending);
        
        // Calculate genre counts
        const genreMap = new Map<string, number>();
        genreMap.set('All', moviesWithPayment.length);
        
        moviesWithPayment.forEach(movie => {
          movie.genres.forEach(genre => {
            const currentCount = genreMap.get(genre) || 0;
            genreMap.set(genre, currentCount + 1);
          });
        });
        
        const sortedGenres = Array.from(genreMap.entries())
          .filter(([genre]) => genre !== 'All')
          .sort((a, b) => b[1] - a[1])
          .map(([genre]) => genre);
        
        setAvailableGenres(['All', ...sortedGenres]);
        setGenreCounts(Object.fromEntries(genreMap.entries()));
        
      } catch (error) {
        console.error('Error loading discover data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [isInitialized, service, loadPaymentStatus]);
  
  // Handle genre selection (memoized)
  useEffect(() => {
    if (allMovies.length === 0) return;
    
    if (selectedGenre === 'All') {
      setGenreMovies(allMovies);
    } else {
      const filtered = allMovies.filter(movie => 
        movie.genres.some(genre => genre === selectedGenre)
      );
      setGenreMovies(filtered);
    }
  }, [selectedGenre, allMovies]);
  
  // Handle search (memoized)
  useEffect(() => {
    async function performSearch() {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const results = await service.searchMovies(debouncedSearchQuery);
        const resultsWithPayment = await loadPaymentStatus(results);
        setSearchResults(resultsWithPayment);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
    
    performSearch();
  }, [debouncedSearchQuery, service, loadPaymentStatus]);
  
  // Genre card configurations
  const genreIcons = useMemo(() => ({
    'All': <Compass className="w-5 h-5 text-white" />,
    'Action': <Zap className="w-5 h-5 text-white" />,
    'Adventure': <Compass className="w-5 h-5 text-white" />,
    'Animation': <Play className="w-5 h-5 text-white" />,
    'Comedy': <Play className="w-5 h-5 text-white" />,
    'Crime': <Play className="w-5 h-5 text-white" />,
    'Documentary': <Play className="w-5 h-5 text-white" />,
    'Drama': <Play className="w-5 h-5 text-white" />,
    'Family': <Play className="w-5 h-5 text-white" />,
    'Fantasy': <Play className="w-5 h-5 text-white" />,
    'History': <Calendar className="w-5 h-5 text-white" />,
    'Horror': <Play className="w-5 h-5 text-white" />,
    'Music': <Play className="w-5 h-5 text-white" />,
    'Mystery': <Play className="w-5 h-5 text-white" />,
    'Romance': <Heart className="w-5 h-5 text-white" />,
    'Science Fiction': <Play className="w-5 h-5 text-white" />,
    'Thriller': <TrendingUp className="w-5 h-5 text-white" />,
    'War': <Play className="w-5 h-5 text-white" />,
    'Western': <Play className="w-5 h-5 text-white" />,
  }), []);
  
  const genreColors = useMemo(() => ({
    'All': 'red',
    'Action': 'red',
    'Adventure': 'blue',
    'Animation': 'green',
    'Comedy': 'yellow',
    'Crime': 'purple',
    'Documentary': 'indigo',
    'Drama': 'pink',
    'Family': 'green',
    'Fantasy': 'purple',
    'History': 'indigo',
    'Horror': 'red',
    'Music': 'blue',
    'Mystery': 'purple',
    'Romance': 'pink',
    'Science Fiction': 'blue',
    'Thriller': 'red',
    'War': 'orange',
    'Western': 'orange',
  }), []);
  
  // Event Handlers
  const handlePlayMovie = async (movie: Movie) => {
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/discover');
      return;
    }

    if (movie.isPremium && movie.paymentStatus === 'premium') {
      setSelectedMovie(movie);
      setShowPaymentModal(true);
      return;
    }

    router.push(`/play?id=${movie.id}`);
  };
  
  const handleToggleWishlist = async (movieId: string) => {
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      router.push('/auth?redirect=/discover');
      return;
    }

    try {
      await service.toggleWishlist(movieId);
      
      // Update all movie collections
      const updateMovieInCollection = (collection: Movie[]): Movie[] => {
        return collection.map(m => 
          m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m
        );
      };
      
      setAllMovies(prev => updateMovieInCollection(prev));
      setTrendingMovies(prev => updateMovieInCollection(prev));
      setGenreMovies(prev => updateMovieInCollection(prev));
      setSearchResults(prev => updateMovieInCollection(prev));
      
      if (featuredMovie && featuredMovie.id === movieId) {
        setFeaturedMovie(prev => prev ? { ...prev, isWishlisted: !prev.isWishlisted } : null);
      }
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedMovie) return;
    
    try {
      await service.getMovieById(selectedMovie.id);
      
      const updateMovieInCollection = (collection: Movie[]): Movie[] => {
        return collection.map(m => m.id === selectedMovie.id ? { ...m, paymentStatus: 'paid' as const } : m);
      };
      
      setAllMovies(prev => updateMovieInCollection(prev));
      setTrendingMovies(prev => updateMovieInCollection(prev));
      setGenreMovies(prev => updateMovieInCollection(prev));
      setSearchResults(prev => updateMovieInCollection(prev));
      
      if (featuredMovie && featuredMovie.id === selectedMovie.id) {
        setFeaturedMovie(prev => prev ? { ...prev, paymentStatus: 'paid' as const } : null);
      }
      
      setShowPaymentModal(false);
      setSelectedMovie(null);
      router.push(`/play?id=${selectedMovie.id}`);
    } catch (error) {
      console.error('Error updating movie after payment:', error);
      router.push(`/play?id=${selectedMovie.id}`);
    }
  };
  
  // Loading State
  if (isLoading) {
    return (
      <LayoutController>
        <Head>
          <title>Discover – DJ Afro Movies | Browse All Movies</title>
          <meta
            name="description"
            content="Browse and discover trending DJ Afro movies, new releases, and genre-based collections. Continue watching your favorites or add to wishlist anytime."
          />
          <meta
            name="keywords"
            content="DJ Afro movies, trending DJ Afro movies, new releases, African movies online, discover movies"
          />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content="Discover – DJ Afro Movies" />
          <meta
            property="og:description"
            content="Discover and watch trending DJ Afro movies, new releases, and explore genres on DJAfroMovies."
          />
          <meta property="og:image" content="/og-image.jpg" />
          <meta property="og:url" content="https://djafromovies.vercel.app/discover" />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <motion.div 
              className="w-20 h-20 border-t-2 border-b-2 border-red-600 rounded-full mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p 
              className="text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            >
              Loading amazing movies...
            </motion.p>
          </div>
        </div>
      </LayoutController>
    );
  }
  
  return (
    <LayoutController>
      <Head>
        <title>Discover – DJ Afro Movies | Browse All Movies</title>
        <meta
          name="description"
          content="Browse and discover trending DJ Afro movies, new releases, and genre-based collections. Continue watching your favorites or add to wishlist anytime."
        />
        <meta
          name="keywords"
          content="DJ Afro movies, trending DJ Afro movies, new releases, African movies online, discover movies"
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Discover – DJ Afro Movies" />
        <meta
          property="og:description"
          content="Discover and watch trending DJ Afro movies, new releases, and explore genres on DJAfroMovies."
        />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://djafromovies.vercel.app/discover" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Discover Movies
                </h1>
                <p className="text-gray-400 mt-2">
                  Explore {allMovies.length}+ amazing DJ Afro movies
                </p>
              </div>
              <div className="hidden md:block">
                <div className="px-4 py-2 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl border border-red-500/30">
                  <p className="text-sm text-gray-300">
                    <span className="text-red-400 font-semibold">🔥 Hot:</span> All movies at KES 10
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Search */}
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            isSearching={isSearching}
          />
          
          {/* Search Results or Regular Content */}
          {searchQuery ? (
            // Search Results
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                  <span className="text-gray-400 text-lg ml-2">({searchResults.length} movies)</span>
                </h2>
                
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {searchResults.map((movie, index) => (
                      <MovieCard
                        key={`search-${movie.id}`}
                        movie={movie}
                        onPlay={handlePlayMovie}
                        onToggleWishlist={handleToggleWishlist}
                        delay={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-900/50 rounded-full flex items-center justify-center">
                      <Search className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No movies found</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      We couldn&apos;t find any movies matching &ldquo;{searchQuery}&rdquo;. Try different keywords or browse categories below.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl font-semibold transition-all duration-300"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // Regular Content (when not searching)
            <>
              {/* Featured Movie */}
              {featuredMovie && (
                <FeaturedMovieBanner
                  movie={featuredMovie}
                  onPlay={handlePlayMovie}
                  onToggleWishlist={handleToggleWishlist}
                />
              )}
              
              {/* Stats */}
              <StatsRow
                totalMovies={allMovies.length}
                categories={availableGenres.length - 1}
                featuredMovies={allMovies.filter(m => m.isFeatured).length}
              />
              
              {/* Genres */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Browse by Genre</h2>
                    <p className="text-gray-400 text-sm">Explore movies by category</p>
                  </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {availableGenres.slice(0, 12).map((genre) => (
                    <div key={genre} className="flex-shrink-0 w-[200px]">
                      <GenreCard
                        genre={genre}
                        count={genreCounts[genre] || 0}
                        color={genreColors[genre as keyof typeof genreColors] || 'gray'}
                        icon={genreIcons[genre as keyof typeof genreIcons] || <Compass className="w-5 h-5 text-white" />}
                        isActive={selectedGenre === genre}
                        onClick={() => setSelectedGenre(genre)}
                      />
                    </div>
                  ))}
                </div>
                
                {selectedGenre !== 'All' && (
                  <div className="mt-6 flex items-center justify-between bg-gradient-to-r from-red-600/10 via-pink-600/5 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 font-semibold">
                        Showing {genreMovies.length} movies in &ldquo;{selectedGenre}&rdquo; genre
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedGenre('All')}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
              
              {/* Trending Movies */}
              {trendingMovies.length > 0 && (
                <Carousel
                  title="Trending Now"
                  movies={trendingMovies}
                  onPlay={handlePlayMovie}
                  onToggleWishlist={handleToggleWishlist}
                  autoScroll={true}
                />
              )}
              
              {/* Genre Movies Grid */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedGenre === 'All' ? 'All Movies' : `${selectedGenre} Movies`}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {genreMovies.length} movies • Sorted by popularity
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">
                      Sort by: Latest
                    </button>
                  </div>
                </div>
                
                {genreMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {genreMovies.map((movie, index) => (
                      <MovieCard
                        key={`genre-${movie.id}`}
                        movie={movie}
                        onPlay={handlePlayMovie}
                        onToggleWishlist={handleToggleWishlist}
                        delay={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                      <Film className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      No movies available in the &ldquo;{selectedGenre}&rdquo; genre.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Call to Action */}
              <motion.div 
                className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 md:p-12 border border-gray-800 text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="max-w-2xl mx-auto">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Never Miss a New Release
                  </h2>
                  <p className="text-gray-300 mb-8">
                    Subscribe to get notified when new DJ Afro movies are added. Be the first to watch!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <button className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl font-semibold transition-all duration-300">
                      Get Notified
                    </button>
                    <button className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors border border-gray-700">
                      Browse More
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </LayoutController>
  );
}