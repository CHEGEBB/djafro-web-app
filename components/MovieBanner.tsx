/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieBanner.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Info, Users } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface MovieBannerProps {
  movie: any;
  isLoading?: boolean;
}

const MovieBanner: React.FC<MovieBannerProps> = ({ movie, isLoading = false }) => {
  const { colors } = useTheme();
  
  if (isLoading) {
    return (
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden skeleton-loading">
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <div className="h-10 w-64 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-800 rounded mb-4"></div>
          <div className="h-10 w-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  const { title, description, genres = [], posterUrl } = movie;
  
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden banner-animation">
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
      
      <div className="absolute inset-0">
        <Image 
          src={posterUrl || '/images/placeholder.jpg'} 
          alt={title}
          layout="fill"
          objectFit="cover"
          priority
          className="opacity-90"
        />
      </div>
      
      <div className="absolute bottom-0 left-0 p-8 z-20 w-full md:w-2/3">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        
        <div className="flex items-center text-sm mb-4">
          <span className="bg-yellow-500 text-black px-2 py-0.5 rounded mr-2">HD</span>
          <span className="mr-2 text-gray-300">2023</span>
          <span className="mr-2 text-gray-300">•</span>
          <span className="text-gray-300">2h 15m</span>
          <span className="ml-4 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>+6 friends are watching</span>
          </span>
        </div>
        
        <p className="text-gray-300 mb-6 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {genres.map((genre: string) => (
            <span 
              key={genre} 
              className="bg-gray-800 text-gray-300 px-3 py-1 text-xs rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button 
            className="flex items-center px-6 py-2 rounded-md bg-[#E50914] hover:bg-red-700 transition-colors"
            style={{ backgroundColor: colors.primary }}
          >
            <Play className="w-5 h-5 mr-2" />
            Watch
          </button>
          <button className="flex items-center px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
            <Info className="w-5 h-5 mr-2" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieBanner;