// components/GenreSelector.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface GenreSelectorProps {
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ 
  genres, 
  selectedGenre, 
  onSelectGenre 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };
  
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      handleScroll();
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="relative my-4 group">
      {/* Left scroll button */}
      {showLeftArrow && (
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 rounded-full p-1.5 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
          aria-label="Scroll genres left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      {/* Genres list */}
      <div 
        ref={scrollRef}
        className="flex space-x-2 py-2 overflow-x-auto scrollbar-hide"
      >
        {genres.map((genre) => (
          <motion.button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${selectedGenre === genre
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/70 border border-gray-700/50'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {genre}
          </motion.button>
        ))}
      </div>
      
      {/* Right scroll button */}
      {showRightArrow && (
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 rounded-full p-1.5 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
          aria-label="Scroll genres right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default GenreSelector;