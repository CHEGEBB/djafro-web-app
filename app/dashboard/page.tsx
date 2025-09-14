/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import LayoutController from '@/components/LayoutController';
import MovieBanner from '@/components/MovieBanner';
import MovieRow from '@/components/MovieRow';
import { useMovieService } from '@/services/movie_service';

export default function Dashboard() {
  const { movieService, isInitialized } = useMovieService();
  const [featuredMovie, setFeaturedMovie] = useState<any>(null);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [actionMovies, setActionMovies] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;
      
      setIsLoading(true);
      try {
        // Load featured movies for banner
        const featured = await movieService.getFeaturedMovies();
        if (featured.length > 0) {
          setFeaturedMovie(featured[0]);
        }
        
        // Load trending movies
        const trending = await movieService.getTrendingMovies();
        setTrendingMovies(trending);
        
        // Load new releases
        const newMovies = await movieService.getNewReleases();
        setNewReleases(newMovies);
        
        // Load action movies
        const action = await movieService.getMoviesByGenre('Action');
        setActionMovies(action);
        
        // Load continue watching
        const continueWatchingList = await movieService.getContinueWatchingMovies();
        setContinueWatching(continueWatchingList);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isInitialized, movieService]);
  
  return (
    <LayoutController>
      <div className="space-y-8">
        {/* Featured Banner */}
        <MovieBanner 
          movie={featuredMovie} 
          isLoading={isLoading} 
        />
        
        {/* Continue Watching Section */}
        {continueWatching.length > 0 && (
          <MovieRow 
            title="Continue Watching" 
            movies={continueWatching} 
            isLoading={isLoading} 
          />
        )}
        
        {/* Trending Movies Section */}
        <MovieRow 
          title="Trending Now" 
          movies={trendingMovies} 
          isLoading={isLoading} 
        />
        
        {/* New Releases Section */}
        <MovieRow 
          title="New Releases" 
          movies={newReleases} 
          isLoading={isLoading} 
        />
        
        {/* Action Movies Section */}
        <MovieRow 
          title="Action Movies" 
          movies={actionMovies} 
          isLoading={isLoading} 
        />
      </div>
    </LayoutController>
  );
}