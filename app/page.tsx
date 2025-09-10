'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Star, Download, Menu, X, Film, Users, Clock, Award, Smartphone, Eye, CheckCircle, ChevronRight, ChevronLeft, Volume2, Volume1, VolumeX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import '@/styles/animations.scss';

// Mock movie data - replace with actual API calls
const featuredMovies = [
  {
    id: 1,
    title: "DjAfro(Chase Full HD)",
    description: "A washed-up private security agent, Danny Stratton, gets a shot at redemption when he's hired to escort a valuable Chinese antique out of Tibet.",
    year: 2017,
    rating: 7.4,
    genre: ["Action", "Thriller"],
    posterUrl: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=600&h=900",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    id: 2,
    title: "DjAfro-Horror Movie",
    description: "A spine-chilling horror experience that will keep you on the edge of your seat. Narrated by DJ Afro with his signature style.",
    year: 2020,
    rating: 8.2,
    genre: ["Horror", "Thriller"],
    posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=900",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    id: 3,
    title: "DjAfro-(Silent Scream)",
    description: "A psychological thriller that explores the depths of human consciousness with DJ Afro's masterful narration.",
    year: 2019,
    rating: 7.8,
    genre: ["Thriller", "Mystery"],
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&h=900",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    id: 4,
    title: "DjAfro(Bang Bang)",
    description: "High-octane action packed with intense sequences and DJ Afro's electrifying commentary.",
    year: 2021,
    rating: 8.5,
    genre: ["Action", "Adventure"],
    posterUrl: "https://images.unsplash.com/photo-1489599112443-0182c70eb8f6?w=600&h=900",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    id: 5,
    title: "DjAfro-Comedy Gold",
    description: "Laugh until you cry with this comedy masterpiece featuring DJ Afro's hilarious narration.",
    year: 2022,
    rating: 7.9,
    genre: ["Comedy", "Entertainment"],
    posterUrl: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=600&h=900",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  }
];

const heroWords = [
  "Ultimate Cinema Experience",
  "High Quality DJ Afro Movies",
  "Cinematic Masterpieces",
  "Premium Movie Collection",
  "Unforgettable Entertainment"
];

const testimonials = [
  {
    name: "Movie Lover",
    comment: "DJ Afro's narration takes movies to a whole new level. I can't watch movies any other way now!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=1"
  },
  {
    name: "Cinema Fan",
    comment: "The video quality is fantastic and the mobile app works flawlessly. Best streaming service for DJ Afro content.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=2"
  },
  {
    name: "Regular User",
    comment: "I've tried many platforms but this is by far the best for DJ Afro movies. Great selection and user experience.",
    rating: 4,
    avatar: "https://i.pravatar.cc/150?img=3"
  }
];

export default function DjAfroLandingPage() {
  const { colors } = useTheme();
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [watchedMovies, setWatchedMovies] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [visibleSection, setVisibleSection] = useState('hero');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({
    hero: null,
    movies: null,
    features: null,
    app: null,
  });

  // Rotate hero content
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMovieIndex((prev) => (prev + 1) % featuredMovies.length);
      setCurrentWordIndex((prev) => (prev + 1) % heroWords.length);
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
      
      // Find which section is currently visible
      const scrollPosition = window.scrollY + 100; // offset
      
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

  const currentMovie = featuredMovies[currentMovieIndex];

  const handleWatchMovie = () => {
    if (watchedMovies >= 2) {
      setShowSignupModal(true);
    } else {
      setWatchedMovies(prev => prev + 1);
      setIsVideoPlaying(true);
      
      // Control video playback
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    if (watchedMovies >= 2) {
      setShowSignupModal(true);
    }
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

  const SignupModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={() => setShowSignupModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Film className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Sign Up Today!</h3>
          <p className="text-gray-300">Enjoy unlimited high-quality DJ Afro movies</p>
        </div>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Create password"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none transition-colors"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
          >
            Start Watching Now
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Already have an account?</p>
          <button className="text-green-400 hover:text-green-300 font-semibold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Video Player Overlay */}
      {isVideoPlaying && (
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
      )}

      {/* Signup Modal */}
      {showSignupModal && <SignupModal />}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Film className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                DJ Afro Movies
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#home" 
                className={`hover:text-green-400 transition-colors ${visibleSection === 'hero' ? 'text-green-400' : 'text-white'}`}
              >
                Home
              </a>
              <a 
                href="#movies" 
                className={`hover:text-green-400 transition-colors ${visibleSection === 'movies' ? 'text-green-400' : 'text-white'}`}
              >
                Movies
              </a>
              <a 
                href="#features" 
                className={`hover:text-green-400 transition-colors ${visibleSection === 'features' ? 'text-green-400' : 'text-white'}`}
              >
                Features
              </a>
              <a 
                href="#app" 
                className={`hover:text-green-400 transition-colors ${visibleSection === 'app' ? 'text-green-400' : 'text-white'}`}
              >
                Mobile App
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors">
                Login
              </button>
              <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-2 rounded-lg font-semibold transition-all duration-300">
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 animate-fade-in-up">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <a 
                href="#home" 
                className={`block hover:text-green-400 transition-colors ${visibleSection === 'hero' ? 'text-green-400' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a 
                href="#movies" 
                className={`block hover:text-green-400 transition-colors ${visibleSection === 'movies' ? 'text-green-400' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Movies
              </a>
              <a 
                href="#features" 
                className={`block hover:text-green-400 transition-colors ${visibleSection === 'features' ? 'text-green-400' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#app" 
                className={`block hover:text-green-400 transition-colors ${visibleSection === 'app' ? 'text-green-400' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Mobile App
              </a>
              <div className="pt-4 border-t border-gray-700 space-y-2">
                <button className="block w-full text-left hover:text-green-400 transition-colors">Login</button>
                <button className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-center py-2 rounded-lg font-semibold">
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
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
        ref={assignSectionRef('hero')}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 animate-hero-image">
          <div className="relative w-full h-full">
            <img
              src={currentMovie.posterUrl}
              alt="Movie background"
              className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-hero-slide">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-white">Welcome to</span>
                <span className="block bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-glow">
                  DJ Afro Movies
                </span>
              </h1>
              
              <div className="text-2xl lg:text-3xl font-semibold text-gray-300 h-16 flex items-center">
                <span className="animate-typewriter overflow-hidden border-r-2 border-green-400 whitespace-nowrap">
                  {heroWords[currentWordIndex]}
                </span>
              </div>
              
              <p className="text-xl text-gray-300 max-w-xl leading-relaxed">
                Experience cinema like never before with DJ Afro's unique narration and high-quality movie collection. 
                Start your journey with <span className="text-green-400 font-semibold">2 free movies</span> today!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleWatchMovie}
                className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 hover:scale-105 flex items-center justify-center space-x-3 hover-button-press"
              >
                <Play className="group-hover:scale-110 transition-transform" size={24} />
                <span>Watch Free Movies ({2 - watchedMovies} left)</span>
              </button>
              
              <button className="border-2 border-green-500 hover:bg-green-500/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover-button-press">
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">500+</div>
                <div className="text-gray-400">Movies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">50K+</div>
                <div className="text-gray-400">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">4.9★</div>
                <div className="text-gray-400">Rating</div>
              </div>
            </div>
          </div>

          {/* Featured Movie Card */}
          <div className="hidden lg:block animate-fade-in-right">
            <div className="relative group hover-card">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500">
                <div className="relative overflow-hidden rounded-xl mb-4">
                  <img
                    src={currentMovie.posterUrl}
                    alt={currentMovie.title}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-lg font-semibold flex items-center space-x-1">
                    <Star size={16} fill="currentColor" />
                    <span>{currentMovie.rating}</span>
                  </div>
                  <button
                    onClick={handleWatchMovie}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="play-button bg-green-500 hover:bg-green-600 p-4 rounded-full transition-transform">
                      <Play size={32} fill="white" />
                    </div>
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{currentMovie.title}</h3>
                <p className="text-gray-300 mb-4 line-clamp-3">{currentMovie.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {currentMovie.genre.map((g, i) => (
                      <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                        {g}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-400">{currentMovie.year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section 
        id="movies" 
        className="py-20 bg-gradient-to-b from-black to-gray-900"
        ref={assignSectionRef('movies')}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Featured Movies
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover our handpicked collection of DJ Afro movies, each offering a unique cinematic experience with premium quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 stagger-children">
            {featuredMovies.map((movie, index) => (
              <div
                key={movie.id}
                className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 hover-card"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-lg font-semibold text-sm flex items-center space-x-1">
                    <Star size={14} fill="currentColor" />
                    <span>{movie.rating}</span>
                  </div>
                  <button 
                    onClick={handleWatchMovie}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label={`Play ${movie.title}`}
                  >
                    <div className="play-button bg-green-500 hover:bg-green-600 p-4 rounded-full hover:scale-110 transition-transform">
                      <Play size={32} fill="white" />
                    </div>
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{movie.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{movie.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{movie.year}</span>
                    <div className="flex flex-wrap gap-1">
                      {movie.genre.slice(0, 2).map((g, i) => (
                        <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="bg-transparent border-2 border-green-500 hover:bg-green-500/10 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 flex items-center space-x-2 mx-auto">
              <span>View All Movies</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Experience the <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Magic</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch a preview of what makes DJ Afro movies special - premium quality, engaging narration, and unforgettable entertainment.
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="relative bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover-play-pulse">
              <div className="relative aspect-video">
                <img
                  src={currentMovie.posterUrl}
                  alt="Video Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={handleWatchMovie}
                    className="play-button group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-8 rounded-full hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/50"
                    aria-label="Play demo video"
                  >
                    <Play size={48} fill="white" className="ml-2" />
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
              <p>Watch 2 free movies without signing up. <span className="text-green-400 font-semibold">Sign up</span> for unlimited access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="py-20 bg-gradient-to-b from-black to-gray-900"
        ref={assignSectionRef('features')}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">DJ Afro Movies?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover what makes our platform the ultimate destination for premium movie entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
            {[
              {
                icon: <Film className="text-green-400" size={48} />,
                title: "Premium Quality",
                description: "All movies in HD quality with crystal clear audio and DJ Afro's signature narration style."
              },
              {
                icon: <Users className="text-green-400" size={48} />,
                title: "50K+ Happy Users",
                description: "Join our growing community of movie enthusiasts who trust DJ Afro for quality entertainment."
              },
              {
                icon: <Clock className="text-green-400" size={48} />,
                title: "24/7 Streaming",
                description: "Watch your favorite movies anytime, anywhere. Our platform is available round the clock."
              },
              {
                icon: <Award className="text-green-400" size={48} />,
                title: "Curated Collection",
                description: "Handpicked movies across all genres, ensuring quality content for every taste."
              },
              {
                icon: <Eye className="text-green-400" size={48} />,
                title: "No Ads for Members",
                description: "Enjoy uninterrupted viewing experience with premium membership. No annoying ads."
              },
              {
                icon: <CheckCircle className="text-green-400" size={48} />,
                title: "Free to Start",
                description: "Watch 2 movies completely free, then join our community for unlimited access."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-green-500/50 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 hover-card"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              What Our <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Users Say</span>
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
                      <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-2xl p-8 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500">
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
                      index === currentTestimonialIndex ? 'bg-green-500 scale-125' : 'bg-gray-600'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-full hover:scale-110 transition-transform hidden md:block"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={() => setCurrentTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-full hover:scale-110 transition-transform hidden md:block"
                aria-label="Next testimonial"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section 
        id="app" 
        className="py-20 bg-gradient-to-b from-gray-900 to-black"
        ref={assignSectionRef('app')}
      >
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-left">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Take DJ Afro Movies <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Anywhere</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Download our mobile app for the ultimate viewing experience. Currently in closed testing - be the first to experience the future of mobile entertainment.
              </p>
              
              <div className="space-y-4">
                {[
                  "Offline downloads for on-the-go viewing",
                  "Synchronized watch progress across devices",
                  "Push notifications for new releases",
                  "Optimized for all screen sizes"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 flex items-center justify-center space-x-3 hover-button-press">
                  <Smartphone size={24} />
                  <span>Join Closed Beta</span>
                </button>
                <button className="border-2 border-gray-700 hover:border-green-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 hover-button-press">
                  <Download size={24} />
                  <span>Coming Soon</span>
                </button>
              </div>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="relative mx-auto max-w-sm">
                {/* Phone Mockup */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black border-4 border-gray-700 rounded-[2.5rem] p-4">
                  <div className="bg-black rounded-[2rem] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=600"
                      alt="DJ Afro Movies Mobile App"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-gray-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                            <Film className="text-white" size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">DJ Afro</h4>
                            <p className="text-xs text-gray-400">Now Playing</p>
                          </div>
                          <button className="ml-auto bg-green-500 rounded-full p-2">
                            <Play size={16} fill="white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-8 -right-8 bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-full animate-parallax-float">
                  <Play size={24} fill="white" />
                </div>
                <div className="absolute -bottom-8 -left-8 bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full animate-pulse">
                  <Star size={24} fill="white" />
                </div>
                
                {/* QR Code */}
                <div className="absolute -right-24 -bottom-16 bg-white p-2 rounded-lg shadow-xl rotate-6 hidden lg:block">
                  <div className="w-20 h-20 bg-black">
                    {/* Replace with actual QR code */}
                    <div className="grid grid-cols-4 grid-rows-4 gap-1 p-2">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'} w-full h-full`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center text-black text-xs mt-1 font-semibold">Scan to Download</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Trusted by <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-xl text-gray-300">Join our growing community of movie lovers worldwide</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up">
            {[
              { value: "500+", label: "Movies", icon: <Film size={32} className="text-green-400" /> },
              { value: "50K+", label: "Happy Users", icon: <Users size={32} className="text-green-400" /> },
              { value: "24/7", label: "Support", icon: <Clock size={32} className="text-green-400" /> },
              { value: "100%", label: "Satisfaction", icon: <Award size={32} className="text-green-400" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black hover:border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-glow">
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(28,231,131,0.2),transparent_70%)]"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to Experience <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">DJ Afro Movies</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied users and unlock a world of premium entertainment with DJ Afro's unique narrative style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 hover:scale-105 flex items-center justify-center space-x-3 hover-button-press">
                <Play className="group-hover:scale-110 transition-transform" size={24} />
                <span>Start Watching Now</span>
              </button>
              
              <button className="border-2 border-green-500 hover:bg-green-500/10 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 flex items-center justify-center space-x-3 hover-button-press">
                <Download size={24} />
                <span>Get the App</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <Film className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  DJ Afro Movies
                </span>
              </div>
              
              <p className="text-gray-400 mb-6">
                The ultimate destination for premium DJ Afro movie experiences. High-quality streaming with unique narration.
              </p>
              
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram', 'youtube'].map((social) => (
                  <a key={social} href={`#${social}`} className="text-gray-400 hover:text-green-400 transition-colors">
                    <div className="w-10 h-10 border border-gray-700 rounded-full flex items-center justify-center hover:border-green-500">
                      {/* Replace with actual social icons */}
                      <span className="uppercase text-xs">{social[0]}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                {['Home', 'Movies', 'Features', 'Mobile App', 'Pricing', 'About Us'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-green-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Categories</h3>
              <ul className="space-y-4">
                {['Action', 'Horror', 'Comedy', 'Thriller', 'Adventure', 'Documentary', 'Sci-Fi'].map((category) => (
                  <li key={category}>
                    <a href={`#${category.toLowerCase()}`} className="text-gray-400 hover:text-green-400 transition-colors">
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
                    <a href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-green-400 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} DJ Afro Movies. All rights reserved.
            </p>
            
            <div className="flex space-x-6">
              {['Terms', 'Privacy', 'Cookies'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-500 hover:text-green-400 text-sm transition-colors">
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