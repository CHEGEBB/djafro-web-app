/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import LayoutController from '@/components/LayoutController';
import MovieRow from '@/components/MovieRow';
import { useMovieService } from '@/services/movie_service';
import AnimatedMovieBanner from '@/components/MovieBanner';
import { ChevronDown } from 'lucide-react';
import '@/styles/Dashboard.scss';
import GenreSelector from '@/components/GenreSelector';

export default function Dashboard() {
  const { service, isInitialized } = useMovieService();
  const [featuredMovies, setFeaturedMovies] = useState<any[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [actionMovies, setActionMovies] = useState<any[]>([]);
  const [comedyMovies, setComedyMovies] = useState<any[]>([]);
  const [dramaMovies, setDramaMovies] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [wishlistedMovies, setWishlistedMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      try {
        // Load featured movies for banner
        const featured = await service.getFeaturedMovies();
        setFeaturedMovies(featured);
        
        // Load trending movies
        const trending = await service.getTrendingMovies();
        setTrendingMovies(trending);
        
        // Load new releases
        const newMovies = await service.getNewReleases();
        setNewReleases(newMovies);
        
        // Load continue watching (if user is logged in)
        const continueWatchingList = await service.getContinueWatchingMovies();
        setContinueWatching(continueWatchingList);
        
        // Load wishlisted movies (if user is logged in)
        const wishlisted = await service.getWishlistedMovies();
        setWishlistedMovies(wishlisted);
        
        // Load genre-based movies
        const action = await service.getMoviesByGenre('Action');
        setActionMovies(action);
        
        const comedy = await service.getMoviesByGenre('Comedy');
        setComedyMovies(comedy);
        
        const drama = await service.getMoviesByGenre('Drama');
        setDramaMovies(drama);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isInitialized, service]);
  
  const genres = [
    'All', 'Action', 'Comedy', 'Drama', 'Horror', 
    'Thriller', 'Sci-Fi', 'Romance', 'Documentary'
  ];

  // Handle add to wishlist
  const handleAddToWishlist = async (movieId: string) => {
    try {
      await service.toggleWishlist(movieId);
      
      // Refresh wishlisted movies
      const updatedWishlisted = await service.getWishlistedMovies();
      setWishlistedMovies(updatedWishlisted);
      
      // Update wishlisted status in other movie lists
      const updateMoviesList = (movies: any[]) => {
        return movies.map(movie => {
          if (movie.id === movieId) {
            return { ...movie, isWishlisted: !movie.isWishlisted };
          }
          return movie;
        });
      };
      
      setTrendingMovies(updateMoviesList(trendingMovies));
      setNewReleases(updateMoviesList(newReleases));
      setActionMovies(updateMoviesList(actionMovies));
      setComedyMovies(updateMoviesList(comedyMovies));
      setDramaMovies(updateMoviesList(dramaMovies));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  return (
    <LayoutController>
      <div className="dashboard-container">
        {/* Featured Banner */}
        <div className="banner-section">
          <AnimatedMovieBanner 
            movies={featuredMovies}
            autoPlayInterval={8000}
            showControls={true}
            isLoading={isLoading && featuredMovies.length === 0}
          />
        </div>
        
        {/* Genre Selector */}
        <div className="px-4 md:px-6">
          <GenreSelector
            genres={genres} 
            selectedGenre={selectedGenre} 
            onSelectGenre={handleGenreChange} 
          />
        </div>
        
        {/* Movie Categories */}
        <div className="movie-categories">
          {/* Continue Watching Section (if available) */}
          {continueWatching.length > 0 && (
            <MovieRow 
              title="Continue Watching" 
              movies={continueWatching} 
              isLoading={isLoading && continueWatching.length === 0}
              onAddToWishlist={handleAddToWishlist}
              showProgress={true}
              rowId="continue-watching"
            />
          )}
          
          {/* Wishlisted Movies Section (if available) */}
          {wishlistedMovies.length > 0 && (
            <MovieRow 
              title="My List" 
              movies={wishlistedMovies} 
              isLoading={isLoading && wishlistedMovies.length === 0}
              onAddToWishlist={handleAddToWishlist}
              showWishlistBadge={true}
              rowId="my-list"
            />
          )}
          
          {/* Trending Movies Section */}
          <MovieRow 
            title="Trending Now" 
            movies={trendingMovies} 
            isLoading={isLoading && trendingMovies.length === 0}
            onAddToWishlist={handleAddToWishlist}
            rowId="trending"
            enableAutoScroll={true}
          />
          
          {/* New Releases Section */}
          <MovieRow 
            title="New Releases" 
            movies={newReleases} 
            isLoading={isLoading && newReleases.length === 0}
            onAddToWishlist={handleAddToWishlist}
            rowId="new-releases"
            enableAutoScroll={true}
          />
          
          {/* Action Movies Section */}
          <MovieRow 
            title="Action Movies" 
            movies={actionMovies} 
            isLoading={isLoading && actionMovies.length === 0}
            onAddToWishlist={handleAddToWishlist}
            rowId="action"
            enableAutoScroll={true}
          />
          
          {/* Comedy Movies Section */}
          <MovieRow 
            title="Comedy Movies" 
            movies={comedyMovies} 
            isLoading={isLoading && comedyMovies.length === 0}
            onAddToWishlist={handleAddToWishlist}
            rowId="comedy"
            enableAutoScroll={true}
          />
          
          {/* Drama Movies Section */}
          <MovieRow 
            title="Drama Movies" 
            movies={dramaMovies} 
            isLoading={isLoading && dramaMovies.length === 0}
            onAddToWishlist={handleAddToWishlist}
            rowId="drama"
            enableAutoScroll={true}
          />
        </div>
      </div>
    </LayoutController>
  );
}