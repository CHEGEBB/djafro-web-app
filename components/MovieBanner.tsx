/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieBanner.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Info, Users } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface MovieBannerProps {
  movie?: any;
  isLoading?: boolean;
}

const MovieBanner: React.FC<MovieBannerProps> = ({ movie, isLoading = false }) => {
  const { colors } = useTheme();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full z-20">
          <div className="h-10 w-64 bg-gray-700 rounded mb-4 animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-700 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-700 rounded mb-4 animate-pulse"></div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle empty/no movie state
  if (!movie) {
    return (
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50"></div>
        <div className="text-center z-20 p-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">No Featured Movie</h1>
          <p className="text-gray-400 mb-6">Check back later for new featured content.</p>
          <button 
            className="px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-white"
          >
            Browse Movies
          </button>
        </div>
      </div>
    );
  }
  
  // Extract movie properties with fallbacks
  const { 
    title = 'Untitled Movie',
    description = 'No description available.',
    genres = [],
    posterUrl = '/images/placeholder.jpg',
    year = '2024',
    duration = '2h 00m',
    rating = 'HD'
  } = displayMovie;
  
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
      
      {/* Background image */}
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image 
          src={posterUrl} 
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
          priority
          className="opacity-90"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder.jpg';
          }}
        />
      </div>
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 w-full md:w-2/3">
        <div className="transform transition-all duration-300 group-hover:translate-y-[-4px]">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">
            {title}
          </h1>
          
          {/* Movie details */}
          <div className="flex items-center text-sm mb-4 flex-wrap gap-2">
            <span className="bg-yellow-500 text-black px-2 py-0.5 rounded font-medium">
              {rating}
            </span>
            <span className="text-gray-300">{year}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">{duration}</span>
            <span className="hidden md:flex items-center ml-4 text-gray-300">
              <Users className="w-4 h-4 mr-1" />
              <span>+6 friends watching</span>
            </span>
          </div>
          
          {/* Description */}
          <p className="text-gray-300 mb-6 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {description}
          </p>
          
          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {genres.slice(0, 4).map((genre: string, index: number) => (
                <span 
                  key={`${genre}-${index}`}
                  className="bg-gray-800/80 backdrop-blur-sm text-gray-300 px-3 py-1 text-xs rounded-full border border-gray-700 hover:bg-gray-700/80 transition-colors"
                >
                  {genre}
                </span>
              ))}
              {genres.length > 4 && (
                <span className="text-gray-400 text-xs px-3 py-1">
                  +{genres.length - 4} more
                </span>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              className="flex items-center justify-center px-6 py-3 rounded-md bg-red-600 hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
              style={{ backgroundColor: colors?.primary || '#E50914' }}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Watch Now
            </button>
            <button className="flex items-center justify-center px-6 py-3 rounded-md bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600/80 transition-all duration-200 border border-gray-600 font-medium">
              <Info className="w-5 h-5 mr-2" />
              More Info
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent z-5"></div>
    </div>
  );
};

export default MovieBanner;