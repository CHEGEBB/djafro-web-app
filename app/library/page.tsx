// app/library/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LayoutController from '@/components/LayoutController';
import { useMovieService } from '@/services/movie_service';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, PlayCircle, Clock, Calendar, Trash2, Star, ChevronRight, Film, User, History, BookOpen, BookMarked, ListFilter, Check, X, Info } from 'lucide-react';
import '@/styles/libraryAnimations.scss';

// Types for our library items
interface LibraryMovie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  progress?: number;
  isWishlisted?: boolean;
  rating?: number;
  year?: string;
  duration?: string;
  genres?: string[];
  lastWatchedAt?: number;
  userRating?: number;
}

interface LibraryStats {
  totalMovies: number;
  inProgress: number;
  wishlisted: number;
  completedMovies: number;
  averageRating: number;
  totalWatchTime: number; // in minutes
}

// Component for the welcome banner
const WelcomeBanner: React.FC<{ userName: string; stats: LibraryStats }> = ({ userName, stats }) => {
  return (
    <motion.div 
      className="mb-8 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent z-10" />
        
        {/* Abstract background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="w-full h-full opacity-40" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="welcome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#831010" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="black" />
            <circle cx="150" cy="150" r="100" fill="url(#welcome-gradient)" />
            <circle cx="300" cy="250" r="80" fill="url(#welcome-gradient)" opacity="0.7" />
            <circle cx="50" cy="300" r="60" fill="url(#welcome-gradient)" opacity="0.5" />
          </svg>
        </div>
        
        <div className="relative z-20 py-8 px-6 md:px-10 lg:px-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* User avatar and greeting */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Welcome back, <span className="text-red-500">{userName}</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  Here's your personal movie collection
                </p>
              </div>
            </div>
            
            {/* Stats overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:ml-auto">
              <motion.div 
                className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Film className="w-3 h-3" />
                  <span>Total Movies</span>
                </div>
                <p className="text-white text-xl font-bold">{stats.totalMovies}</p>
              </motion.div>
              
              <motion.div 
                className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <History className="w-3 h-3" />
                  <span>In Progress</span>
                </div>
                <p className="text-white text-xl font-bold">{stats.inProgress}</p>
              </motion.div>
              
              <motion.div 
                className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <BookMarked className="w-3 h-3" />
                  <span>Wishlisted</span>
                </div>
                <p className="text-white text-xl font-bold">{stats.wishlisted}</p>
              </motion.div>
              
              <motion.div 
                className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Check className="w-3 h-3" />
                  <span>Completed</span>
                </div>
                <p className="text-white text-xl font-bold">{stats.completedMovies}</p>
              </motion.div>
            </div>
          </div>
          
          {/* Activity summary bar */}
          {stats.totalMovies > 0 && (
            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex flex-wrap gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Watch Activity</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-white font-medium">
                        {Math.floor(stats.totalWatchTime / 60)} hours {stats.totalWatchTime % 60} minutes
                      </span>
                      <span className="text-gray-500 text-sm">total watch time</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Average Rating</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-white font-medium">
                        {stats.averageRating.toFixed(1)} <span className="text-yellow-500">★</span>
                      </span>
                      <span className="text-gray-500 text-sm">from your ratings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Component for filter options
const FilterPanel: React.FC<{
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}> = ({ activeFilter, setActiveFilter, searchQuery, setSearchQuery, sortOption, setSortOption }) => {
  const filters = [
    { id: 'all', label: 'All Movies', icon: <Film className="w-4 h-4" /> },
    { id: 'in-progress', label: 'In Progress', icon: <History className="w-4 h-4" /> },
    { id: 'wishlisted', label: 'My Wishlist', icon: <Heart className="w-4 h-4" /> },
    { id: 'completed', label: 'Completed', icon: <Check className="w-4 h-4" /> }
  ];

  const sortOptions = [
    { value: 'last-watched', label: 'Recently Watched' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'rating-desc', label: 'Highest Rated' }
  ];

  return (
    <div className="mb-8">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Mobile filter UI */}
        <div className="md:hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Filter Library</h3>
              <ListFilter className="w-4 h-4 text-gray-400" />
            </div>
            
            {/* Search bar for mobile */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            
            {/* Mobile dropdown for filter */}
            <div className="mb-3">
              <label className="block text-gray-400 text-xs mb-1">Filter</label>
              <select 
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l4-4-1-1-3 3-3-3-1 1 4 4z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {filters.map(filter => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Mobile dropdown for sort */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">Sort By</label>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l4-4-1-1-3 3-3-3-1 1 4 4z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Desktop filter UI */}
        <div className="hidden md:flex flex-wrap md:flex-nowrap justify-between items-center p-4">
          {/* Filter tabs */}
          <div className="flex space-x-1">
            {filters.map(filter => (
              <motion.button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeFilter === filter.id 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.icon}
                {filter.label}
                {activeFilter === filter.id && (
                  <motion.span
                    className="flex h-5 w-5 items-center justify-center bg-white bg-opacity-30 rounded-full text-[10px] font-semibold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Check className="w-3 h-3" />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            
            {/* Sort dropdown */}
            <div className="relative">
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-red-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Movie card component
const MovieCard: React.FC<{
  movie: LibraryMovie;
  onPlay: (id: string) => void;
  onToggleWishlist: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ movie, onPlay, onToggleWishlist, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format last watched date
  const formatLastWatched = (timestamp?: number) => {
    if (!timestamp) return 'Never watched';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };
  
  return (
    <motion.div 
      className="relative rounded-xl overflow-hidden group shadow-lg border border-gray-800"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image with Overlay */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image 
          src={movie.posterUrl || '/images/placeholder.jpg'}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 280px"
        />
        
        {/* Progress bar if in progress */}
        {movie.progress !== undefined && movie.progress > 0 && movie.progress < 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${movie.progress * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
        )}
        
        {/* Completed badge */}
        {movie.progress === 1 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center">
            <Check className="w-3 h-3 mr-1" />
            Completed
          </div>
        )}
        
        {/* Wishlisted indicator */}
        {movie.isWishlisted && (
          <div className="absolute top-2 left-2 bg-red-500/80 backdrop-blur-sm text-white text-xs font-bold p-1 rounded-full">
            <Heart className="w-3 h-3 fill-white" />
          </div>
        )}
        
        {/* Info overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          <div className="mb-2">
            <h3 className="text-white font-bold text-lg line-clamp-2">{movie.title}</h3>
            {movie.genres && (
              <div className="flex flex-wrap gap-1 mt-1">
                {movie.genres.slice(0, 2).map((genre, idx) => (
                  <span key={idx} className="text-xs bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{movie.duration || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{movie.year || 'Unknown'}</span>
            </div>
            {movie.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span>{movie.rating}</span>
              </div>
            )}
          </div>
          
          {/* Last watched info */}
          {movie.lastWatchedAt && (
            <div className="text-xs text-gray-500 mb-3">
              Last watched: {formatLastWatched(movie.lastWatchedAt)}
            </div>
          )}
          
          <div className="flex gap-2">
            <motion.button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-medium"
              onClick={() => onPlay(movie.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlayCircle className="w-4 h-4" />
              {movie.progress && movie.progress > 0 && movie.progress < 1 ? 'Continue' : 'Play'}
            </motion.button>
            
            <motion.button
              className={`p-2 rounded-lg border ${
                movie.isWishlisted 
                  ? 'bg-red-500/20 border-red-500 text-red-500' 
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-500'
              }`}
              onClick={() => onToggleWishlist(movie.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className={`w-4 h-4 ${movie.isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(movie.id);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Info below poster (visible on mobile) */}
      <div className="p-3 bg-gray-900 md:hidden">
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{movie.title}</h3>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {movie.progress === 1 ? 'Completed' : 
             movie.progress && movie.progress > 0 ? `${Math.round(movie.progress * 100)}%` :
             movie.isWishlisted ? 'Wishlisted' : 'Not started'}
          </span>
          
          {movie.rating && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>{movie.rating}</span>
            </div>
          )}
        </div>
        
        {/* Mobile progress bar */}
        {movie.progress !== undefined && movie.progress > 0 && movie.progress < 1 && (
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${movie.progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
        
        {/* Mobile action buttons */}
        <div className="mt-3 flex gap-2">
          <button 
            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg flex items-center justify-center gap-1"
            onClick={() => onPlay(movie.id)}
          >
            <PlayCircle className="w-3 h-3" />
            {movie.progress && movie.progress > 0 && movie.progress < 1 ? 'Continue' : 'Play'}
          </button>
          
          <button
            className={`p-1.5 rounded-lg ${
              movie.isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
            onClick={() => onToggleWishlist(movie.id)}
          >
            <Heart className={`w-3 h-3 ${movie.isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Empty state component
const EmptyState: React.FC<{
  message: string;
  subMessage?: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
}> = ({ message, subMessage, icon, action }) => {
  return (
    <motion.div 
      className="w-full py-16 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
      {subMessage && <p className="text-gray-400 max-w-md mb-6">{subMessage}</p>}
      
      {action && (
        <motion.button 
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2"
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
};

// Main component
export default function LibraryPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const [user, setUser] = useState<any>(null);
  const [allLibraryMovies, setAllLibraryMovies] = useState<LibraryMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<LibraryMovie[]>([]);
  const [wishlistedMovies, setWishlistedMovies] = useState<LibraryMovie[]>([]);
  const [continueWatchingMovies, setContinueWatchingMovies] = useState<LibraryMovie[]>([]);
  const [completedMovies, setCompletedMovies] = useState<LibraryMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('last-watched');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<LibraryStats>({
    totalMovies: 0,
    inProgress: 0,
    wishlisted: 0,
    completedMovies: 0,
    averageRating: 0,
    totalWatchTime: 0
  });

  // Initialize and load library data
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      try {
        // Get current user
        const currentUser = service.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        // Fetch library data
        const wishlist = await service.getWishlistedMovies();
        setWishlistedMovies(wishlist);
        
        const continueWatching = await service.getContinueWatchingMovies();
        setContinueWatchingMovies(continueWatching);
        
        // Process data
        const inProgressMovies = continueWatching.filter(movie => movie.progress !== undefined && movie.progress > 0 && movie.progress < 1);
        const completedMovies = continueWatching.filter(movie => movie.progress === 1);
        setCompletedMovies(completedMovies);
        
        // Combine all library movies (removing duplicates)
        const allMoviesMap = new Map();
        [...wishlist, ...continueWatching].forEach(movie => {
          allMoviesMap.set(movie.id, movie);
        });
        const allMovies = Array.from(allMoviesMap.values());
        setAllLibraryMovies(allMovies);
        
        // Calculate stats
        const totalWatchTime = inProgressMovies.reduce((total, movie) => {
          // Estimate watch time from progress and duration
          if (movie.duration) {
            const durationMatch = movie.duration.match(/(\d+)h\s*(\d*)m?/);
            if (durationMatch) {
              const hours = parseInt(durationMatch[1]) || 0;
              const minutes = parseInt(durationMatch[2]) || 0;
              const totalMinutes = hours * 60 + minutes;
              return total + (totalMinutes * (movie.progress || 0));
            }
          }
          return total + 30; // Default to 30 minutes if duration can't be parsed
        }, 0);
        
        const totalRated = allMovies.filter(movie => movie.userRating).length;
        const sumRatings = allMovies.reduce((sum, movie) => sum + (movie.userRating || 0), 0);
        
        setStats({
          totalMovies: allMovies.length,
          inProgress: inProgressMovies.length,
          wishlisted: wishlist.filter(movie => movie.isWishlisted).length,
          completedMovies: completedMovies.length,
          averageRating: totalRated > 0 ? sumRatings / totalRated : 0,
          totalWatchTime: Math.round(totalWatchTime)
        });
        
        // Apply initial filter
        updateFilteredMovies(allMovies, 'all', '', sortOption);
        
      } catch (error) {
        console.error('Error loading library data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isInitialized, service, router]);
  
  // Update filtered movies when filter/search/sort changes
  useEffect(() => {
    updateFilteredMovies(allLibraryMovies, activeFilter, searchQuery, sortOption);
  }, [activeFilter, searchQuery, sortOption]);
  
  // Function to update filtered movies
  const updateFilteredMovies = (movies: LibraryMovie[], filter: string, search: string, sort: string) => {
    // Apply filter
    let result = [...movies];
    
    if (filter === 'in-progress') {
      result = result.filter(movie => movie.progress !== undefined && movie.progress > 0 && movie.progress < 1);
    } else if (filter === 'wishlisted') {
      result = result.filter(movie => movie.isWishlisted);
    } else if (filter === 'completed') {
      result = result.filter(movie => movie.progress === 1);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(movie => 
        movie.title.toLowerCase().includes(searchLower) ||
        (movie.genres && movie.genres.some(genre => 
          genre.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    // Apply sort
    if (sort === 'last-watched') {
      result.sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
    } else if (sort === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'title-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setFilteredMovies(result);
  };
  
  // Event handlers
  const handlePlayMovie = (movieId: string) => {
    router.push(`/play?id=${movieId}`);
  };
  
  const handleToggleWishlist = async (movieId: string) => {
    try {
      const newStatus = await service.toggleWishlist(movieId);
      
      // Update all movie arrays
      const updateMovieInArray = (movies: LibraryMovie[]) => {
        return movies.map(movie => 
          movie.id === movieId ? { ...movie, isWishlisted: newStatus } : movie
        );
      };
      
      setAllLibraryMovies(updateMovieInArray(allLibraryMovies));
      setFilteredMovies(updateMovieInArray(filteredMovies));
      setWishlistedMovies(updateMovieInArray(wishlistedMovies));
      setContinueWatchingMovies(updateMovieInArray(continueWatchingMovies));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        wishlisted: newStatus 
          ? prev.wishlisted + 1 
          : Math.max(0, prev.wishlisted - 1)
      }));
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };
  
  const handleRemoveFromLibrary = (movieId: string) => {
    setShowDeleteConfirm(movieId);
  };
  
  const confirmRemoveFromLibrary = async () => {
    if (!showDeleteConfirm) return;
    
    const movieId = showDeleteConfirm;
    try {
      // Here you would call your API to remove from library
      // For now we'll just update the UI
      
      // Find movie to determine what stats to update
      const movie = allLibraryMovies.find(m => m.id === movieId);
      
      // Update all arrays to remove this movie
      const filterMovieFromArray = (movies: LibraryMovie[]) => {
        return movies.filter(movie => movie.id !== movieId);
      };
      
      setAllLibraryMovies(filterMovieFromArray(allLibraryMovies));
      setFilteredMovies(filterMovieFromArray(filteredMovies));
      setWishlistedMovies(filterMovieFromArray(wishlistedMovies));
      setContinueWatchingMovies(filterMovieFromArray(continueWatchingMovies));
      setCompletedMovies(filterMovieFromArray(completedMovies));
      
      // Update stats
      if (movie) {
        setStats(prev => ({
          ...prev,
          totalMovies: prev.totalMovies - 1,
          inProgress: movie.progress && movie.progress > 0 && movie.progress < 1 
            ? prev.inProgress - 1 
            : prev.inProgress,
          wishlisted: movie.isWishlisted 
            ? prev.wishlisted - 1 
            : prev.wishlisted,
          completedMovies: movie.progress === 1 
            ? prev.completedMovies - 1 
            : prev.completedMovies
        }));
      }
      
    } catch (error) {
      console.error('Error removing from library:', error);
    } finally {
      setShowDeleteConfirm(null);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <LayoutController>
        <div className="min-h-screen bg-black text-white">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="loader">
                  <div className="film-reel">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="45" stroke="#E50914" strokeWidth="5" />
                      <circle cx="50" cy="20" r="8" fill="#E50914">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="80" cy="50" r="8" fill="#E50914">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.1s" />
                      </circle>
                      <circle cx="50" cy="80" r="8" fill="#E50914">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.2s" />
                      </circle>
                      <circle cx="20" cy="50" r="8" fill="#E50914">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.3s" />
                      </circle>
                    </svg>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading Your Library</h2>
              <p className="text-gray-400">Fetching your personal collection of movies...</p>
            </div>
          </div>
        </div>
      </LayoutController>
    );
  }
  
  // Check if user is authenticated
  if (!user) {
    return (
      <LayoutController>
        <div className="min-h-screen bg-black text-white">
          <EmptyState 
            message="Sign in to access your library"
            subMessage="Your personal movie collection will appear here after you sign in."
            icon={<User className="w-12 h-12 text-red-500" />}
            action={{ label: "Sign In", onClick: () => router.push('/login') }}
          />
        </div>
      </LayoutController>
    );
  }
  
  return (
    <LayoutController>
      <div className="min-h-screen bg-black text-white pb-10">
        {/* Welcome section with user stats */}
        <WelcomeBanner 
          userName={user.name || 'Movie Fan'} 
          stats={stats} 
        />
        
        {/* Filters and search */}
        <FilterPanel 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
        
        {/* Grid of filtered movies */}
        <div className="relative">
          {filteredMovies.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {filteredMovies.map((movie, index) => (
                <motion.div
                  key={`${movie.id}-${activeFilter}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <MovieCard 
                    movie={movie}
                    onPlay={handlePlayMovie}
                    onToggleWishlist={handleToggleWishlist}
                    onRemove={handleRemoveFromLibrary}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="mt-8">
              {activeFilter === 'all' && searchQuery === '' ? (
                <EmptyState 
                  message="Your library is empty"
                  subMessage="Start watching movies or add them to your wishlist to build your collection."
                  icon={<BookOpen className="w-12 h-12 text-red-500" />}
                  action={{ label: "Discover Movies", onClick: () => router.push('/movies') }}
                />
              ) : (
                <EmptyState 
                  message={searchQuery ? "No results found" : "No movies in this category"}
                  subMessage={searchQuery 
                    ? `No movies matching "${searchQuery}" in your library.` 
                    : `You don't have any movies in the "${activeFilter === 'in-progress' ? 'In Progress' : activeFilter === 'wishlisted' ? 'Wishlist' : 'Completed'}" category.`
                  }
                  icon={<Info className="w-12 h-12 text-gray-500" />}
                  action={{ label: "View All Movies", onClick: () => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }}}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Remove from Library?</h3>
              <p className="text-gray-300 mb-6">
                This will remove the movie from your library, including any watch progress and wishlist status.
              </p>
              <div className="flex gap-4">
                <button 
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  onClick={confirmRemoveFromLibrary}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </LayoutController>
  );
}