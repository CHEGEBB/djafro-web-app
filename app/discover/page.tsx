// app/discover/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, X, Play, Star, Heart, 
  ArrowUpRight, Compass, TrendingUp, Clock,
  ChevronRight, ChevronLeft, Calendar, Zap
} from 'lucide-react';
import LayoutController from '@/components/LayoutController';
import { useMovieService } from '@/services/movie_service';
import '@/styles/DiscoverAnimations.scss';

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
}

interface GenreCardProps {
  genre: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

// Custom hook for debouncing
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

// Movie Card Component
const MovieCard: React.FC<{
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  delay?: number;
}> = ({ movie, onPlay, onToggleWishlist, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="discover-movie-card relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 relative">
        <Image 
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
        />
        
        {movie.progress !== undefined && movie.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div 
              className="h-full bg-red-600"
              style={{ width: `${movie.progress * 100}%` }}
            />
          </div>
        )}
        
        {movie.isPremium && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-xs font-bold text-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>PREMIUM</span>
          </div>
        )}
        
        {movie.isWishlisted && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          </div>
        )}
        
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 flex flex-col justify-end p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200 transform hover:scale-105"
                    onClick={() => onPlay(movie)}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                  <button 
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      movie.isWishlisted 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(movie.id);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${movie.isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  {movie.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {movie.genres.slice(0, 2).map((genre, index) => (
                      <span 
                        key={`${movie.id}-genre-${index}`} 
                        className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded-md"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-2">
        <h3 className="text-white font-medium text-sm line-clamp-1">
          {movie.title}
        </h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Movie'}
        </p>
      </div>
    </motion.div>
  );
};

// Genre Card Component
const GenreCard: React.FC<GenreCardProps> = ({ 
  genre, count, color, icon, isActive, onClick 
}) => {
  const gradientMap: Record<string, string> = {
    red: 'from-red-600 to-pink-600',
    blue: 'from-blue-600 to-indigo-600',
    green: 'from-green-600 to-emerald-600',
    purple: 'from-purple-600 to-violet-600',
    yellow: 'from-yellow-600 to-amber-600',
    orange: 'from-orange-600 to-amber-500',
    pink: 'from-pink-600 to-rose-600',
    indigo: 'from-indigo-600 to-purple-600',
  };
  
  const gradientClass = gradientMap[color] || 'from-gray-700 to-gray-600';
  
  return (
    <motion.button
      onClick={onClick}
      className={`discover-genre-card relative overflow-hidden rounded-xl transition-all duration-300 ${
        isActive 
          ? 'ring-2 ring-offset-2 ring-offset-black ring-opacity-70 shadow-lg scale-105' 
          : 'hover:scale-105'
      }`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ 
        minWidth: '180px',
        height: '90px',
        backgroundColor: isActive ? 'rgb(40, 40, 40)' : 'rgb(30, 30, 30)'
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-${isActive ? '100' : '70'}`} />
      
      <div className="relative z-10 h-full flex flex-col justify-between p-3">
        <div className="flex justify-between items-start">
          <div className={`w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
            {icon}
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium">
            {count}
          </div>
        </div>
        
        <h3 className="text-white font-semibold">{genre}</h3>
      </div>
      
      {isActive && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-white"
          layoutId="activeGenreIndicator"
        />
      )}
    </motion.button>
  );
};

// Featured Movie Banner
const FeaturedMovieBanner: React.FC<{
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
}> = ({ movie, onPlay, onToggleWishlist }) => {
  if (!movie) return null;
  
  return (
    <div className="discover-featured relative overflow-hidden rounded-2xl mb-8">
      <div 
        className="h-[50vh] md:h-[60vh] relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${movie.backdropUrl || movie.posterUrl})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="relative h-full z-10 flex flex-col justify-end p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600 text-white px-3 py-1 text-sm font-medium rounded-md">
                Discover
              </div>
              {movie.genres && movie.genres.length > 0 && (
                <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 text-sm font-medium rounded-md">
                  {movie.genres[0]}
                </div>
              )}
              {movie.rating && (
                <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 line-clamp-2">
              {movie.title}
            </h1>
            
            <p className="text-gray-300 mb-6 line-clamp-2 md:line-clamp-3 max-w-3xl">
              {movie.description}
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onPlay(movie)}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </button>
              <button
                onClick={() => onToggleWishlist(movie.id)}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  movie.isWishlisted 
                    ? 'bg-white/10 text-red-500 border border-red-500/50' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <Heart className={`w-5 h-5 ${movie.isWishlisted ? 'fill-current' : ''}`} />
                {movie.isWishlisted ? 'Wishlisted' : 'Add to List'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Search Box Component
const SearchBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isSearching: boolean;
}> = ({ value, onChange, onClear, isSearching }) => {
  return (
    <div className="relative mb-8">
      <div className="discover-search-container relative flex items-center">
        <div className="absolute left-4">
          <Search className={`w-5 h-5 ${isSearching ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for movies by title, actor, or genre..."
          className="discover-search-input w-full py-4 pl-12 pr-12 bg-gray-900/80 backdrop-blur-lg text-white rounded-xl border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
        />
        {value && (
          <button 
            className="absolute right-4 bg-gray-800 hover:bg-gray-700 p-1.5 rounded-full transition-colors"
            onClick={onClear}
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
};

// Movie Grid Component
const MovieGrid: React.FC<{
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  title?: string;
  emptyMessage?: string;
}> = ({ movies, onPlay, onToggleWishlist, title, emptyMessage }) => {
  return (
    <div className="mb-12">
      {title && (
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          {title}
          <span className="text-sm font-normal text-gray-400 ml-2">
            {movies.length} movies
          </span>
        </h2>
      )}
      
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPlay={onPlay}
              onToggleWishlist={onToggleWishlist}
              delay={index}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {emptyMessage || "We couldn't find any movies matching your search. Try different keywords or browse categories."}
          </p>
        </div>
      )}
    </div>
  );
};

// Carousel Component
const Carousel: React.FC<{
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: string) => void;
  autoScroll?: boolean;
}> = ({ title, movies, onPlay, onToggleWishlist, autoScroll = false }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
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
    const scrollSpeed = 0.5; // pixels per frame
    
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
  
  if (movies.length === 0) return null;
  
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {movies.map((movie, index) => (
          <div 
            key={movie.id} 
            className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
          >
            <MovieCard
              movie={movie}
              onPlay={onPlay}
              onToggleWishlist={onToggleWishlist}
              delay={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats Row Component
const StatsRow: React.FC<{
  totalMovies: number;
  categories: number;
  featuredMovies: number;
}> = ({ totalMovies, categories, featuredMovies }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
            <Play className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Movies</p>
            <h3 className="text-2xl font-bold text-white">{totalMovies}</h3>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Filter className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Categories</p>
            <h3 className="text-2xl font-bold text-white">{categories}</h3>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Featured Movies</p>
            <h3 className="text-2xl font-bold text-white">{featuredMovies}</h3>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main DiscoverPage Component
export default function DiscoverPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
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
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Initialize data
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      
      try {
        // Get all movies
        const movies = await service.getAllMovies({ limit: 1000 });
        setAllMovies(movies);
        
        // Get featured movie
        const featured = await service.getFeaturedMovies();
        if (featured.length > 0) {
          // Randomize featured movie
          const randomIndex = Math.floor(Math.random() * featured.length);
          setFeaturedMovie(featured[randomIndex]);
        }
        
        // Get trending movies
        const trending = await service.getTrendingMovies();
        setTrendingMovies(trending);
        
        // Extract and count genres
        const genreMap = new Map<string, number>();
        genreMap.set('All', movies.length);
        
        movies.forEach(movie => {
          movie.genres.forEach(genre => {
            const currentCount = genreMap.get(genre) || 0;
            genreMap.set(genre, currentCount + 1);
          });
        });
        
        // Convert to array and sort by count
        const sortedGenres = Array.from(genreMap.entries())
          .filter(([genre]) => genre !== 'All')
          .sort((a, b) => b[1] - a[1])
          .map(([genre]) => genre);
        
        setAvailableGenres(['All', ...sortedGenres]);
        setGenreCounts(Object.fromEntries(genreMap.entries()));
        
      } catch (error) {
        console.error('Error loading discover data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isInitialized, service]);
  
  // Handle genre selection
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
  
  // Handle search
  useEffect(() => {
    async function performSearch() {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const results = await service.searchMovies(debouncedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
    
    performSearch();
  }, [debouncedSearchQuery, service]);
  
  // Genre card icons
  const genreIcons: Record<string, React.ReactNode> = {
    'All': <Compass className="w-4 h-4 text-white" />,
    'Action': <Zap className="w-4 h-4 text-white" />,
    'Adventure': <Compass className="w-4 h-4 text-white" />,
    'Animation': <Play className="w-4 h-4 text-white" />,
    'Comedy': <Play className="w-4 h-4 text-white" />,
    'Crime': <Play className="w-4 h-4 text-white" />,
    'Documentary': <Play className="w-4 h-4 text-white" />,
    'Drama': <Play className="w-4 h-4 text-white" />,
    'Family': <Play className="w-4 h-4 text-white" />,
    'Fantasy': <Play className="w-4 h-4 text-white" />,
    'History': <Calendar className="w-4 h-4 text-white" />,
    'Horror': <Play className="w-4 h-4 text-white" />,
    'Music': <Play className="w-4 h-4 text-white" />,
    'Mystery': <Play className="w-4 h-4 text-white" />,
    'Romance': <Heart className="w-4 h-4 text-white" />,
    'Science Fiction': <Play className="w-4 h-4 text-white" />,
    'Thriller': <TrendingUp className="w-4 h-4 text-white" />,
    'War': <Play className="w-4 h-4 text-white" />,
    'Western': <Play className="w-4 h-4 text-white" />,
  };
  
  // Genre card colors
  const genreColors: Record<string, string> = {
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
  };
  
  const handlePlayMovie = (movie: Movie) => {
    router.push(`/play?id=${movie.id}`);
  };
  
  const handleToggleWishlist = async (movieId: string) => {
    try {
      await service.toggleWishlist(movieId);
      
      // Update all movie lists
      setAllMovies(prev => prev.map(m => 
        m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m
      ));
      
      setTrendingMovies(prev => prev.map(m => 
        m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m
      ));
      
      setGenreMovies(prev => prev.map(m => 
        m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m
      ));
      
      setSearchResults(prev => prev.map(m => 
        m.id === movieId ? { ...m, isWishlisted: !m.isWishlisted } : m
      ));
      
      if (featuredMovie && featuredMovie.id === movieId) {
        setFeaturedMovie({ ...featuredMovie, isWishlisted: !featuredMovie.isWishlisted });
      }
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };
  
  if (isLoading) {
    return (
      <LayoutController>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-t-2 border-r-2 border-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Loading movies...</p>
          </div>
        </div>
      </LayoutController>
    );
  }
  
  return (
    <LayoutController>
      <div className="min-h-screen bg-black text-white pb-12">
        <div className="container mx-auto px-4">
          <div className="pt-6 md:pt-8">
            {/* Header */}
            <div className="mb-8">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Discover Movies
              </motion.h1>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Find new and exciting DJ Afro movies to watch
              </motion.p>
            </div>
            
            {/* Search Box */}
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              isSearching={isSearching}
            />
            
            {/* Featured Banner (show only if not searching) */}
            {!searchQuery && featuredMovie && (
              <FeaturedMovieBanner
                movie={featuredMovie}
                onPlay={handlePlayMovie}
                onToggleWishlist={handleToggleWishlist}
              />
            )}
            
            {/* Stats Row (show only if not searching) */}
            {!searchQuery && (
              <StatsRow
                totalMovies={allMovies.length}
                categories={availableGenres.length - 1} // minus "All"
                featuredMovies={allMovies.filter(m => m.isFeatured).length}
              />
            )}
            
            {/* Genre Cards (show only if not searching) */}
            {!searchQuery && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-6">Browse by Genre</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {availableGenres.slice(0, 10).map((genre) => (
                    <GenreCard
                      key={genre}
                      genre={genre}
                      count={genreCounts[genre] || 0}
                      color={genreColors[genre] || 'gray'}
                      icon={genreIcons[genre] || <Compass className="w-4 h-4 text-white" />}
                      isActive={selectedGenre === genre}
                      onClick={() => setSelectedGenre(genre)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Results */}
            {searchQuery && (
              <MovieGrid
                movies={searchResults}
                onPlay={handlePlayMovie}
                onToggleWishlist={handleToggleWishlist}
                title={`Search Results for "${searchQuery}"`}
                emptyMessage={`No movies found matching "${searchQuery}". Try a different search term.`}
              />
            )}
            
            {/* Trending Movies (show only if not searching) */}
            {!searchQuery && trendingMovies.length > 0 && (
              <Carousel
                title="Trending Now"
                movies={trendingMovies}
                onPlay={handlePlayMovie}
                onToggleWishlist={handleToggleWishlist}
                autoScroll={true}
              />
            )}
            
            {/* Genre-filtered Movies (show only if not searching) */}
            {!searchQuery && (
              <MovieGrid
                movies={genreMovies}
                onPlay={handlePlayMovie}
                onToggleWishlist={handleToggleWishlist}
                title={selectedGenre === 'All' ? 'All Movies' : `${selectedGenre} Movies`}
              />
            )}
          </div>
        </div>
      </div>
    </LayoutController>
  );
}