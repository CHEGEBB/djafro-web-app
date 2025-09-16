// app/movies/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LayoutController from '@/components/LayoutController';
import { useMovieService } from '@/services/movie_service';
import AnimatedMovieBanner from '@/components/MovieBanner';
import { ChevronDown, Filter, Search, X, Grid, List, Clock, Star, Heart, FilmIcon } from 'lucide-react';
import '@/styles/MoviesPage.scss';

// Movie card component
interface Movie {
  id: number;
  title: string;
  posterUrl?: string;
  progress?: number;
  isWishlisted?: boolean;
  rating?: number;
  year?: number;
  duration?: string;
  genres?: string[];
}

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onPlay, onToggleWishlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="movie-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="movie-card__poster-container">
        <Image 
          src={movie.posterUrl || '/images/placeholder.jpg'}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
          className="movie-card__poster"
        />
        
        {/* Progress bar if movie has progress */}
        {movie.progress !== undefined && movie.progress > 0 && (
          <div className="movie-card__progress-bar">
            <div 
              className="movie-card__progress-fill" 
              style={{ width: `${movie.progress * 100}%` }}
            ></div>
          </div>
        )}
        
        {/* Hover overlay with actions */}
        {isHovered && (
          <div className="movie-card__overlay">
            <div className="movie-card__actions">
              <button 
                className="movie-card__play-btn"
                onClick={() => onPlay(movie)}
              >
                Play
              </button>
              <button 
                className={`movie-card__wishlist-btn ${movie.isWishlisted ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(movie.id);
                }}
              >
                <Heart className={movie.isWishlisted ? 'filled' : ''} />
              </button>
            </div>
            <div className="movie-card__meta-hover">
              <div className="movie-card__rating">
                <Star size={14} />
                <span>{typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>
              </div>
              <span className="movie-card__year">{movie.year}</span>
              <span className="movie-card__duration">{movie.duration}</span>
            </div>
          </div>
        )}
        
        {/* Wishlist badge */}
        {movie.isWishlisted && !isHovered && (
          <div className="movie-card__wishlist-badge">
            <Heart className="filled" size={16} />
          </div>
        )}
      </div>
      
      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <div className="movie-card__meta">
          {movie.genres && movie.genres.length > 0 && (
            <span className="movie-card__genre">{movie.genres[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Movies list component
interface MoviesListProps {
  movies: Movie[];
  layout: string;
  onPlay: (movie: Movie) => void;
  onToggleWishlist: (movieId: number) => void;
}

const MoviesList: React.FC<MoviesListProps> = ({ movies, layout, onPlay, onToggleWishlist }) => {
  return (
    <div className={`movies-list movies-list--${layout}`}>
      {movies.map(movie => (
        <MovieCard 
          key={movie.id} 
          movie={movie} 
          onPlay={onPlay}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
};

// Filters component
const MoviesFilter: React.FC<{
  genres: string[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  sortOptions: { label: string; value: string; icon?: React.ElementType }[];
  selectedSort: string;
  onSortChange: (sortOption: string) => void;
  onSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  layout: string;
  setLayout: (layout: string) => void;
  isFilterOpen: boolean;
  toggleFilter: () => void;
}> = ({ 
  genres, 
  selectedGenre, 
  onGenreChange,
  sortOptions,
  selectedSort,
  onSortChange,
  onSearch,
  searchQuery,
  setSearchQuery,
  layout,
  setLayout,
  isFilterOpen,
  toggleFilter
}) => {
  return (
    <div className="movies-filter">
      <div className="movies-filter__main">
        <div className="movies-filter__search">
          <Search size={18} className="movies-filter__search-icon" />
          <input 
            type="text" 
            placeholder="Search movies..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          {searchQuery && (
            <button 
              className="movies-filter__search-clear" 
              onClick={() => {
                setSearchQuery('');
                onSearch();
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="movies-filter__controls">
          <button 
            className="movies-filter__layout-btn"
            onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
            title={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {layout === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>
          
          <button 
            className={`movies-filter__filter-btn ${isFilterOpen ? 'active' : ''}`}
            onClick={toggleFilter}
          >
            <Filter size={20} />
            <span className="movies-filter__filter-text">Filter</span>
          </button>
        </div>
      </div>
      
      {isFilterOpen && (
        <div className="movies-filter__panel">
          <div className="movies-filter__section">
            <h4 className="movies-filter__section-title">Genre</h4>
            <div className="movies-filter__genre-list">
              {genres.map(genre => (
                <button 
                  key={genre} 
                  className={`movies-filter__genre-btn ${selectedGenre === genre ? 'active' : ''}`}
                  onClick={() => onGenreChange(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          
          <div className="movies-filter__section">
            <h4 className="movies-filter__section-title">Sort By</h4>
            <div className="movies-filter__sort-list">
              {sortOptions.map(option => (
                <button 
                  key={option.value} 
                  className={`movies-filter__sort-btn ${selectedSort === option.value ? 'active' : ''}`}
                  onClick={() => onSortChange(option.value)}
                >
                  {option.icon && <option.icon size={16} />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Movies Page component
export default function MoviesPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popularity');
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  const genres = [
    'All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War'
  ];
  
  const sortOptions = [
    { label: 'Popularity', value: 'popularity', icon: Star },
    { label: 'Latest', value: 'latest', icon: Clock },
    { label: 'Title A-Z', value: 'title_asc' },
    { label: 'Title Z-A', value: 'title_desc' },
    { label: 'Rating High-Low', value: 'rating_desc' },
    { label: 'Rating Low-High', value: 'rating_asc' },
  ];
  
  // Toggle filter panel
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  // Load featured movies for banner
  useEffect(() => {
    async function loadFeaturedMovies() {
      if (!isInitialized) return;
      
      try {
        const featured = await service.getFeaturedMovies();
        setFeaturedMovies(featured);
      } catch (error) {
        console.error('Error loading featured movies:', error);
      }
    }
    
    loadFeaturedMovies();
  }, [isInitialized, service]);
  
  // Load movies based on filters
  const loadMovies = useCallback(async (resetPage = false) => {
    if (!isInitialized) return;
    
    const newPage = resetPage ? 1 : page;
    
    setIsLoading(true);
    try {
      let moviesData = [];
      
      // Handle search query
      if (searchQuery) {
        moviesData = await service.searchMovies(searchQuery);
        setHasMore(false); // No pagination for search results
      } 
      // Handle normal movie fetching with filters
      else {
        const options: {
          offset: number;
          limit: number;
          genre?: string;
          sortBy?: string;
          ascending?: boolean;
        } = {
          offset: (newPage - 1) * 24,
          limit: 24,
          genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        };
        
        // Add sorting options
        switch (selectedSort) {
          case 'latest':
            options.sortBy = '$createdAt';
            options.ascending = false;
            break;
          case 'title_asc':
            options.sortBy = 'title';
            options.ascending = true;
            break;
          case 'title_desc':
            options.sortBy = 'title';
            options.ascending = false;
            break;
          case 'rating_desc':
            options.sortBy = 'rating';
            options.ascending = false;
            break;
          case 'rating_asc':
            options.sortBy = 'rating';
            options.ascending = true;
            break;
          default: // popularity
            options.ascending = false;
        }
        
        moviesData = await service.getAllMovies(options);
        
        // Check if we have more movies to load
        setHasMore(moviesData.length === options.limit);
      }
      
      if (resetPage) {
        setMovies(moviesData);
        setPage(1);
      } else {
        setMovies(prev => [...prev, ...moviesData]);
        setPage(newPage + 1);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, service, page, selectedGenre, selectedSort, searchQuery]);
  
  // Initial load
  useEffect(() => {
    loadMovies(true);
  }, [isInitialized, selectedGenre, selectedSort]);
  
  // Setup infinite scrolling
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadMovies(false);
      }
    }, { threshold: 0.5 });
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMovies, isLoading, hasMore]);
  
  // Handle search
  const handleSearch = (query = searchQuery) => {
    setSearchQuery(query);
    loadMovies(true);
  };
  
  // Handle genre change
  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    // Will trigger the useEffect to reload movies
  };
  
  // Handle sort change
  const handleSortChange = (sortOption) => {
    setSelectedSort(sortOption);
    // Will trigger the useEffect to reload movies
  };
  
  // Handle play movie
  const handlePlayMovie = (movie) => {
    // Validate that the movie has video sources
    if (!movie.videoUrl && !movie.videoUrls?.original && !movie.videoUrls?.hls) {
      console.warn('No video source available for movie:', movie.title);
      // Could show a toast notification here
      return;
    }

    // Navigate to the play page with the movie ID
    router.push(`/play?id=${movie.id}`);
  };
  
  // Handle toggle wishlist
  const handleToggleWishlist = async (movieId) => {
    try {
      await service.toggleWishlist(movieId);
      
      // Update the movie list to reflect the change
      setMovies(currentMovies => 
        currentMovies.map(movie => 
          movie.id === movieId 
            ? { ...movie, isWishlisted: !movie.isWishlisted } 
            : movie
        )
      );
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };
  
  return (
    <LayoutController>
      <div className="movies-page">
        {/* Featured Banner */}
        <div className="movies-page__banner">
          <AnimatedMovieBanner 
            movies={featuredMovies}
            autoPlayInterval={8000}
            showControls={true}
            isLoading={isLoading && featuredMovies.length === 0}
          />
        </div>
        
        {/* Content area */}
        <div className="movies-page__content">
          <h1 className="movies-page__title">Movies</h1>
          
          {/* Filters */}
          <MoviesFilter 
            genres={genres}
            selectedGenre={selectedGenre}
            onGenreChange={handleGenreChange}
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSortChange={handleSortChange}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            layout={layout}
            setLayout={setLayout}
            isFilterOpen={isFilterOpen}
            toggleFilter={toggleFilter}
          />
          
          {/* Loading state */}
          {isLoading && movies.length === 0 && (
            <div className="movies-page__loading">
              <div className="movies-page__loading-spinner"></div>
              <p>Loading movies...</p>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && movies.length === 0 && (
            <div className="movies-page__empty">
              <div className="movies-page__empty-icon">
                <FilmIcon size={48} />
              </div>
              <h2>No movies found</h2>
              <p>
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.` 
                  : `No movies available in the ${selectedGenre} genre.`}
              </p>
              {searchQuery && (
                <button 
                  className="movies-page__empty-btn"
                  onClick={() => {
                    setSearchQuery('');
                    handleSearch('');
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
          
          {/* Movies list */}
          {movies.length > 0 && (
            <MoviesList 
              movies={movies}
              layout={layout}
              onPlay={handlePlayMovie}
              onToggleWishlist={handleToggleWishlist}
            />
          )}
          
          {/* Infinite scroll loading indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="movies-page__load-more">
              {isLoading ? (
                <div className="movies-page__loading-spinner"></div>
              ) : (
                <div className="movies-page__scroll-indicator">
                  <ChevronDown className="movies-page__scroll-icon" />
                  <span>Scroll for more</span>
                </div>
              )}
            </div>
          )}
          
          {/* End of content message */}
          {!hasMore && movies.length > 0 && (
            <div className="movies-page__end">
              <div className="movies-page__end-divider"></div>
              <span>You've reached the end</span>
              <div className="movies-page__end-divider"></div>
            </div>
          )}
        </div>
      </div>
    </LayoutController>
  );
}