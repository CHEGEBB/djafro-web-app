'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Star, Download, Menu, X, Film, Users, Clock, Award, Smartphone, Eye, CheckCircle, 
  ChevronRight, ChevronLeft, Volume2, VolumeX, Heart, Search, Bell, Plus, User } from 'lucide-react';

// Movie data with proper image paths
const featuredMovies = [
  {
    id: 1,
    title: "DjAfro-Logan",
    description: "In the near future, a weary Logan cares for an ailing Professor X while hiding from the world. But when a young mutant with extraordinary powers is pursued by dark forces, Logan must face his past and unleash the Wolverine one last time in a brutal fight for survival and redemption.",
    year: 2021,
    rating: 8.2,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/image1.jpg",
    backdropUrl: "/assets/images/image1.jpg",
    videoUrl: "https://kenya-access.b-cdn.net/Logan.2017.AF.%40Signor_Ent_Uploads.mp4"
  },
  {
    id: 2,
    title: "DjAfro(Extraction)",
    description: "A hardened mercenary's mission becomes a soul-searching race to survive when he's sent to rescue a kidnapped son.",
    year: 2020,
    rating: 7.6,
    genre: ["Action", "Thriller"],
    posterUrl: "/assets/images/image2.jpg",
    backdropUrl: "/assets/images/image2.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 3,
    title: "DjAfro(Joker)",
    description: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.",
    year: 2019,
    rating: 8.4,
    genre: ["Crime", "Drama"],
    posterUrl: "/assets/images/image3.jpg",
    backdropUrl: "/assets/images/image3.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 4,
    title: "DjAfro(Star Wars)",
    description: "The surviving Resistance faces the First Order once more as Rey, Finn and Poe's journey continues.",
    year: 2021,
    rating: 8.1,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/image4.jpg",
    backdropUrl: "/assets/images/image4.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 5,
    title: "DjAfro(Avatar)",
    description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following orders and protecting the world.",
    year: 2022,
    rating: 8.7,
    genre: ["Sci-Fi", "Adventure"],
    posterUrl: "/assets/images/image5.jpg",
    backdropUrl: "/assets/images/image5.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 6,
    title: "DjAfro(Dune)",
    description: "Feature adaptation of Frank Herbert's science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.",
    year: 2021,
    rating: 8.3,
    genre: ["Sci-Fi", "Adventure"],
    posterUrl: "/assets/images/image6.jpg",
    backdropUrl: "/assets/images/image6.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  }
];

const trendingMovies = [
  {
    id: 7,
    title: "DjAfro(Red Notice)",
    description: "An Interpol agent tracks the world's most wanted art thief.",
    year: 2021,
    rating: 7.5,
    genre: ["Action", "Comedy"],
    posterUrl: "/assets/images/image7.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 8,
    title: "DjAfro(No Time To Die)",
    description: "James Bond has left active service. His peace is short-lived when an old friend from the CIA asks for help.",
    year: 2021,
    rating: 7.8,
    genre: ["Action", "Thriller"],
    posterUrl: "/assets/images/image8.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 9,
    title: "DjAfro(Black Widow)",
    description: "Natasha Romanoff confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises.",
    year: 2021,
    rating: 7.2,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/image9.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 10,
    title: "DjAfro(Shang-Chi)",
    description: "Shang-Chi is drawn into the clandestine Ten Rings organization and must confront the past he thought he left behind.",
    year: 2021,
    rating: 7.9,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/image10.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 11,
    title: "DjAfro(Wonder Woman)",
    description: "Diana must contend with a colleague, and with the secrets of her past.",
    year: 2020,
    rating: 7.3,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/image11.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  {
    id: 12,
    title: "DjAfro(Fast & Furious)",
    description: "Dom and his crew must take on an international terrorist who turns out to be Dom and Mia's estranged brother.",
    year: 2021,
    rating: 7.1,
    genre: ["Action", "Crime"],
    posterUrl: "/assets/images/image12.jpg",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  }
];

const categories = [
  "Action", "Adventure", "Comedy", "Crime", "Drama", "Fantasy", "Horror", 
  "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"
];

const testimonials = [
  {
    name: "Movie Enthusiast",
    comment: "DJ Afro's narration brings movies to life like nothing else. The streaming quality is amazing!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Film Buff",
    comment: "This is hands down the best platform for watching DJ Afro movies. The mobile app is a game-changer.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b97c?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Casual Viewer",
    comment: "I've tried many streaming services, but this one offers the best value and entertainment experience.",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  }
];

export default function DjAfroMovies() {
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [visibleSection, setVisibleSection] = useState('hero');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [featuredScrollIndex, setFeaturedScrollIndex] = useState(0);
  const [trendingScrollIndex, setTrendingScrollIndex] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({
    hero: null,
    movies: null,
    features: null,
    app: null,
  });

  // Rotate hero content (stop when video is playing)
  useEffect(() => {
    if (isVideoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentMovieIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  // Auto-scroll featured movies
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedScrollIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll trending movies
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingScrollIndex((prev) => (prev + 1) % trendingMovies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      const scrollPosition = window.scrollY + 100;
      
      let currentSection = 'hero';
      Object.entries(sectionsRef.current).forEach(([section, element]) => {
        if (!element) return;
        
        const { offsetTop, offsetHeight } = element;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          currentSection = section;
        }
      });
      
      setVisibleSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when search is activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const currentMovie = featuredMovies[currentMovieIndex];

  const handleWatchMovie = () => {
    setShowSignupModal(true);
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  const assignSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchActive(false);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSignupModal(false);
    setIsVideoPlaying(true);
    
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setFeaturedScrollIndex((prev) => prev === 0 ? featuredMovies.length - 1 : prev - 1);
    } else {
      setFeaturedScrollIndex((prev) => (prev + 1) % featuredMovies.length);
    }
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setTrendingScrollIndex((prev) => prev === 0 ? trendingMovies.length - 1 : prev - 1);
    } else {
      setTrendingScrollIndex((prev) => (prev + 1) % trendingMovies.length);
    }
  };

  // Video Player Component
  const VideoPlayer = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <button 
          onClick={handleToggleMute}
          className="bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-all"
          aria-label={videoMuted ? "Unmute" : "Mute"}
        >
          {videoMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button 
          onClick={() => setIsVideoPlaying(false)}
          className="bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-all"
          aria-label="Close video"
        >
          <X size={24} />
        </button>
      </div>
      
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={currentMovie.videoUrl}
        autoPlay
        muted={videoMuted}
        controls
        onEnded={handleVideoEnd}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="text-xl font-bold">{currentMovie.title}</h3>
        <div className="flex items-center space-x-2 mt-1">
          <div className="flex items-center space-x-1">
            <Star size={16} className="text-yellow-500" fill="currentColor" />
            <span>{currentMovie.rating}</span>
          </div>
          <span>•</span>
          <span>{currentMovie.year}</span>
          <span>•</span>
          <span>{currentMovie.genre.join(', ')}</span>
        </div>
      </div>
    </div>
  );

  // Signup Modal Component
  const SignupModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl p-8 max-w-md w-full relative animate-scale-in">
        <button
          onClick={() => setShowSignupModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Film className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Sign Up to Watch</h3>
          <p className="text-gray-300">Create your account to enjoy unlimited DJ Afro movies</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
          >
            Sign Up & Watch Now
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Already have an account?</p>
          <button className="text-red-400 hover:text-red-300 font-semibold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  // Search Overlay Component
  const SearchOverlay = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Search</h2>
          <button
            onClick={() => setIsSearchActive(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for movies, genres, etc."
              className="w-full bg-gray-800 border-none rounded-full py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </form>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
          <div className="flex flex-wrap gap-2">
            {["Action", "Comedy", "DJ Afro Classics", "New Releases", "Thriller"].map((term) => (
              <button
                key={term}
                className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Video Player */}
      {isVideoPlaying && <VideoPlayer />}

      {/* Signup Modal */}
      {showSignupModal && <SignupModal />}
      
      {/* Search Overlay */}
      {isSearchActive && <SearchOverlay />}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                  <Film className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold text-white">
                  DJ Afro Movies
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <a 
                  href="#home" 
                  className={`hover:text-red-500 transition-colors text-sm ${visibleSection === 'hero' ? 'text-white font-medium' : 'text-gray-300'}`}
                >
                  Home
                </a>
                <a 
                  href="#movies" 
                  className={`hover:text-red-500 transition-colors text-sm ${visibleSection === 'movies' ? 'text-white font-medium' : 'text-gray-300'}`}
                >
                  Movies
                </a>
                <div className="relative">
                  <button
                    className="hover:text-red-500 transition-colors text-sm text-gray-300 flex items-center space-x-1"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  >
                    <span>Genres</span>
                    <ChevronRight size={16} className={`transform transition-transform duration-200 ${showGenreDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showGenreDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 w-48 z-50">
                      <div className="grid grid-cols-2 gap-1">
                        {categories.slice(0, 12).map((category) => (
                          <a 
                            key={category}
                            href={`#${category.toLowerCase()}`}
                            className="px-3 py-2 hover:bg-gray-800 rounded text-sm whitespace-nowrap transition-colors"
                            onClick={() => setShowGenreDropdown(false)}
                          >
                            {category}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <a 
                  href="#features" 
                  className={`hover:text-red-500 transition-colors text-sm ${visibleSection === 'features' ? 'text-white font-medium' : 'text-gray-300'}`}
                >
                  Features
                </a>
                <a 
                  href="#app" 
                  className={`hover:text-red-500 transition-colors text-sm ${visibleSection === 'app' ? 'text-white font-medium' : 'text-gray-300'}`}
                >
                  Mobile App
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-300 hover:text-white p-1 transition-colors"
                onClick={() => setIsSearchActive(true)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              
              <button className="text-gray-300 hover:text-white p-1 transition-colors hidden md:block" aria-label="Notifications">
                <Bell size={20} />
              </button>
              
              <div className="hidden md:flex items-center space-x-2">
                <button className="bg-transparent border border-gray-700 hover:border-white px-4 py-1 rounded text-sm transition-colors">
                  Sign In
                </button>
                <button 
                  onClick={() => setShowSignupModal(true)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm transition-colors"
                >
                  Sign Up
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black">
            <div className="container mx-auto px-6 py-4 space-y-3">
              <a 
                href="#home" 
                className={`block py-2 ${visibleSection === 'hero' ? 'text-red-500' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a 
                href="#movies" 
                className={`block py-2 ${visibleSection === 'movies' ? 'text-red-500' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Movies
              </a>
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <button className="block w-full text-left py-2">Sign In</button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowSignupModal(true);
                  }}
                  className="block w-full bg-red-600 text-center py-2 rounded font-semibold"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-end pb-20 overflow-hidden"
        ref={assignSectionRef('hero')}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <img 
              src={currentMovie.backdropUrl}
              alt={currentMovie.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-32">
          <div className="max-w-2xl">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                {currentMovie.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Star className="text-yellow-500 mr-1" size={16} fill="currentColor" />
                  <span>{currentMovie.rating}/10</span>
                </div>
                <span>{currentMovie.year}</span>
                <div className="hidden md:flex items-center space-x-2">
                  {currentMovie.genre.map((g, idx) => (
                    <span 
                      key={idx} 
                      className="border border-gray-400 px-2 py-1 rounded text-xs"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-lg text-gray-300 max-w-xl leading-relaxed line-clamp-3 md:line-clamp-none">
                {currentMovie.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <button 
                onClick={handleWatchMovie}
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 flex items-center space-x-3"
              >
                <Play fill="white" size={24} />
                <span>Play Now</span>
              </button>
              
              <button className="bg-gray-800/80 hover:bg-gray-700 px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 flex items-center space-x-3">
                <Plus size={24} />
                <span>My List</span>
              </button>
            </div>
            
            <div className="mt-6 text-sm text-gray-400">
              <p>
                <span className="text-red-500 font-medium">Sign up now</span> to watch unlimited premium DJ Afro movies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section 
        id="movies" 
        className="py-16 bg-[#141414]"
        ref={assignSectionRef('movies')}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center">
              <span>Featured Movies</span>
              <ChevronRight size={24} className="text-red-500 ml-2" />
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => scrollFeatured('left')}
                className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                aria-label="Previous featured movies"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollFeatured('right')}
                className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                aria-label="Next featured movies"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${featuredScrollIndex * 33.333}%)` }}
            >
              {featuredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-none w-1/3 px-2"
                >
                  <div className="relative rounded-md overflow-hidden group">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <button 
                            onClick={handleWatchMovie}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-transform transform group-hover:scale-110"
                          >
                            <Play fill="white" size={20} />
                          </button>
                          <div className="flex space-x-2">
                            <button className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors">
                              <Plus size={18} />
                            </button>
                            <button className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors">
                              <Heart size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-green-500 font-medium">New</span>
                          <span className="text-gray-400">{movie.year}</span>
                        </div>
                        
                        <h3 className="font-medium line-clamp-1">{movie.title}</h3>
                        
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                          <div className="flex items-center">
                            <Star className="text-yellow-500 mr-1" size={12} fill="currentColor" />
                            <span>{movie.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{movie.genre.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Movies */}
          <div className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center">
                <span>Trending Now</span>
                <ChevronRight size={24} className="text-red-500 ml-2" />
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => scrollTrending('left')}
                  className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                  aria-label="Previous trending movies"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scrollTrending('right')}
                  className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                  aria-label="Next trending movies"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${trendingScrollIndex * 33.333}%)` }}
              >
                {trendingMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex-none w-1/3 px-2"
                  >
                    <div className="relative rounded-md overflow-hidden group">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <div className="flex justify-between items-center mb-2">
                            <button 
                              onClick={handleWatchMovie}
                              className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-transform transform group-hover:scale-110"
                            >
                              <Play fill="white" size={20} />
                            </button>
                            <div className="flex space-x-2">
                              <button className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors">
                                <Plus size={18} />
                              </button>
                              <button className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors">
                                <Heart size={18} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-red-500 font-medium">Trending</span>
                            <span className="text-gray-400">{movie.year}</span>
                          </div>
                          
                          <h3 className="font-medium line-clamp-1">{movie.title}</h3>
                          
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                            <div className="flex items-center">
                              <Star className="text-yellow-500 mr-1" size={12} fill="currentColor" />
                              <span>{movie.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{movie.genre.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-[#0C0C0C]">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            <span>Browse by Category</span>
            <ChevronRight size={24} className="text-red-500 ml-2" />
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"].map((category, index) => (
              <div 
                key={category}
                className="relative h-32 rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={`assets/images/image${index + 1}.jpg`}
                  // src={`https://images.unsplash.com/photo-${1500000000000 + index}?w=300&h=200&fit=crop&crop=center`}
                  alt={category}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold z-10">{category}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button className="border border-gray-700 hover:border-white px-8 py-3 rounded-md transition-colors text-sm">
              View All Categories
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="py-20 bg-[#141414]"
        ref={assignSectionRef('features')}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Why Choose <span className="text-red-600">DJ Afro Movies?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover what makes our platform the ultimate destination for premium movie entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Film className="text-red-500" size={48} />,
                title: "Premium Quality",
                description: "All movies in HD quality with crystal clear audio and DJ Afro's signature narration style."
              },
              {
                icon: <Users className="text-red-500" size={48} />,
                title: "50K+ Happy Users",
                description: "Join our growing community of movie enthusiasts who trust DJ Afro for quality entertainment."
              },
              {
                icon: <Clock className="text-red-500" size={48} />,
                title: "24/7 Streaming",
                description: "Watch your favorite movies anytime, anywhere. Our platform is available round the clock."
              },
              {
                icon: <Award className="text-red-500" size={48} />,
                title: "Curated Collection",
                description: "Handpicked movies across all genres, ensuring quality content for every taste."
              },
              {
                icon: <Eye className="text-red-500" size={48} />,
                title: "No Ads for Members",
                description: "Enjoy uninterrupted viewing experience with premium membership. No annoying ads."
              },
              {
                icon: <CheckCircle className="text-red-500" size={48} />,
                title: "Easy Sign Up",
                description: "Quick registration process to get you watching your favorite movies in seconds."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-900/50 border border-gray-800 hover:border-red-500/50 rounded-xl p-8 transition-all duration-300 hover:bg-gray-900 hover:shadow-lg hover:shadow-red-500/10"
              >
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-[#0C0C0C]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Experience the <span className="text-red-600">Magic</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch a preview of what makes DJ Afro movies special - premium quality, engaging narration, and unforgettable entertainment.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-red-500/30 transition-all duration-500">
              <div className="relative aspect-video">
                <img
                  src={currentMovie.backdropUrl}
                  alt="Video Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={handleWatchMovie}
                    className="bg-red-600 hover:bg-red-700 p-8 rounded-full transition-transform duration-300 hover:scale-110 group-hover:shadow-2xl group-hover:shadow-red-500/30"
                    aria-label="Play demo video"
                  >
                    <Play size={48} fill="white" />
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-2xl font-bold mb-2">{currentMovie.title}</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Star className="text-yellow-500" size={20} fill="currentColor" />
                    <span className="ml-1">{currentMovie.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{currentMovie.year}</span>
                  <span>•</span>
                  <span>{currentMovie.genre.join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center text-gray-400">
              <p><span className="text-red-500 font-semibold">Sign up</span> to unlock unlimited access to premium DJ Afro movies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[#141414]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              What Our <span className="text-red-600">Users Say</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied users enjoying the DJ Afro experience
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${currentTestimonialIndex * 100}%)`
                  }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div 
                      key={index}
                      className="w-full flex-shrink-0 px-4"
                    >
                      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-red-500/30">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                            <img 
                              src={testimonial.avatar} 
                              alt="User avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{testimonial.name}</h4>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  size={16}
                                  className={i < testimonial.rating ? "text-yellow-500" : "text-gray-600"}
                                  fill={i < testimonial.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 italic">"{testimonial.comment}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonialIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonialIndex ? 'bg-red-500 scale-125' : 'bg-gray-600'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section 
        id="app" 
        className="py-20 bg-[#0C0C0C]"
        ref={assignSectionRef('app')}
      >
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold">
                Take DJ Afro Movies <span className="text-red-600">Anywhere</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Download our mobile app for the ultimate viewing experience. Watch your favorite DJ Afro movies on the go, anytime, anywhere.
              </p>
              
              <div className="space-y-4">
                {[
                  "Offline downloads for on-the-go viewing",
                  "Synchronized watch progress across devices",
                  "Push notifications for new releases",
                  "Optimized for all screen sizes"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="text-red-500 flex-shrink-0" size={20} />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3">
                  <Smartphone size={24} />
                  <span>Download App</span>
                </button>
                <button className="border-2 border-gray-700 hover:border-red-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3">
                  <Download size={24} />
                  <span>Learn More</span>
                </button>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-72">
                {/* Phone Mockup */}
                <div className="relative bg-black border-4 border-gray-800 rounded-[2.5rem] p-2 shadow-2xl">
                  <div className="rounded-[2rem] overflow-hidden bg-black">
                    <img
                      src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=600&fit=crop"
                      alt="DJ Afro Movies Mobile App"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-gray-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                            <Film className="text-white" size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">DJ Afro</h4>
                            <p className="text-xs text-gray-400">Now Playing</p>
                          </div>
                          <button className="ml-auto bg-red-600 rounded-full p-2">
                            <Play size={16} fill="white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#141414] to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(229,9,20,0.2),transparent_70%)]"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to Experience <span className="text-red-600">DJ Afro Movies</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied users and unlock a world of premium entertainment with DJ Afro's unique narrative style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleWatchMovie}
                className="bg-red-600 hover:bg-red-700 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <Play size={24} />
                <span>Start Watching Now</span>
              </button>
              
              <button className="bg-gray-800 hover:bg-gray-700 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3">
                <Download size={24} />
                <span>Get the App</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Film className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold text-white">
                  DJ Afro Movies
                </span>
              </div>
              
              <p className="text-gray-400 mb-6">
                The ultimate destination for premium DJ Afro movie experiences. High-quality streaming with unique narration.
              </p>
              
              <div className="flex space-x-4">
                {['T', 'F', 'I', 'Y'].map((social, index) => (
                  <a key={index} href="#" className="text-gray-500 hover:text-red-500 transition-colors">
                    <div className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center hover:border-red-500">
                      <span className="text-xs">{social}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                {['Home', 'Movies', 'TV Shows', 'New & Popular', 'My List', 'Browse by Languages'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Categories</h3>
              <ul className="space-y-4">
                {categories.slice(0, 6).map((category) => (
                  <li key={category}>
                    <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Support</h3>
              <ul className="space-y-4">
                {['Help Center', 'FAQ', 'Contact Us', 'Terms of Service', 'Privacy Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} DJ Afro Movies. All rights reserved.
            </p>
            
            <div className="flex space-x-6">
              {['Terms', 'Privacy', 'Cookies'].map((item) => (
                <a key={item} href="#" className="text-gray-500 hover:text-red-500 text-sm transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}