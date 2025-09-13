/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MovieRow.tsx
'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';

interface MovieRowProps {
  title: string;
  movies: any[];
  isLoading?: boolean;
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, isLoading = false }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollTo = direction === 'left' 
      ? scrollLeft - clientWidth * 0.75 
      : scrollLeft + clientWidth * 0.75;
    
    rowRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  };
  
  const handleScroll = () => {
    if (!rowRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    
    // Show left arrow if scrolled right
    setShowLeftArrow(scrollLeft > 20);
    
    // Hide right arrow if at end
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="mb-8 row-animation">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="relative">
          <div className="flex space-x-4 overflow-x-hidden">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[180px] h-[270px] rounded-md skeleton-loading"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // If no movies
  if (!movies || movies.length === 0) {
    return (
      <div className="mb-8 row-animation">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="bg-gray-800 rounded-md p-4 text-gray-400">
          No movies available in this category.
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8 row-animation">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="relative carousel-container">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {/* Movie List */}
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          onScroll={handleScroll}
        >
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className="flex-shrink-0 w-[180px] relative group card-item"
            >
              <div className="relative w-[180px] h-[270px] rounded-md overflow-hidden">
                <Image 
                  src={movie.posterUrl || '/images/placeholder.jpg'} 
                  alt={movie.title}
                  layout="fill"
                  objectFit="cover"
                  className="hover-scale"
                />
                
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors"></div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-red-600 rounded-full mr-2">
                    <Play className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-gray-800 rounded-full">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-2">
                <h3 className="text-sm font-medium line-clamp-1">{movie.title}</h3>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <span>{movie.year}</span>
                  <span className="mx-1">•</span>
                  <span>{movie.duration || '1h 45m'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1 cursor-pointer hover:bg-black/80"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieRow;