'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Star, Download, Menu, X, Film, Users, Clock, Award, Smartphone, Eye, CheckCircle, 
  ChevronRight, ChevronLeft, Volume2, VolumeX, Heart, Search, Bell, Plus, User } from 'lucide-react';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';
import Head from 'next/head';

// Import custom animations
import '@/styles/landing.scss';

// Movie data with proper image paths
const featuredMovies = [
  {
    id: 1,
    title: "DjAfro-Spiderman",
    description: "After being bitten by a radioactive spider, a nerdy high school student gains spider-like abilities.",
    year: 2021,
    rating: 8.2,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/banner1.jpg",
    backdropUrl: "/assets/images/banner1.jpg",
    videoUrl: "https://example.com/videos/movie1.mp4"
  },
  {
    id: 2,
    title: "DjAfro-Rampage",
    description: "A primatologist and a geneticist team up to stop three giant mutated animals from destroying Chicago.",
    year: 2020,
    rating: 7.6,
    genre: ["Action", "Thriller"],
    posterUrl: "/assets/images/banner2.jpg",
    backdropUrl: "/assets/images/banner2.jpg",
    videoUrl: "https://example.com/videos/movie2.mp4"
  },
  {
    id: 3,
    title: "DjAfro(Joker)",
    description: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.",
    year: 2019,
    rating: 8.4,
    genre: ["Crime", "Drama"],
    posterUrl: "/assets/images/joker.jpg",
    backdropUrl: "/assets/images/joker.jpg",
    videoUrl: "https://example.com/videos/movie3.mp4"
  },
  {
    id: 4,
    title: "DjAfro-Wonderwoman",
    description: "When an American pilot crashes on the shores of Themyscira and tells of a massive conflict raging in the outside world, Diana leaves her home to fight a war to end all wars.",
    year: 2021,
    rating: 8.1,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/banner4.jpg",
    backdropUrl: "/assets/images/banner4.jpg",
    videoUrl: "https://example.com/videos/movie4.mp4"
  },
  {
    id: 5,
    title: "DjAfro(Avengers)",
    description: "Earth's mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.",
    year: 2022,
    rating: 8.7,
    genre: ["Sci-Fi", "Adventure"],
    posterUrl: "/assets/images/banner5.jpg",
    backdropUrl: "/assets/images/banner5.jpg",
    videoUrl: "https://example.com/videos/movie5.mp4"
  },
  {
    id: 6,
    title: "DjAfro(Warcraft)",
    description: "Warfcraft follows the initial encounters between the humans and orcs, who are brought together by war.",
    year: 2021,
    rating: 8.3,
    genre: ["Sci-Fi", "Adventure"],
    posterUrl: "/assets/images/banner6.jpg",
    backdropUrl: "/assets/images/banner6.jpg",
    videoUrl: "https://example.com/videos/movie6.mp4"
  },
  {
    id: 7,
    title: "DjAfro-Guardians of the Galaxy",
    description: "A group of intergalactic criminals must pull together to stop a fanatical warrior with plans to purge the universe.",
    year: 2020,
    rating: 8.8,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/banner7.jpg",
    backdropUrl: "/assets/images/banner7.jpg",
    videoUrl: "https://example.com/videos/movie7.mp4"
  },
  {
    id: 8,
    title: "DjAfro-Alu Arjun",
    description: "A former soldier comes out of retirement to track down his kidnapped daughter, who has been taken by a ruthless crime lord.",
    year: 2019,
    rating: 9.0,
    genre: ["Action", "Crime"],
    posterUrl: "/assets/images/banner10.jpg",
    backdropUrl: "/assets/images/banner10.jpg",
    videoUrl: "https://example.com/videos/movie8.mp4"
  },
  {
    id: 9,
    title: "DjAfro-Bahubali",
    description: "Baahubali is a tale of two brothers in the kingdom of Mahishmati who vie for the throne.",
    year: 2022,
    rating: 8.6,
    genre: ["Sci-Fi", "Drama"],
    posterUrl: "/assets/images/banner12.jpg",
    backdropUrl: "/assets/images/banner12.jpg",
    videoUrl: "https://example.com/videos/movie9.mp4"
  },
  {
    id: 10,
    title: "DjAfro(Gladiator)",
    description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    year: 2021,
    rating: 8.5,
    genre: ["Action", "Drama"],
    posterUrl: "/assets/images/banner8.jpg",
    backdropUrl: "/assets/images/banner8.jpg",
    videoUrl: "https://example.com/videos/movie10.mp4"
  },
  {
    id: 11,
    title: "DjAfro-Godzilla",
    description: "The world is beset by the appearance of monstrous creatures, but none more so than the mighty Godzilla.",
    year: 2020,
    rating: 8.7,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/banner9.jpg",
    backdropUrl: "/assets/images/banner9.jpg",
    videoUrl: "https://example.com/videos/movie11.mp4"
  },
  {
    id: 12,
    title: "DjAfro-Bang Bang",
    description: "Bang Bang! a classic indian action thriller about a thief who steals from the rich and gives to the poor.",
    year: 2021,
    rating: 8.0,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/banner11.jpg",
    backdropUrl: "/assets/images/banner11.jpg",
    videoUrl: "https://example.com/videos/movie12.mp4"
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
    videoUrl: "https://example.com/videos/trending1.mp4"
  },
  {
    id: 8,
    title: "DjAfro(No Time To Die)",
    description: "James Bond has left active service. His peace is short-lived when an old friend from the CIA asks for help.",
    year: 2021,
    rating: 7.8,
    genre: ["Action", "Thriller"],
    posterUrl: "/assets/images/image8.jpg",
    videoUrl: "https://example.com/videos/trending2.mp4"
  },
  {
    id: 9,
    title: "DjAfro(Black Widow)",
    description: "Natasha Romanoff confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises.",
    year: 2021,
    rating: 7.2,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/image9.jpg",
    videoUrl: "https://example.com/videos/trending3.mp4"
  },
  {
    id: 10,
    title: "DjAfro(Shang-Chi)",
    description: "Shang-Chi is drawn into the clandestine Ten Rings organization and must confront the past he thought he left behind.",
    year: 2021,
    rating: 7.9,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/image10.jpg",
    videoUrl: "https://example.com/videos/trending4.mp4"
  },
  {
    id: 11,
    title: "DjAfro(Wonder Woman)",
    description: "Diana must contend with a colleague, and with the secrets of her past.",
    year: 2020,
    rating: 7.3,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/image11.jpg",
    videoUrl: "https://example.com/videos/trending5.mp4"
  },
  {
    id: 12,
    title: "DjAfro(Fast & Furious)",
    description: "Dom and his crew must take on an international terrorist who turns out to be Dom and Mia's estranged brother.",
    year: 2021,
    rating: 7.1,
    genre: ["Action", "Crime"],
    posterUrl: "/assets/images/bgimage8.jpg",
    videoUrl: "https://example.com/videos/trending6.mp4"
  },
  {
    id: 13,
    title: "DjAfro(Venom)",
    description: "Eddie Brock attempts to reignite his career by interviewing serial killer Cletus Kasady, who becomes the host of the symbiote Carnage.",
    year: 2021,
    rating: 7.4,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/bgimage10.jpg",
    videoUrl: "https://example.com/videos/trending7.mp4"
  },
  {
    id: 14,
    title: "DjAfro(Eternals)",
    description: "The saga of the Eternals, a race of immortal beings who lived on Earth and shaped its history and civilizations.",
    year: 2021,
    rating: 7.6,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/bgimage9.jpg",
    videoUrl: "https://example.com/videos/trending8.mp4"
  },
  {
    id: 15,
    title: "DjAfro(Spider-Man)",
    description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
    year: 2021,
    rating: 8.9,
    genre: ["Action", "Adventure"],
    posterUrl: "/assets/images/bgimage8.jpg",
    videoUrl: "https://example.com/videos/trending9.mp4"
  },
  {
    id: 16,
    title: "DjAfro(The Suicide Squad)",
    description: "Supervillains Harley Quinn, Bloodsport, Peacemaker and a collection of nutty cons at Belle Reve prison join the super-secret Task Force X.",
    year: 2021,
    rating: 7.7,
    genre: ["Action", "Comedy"],
    posterUrl: "/assets/images/bgimage7.jpg",
    videoUrl: "https://example.com/videos/trending10.mp4"
  },
  {
    id: 17,
    title: "DjAfro(Godzilla vs Kong)",
    description: "The epic next chapter in the cinematic Monsterverse pits two of the greatest icons in motion picture history against one another.",
    year: 2021,
    rating: 7.8,
    genre: ["Action", "Sci-Fi"],
    posterUrl: "/assets/images/bgimage6.jpg",
    videoUrl: "https://example.com/videos/trending11.mp4"
  },
  {
    id: 18,
    title: "DjAfro(The Witcher)",
    description: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.",
    year: 2021,
    rating: 8.2,
    genre: ["Action", "Fantasy"],
    posterUrl: "/assets/images/bgimage5.jpg",
    videoUrl: "https://example.com/videos/trending12.mp4"
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
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    name: "Film Buff",
    comment: "This is hands down the best platform for watching DJ Afro movies. The mobile app is a game-changer.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1561406636-b80293969660?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    name: "Casual Viewer",
    comment: "I've tried many streaming services, but this one offers the best value and entertainment experience.",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1484517186945-df8151a1a871?q=80&w=749&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

export default function DjAfroMovies() {
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [visibleSection, setVisibleSection] = useState('hero');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Auto-scroll state
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // Refs for carousel containers
  const featuredCarouselRef = useRef<HTMLDivElement>(null);
  const trendingCarouselRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({
    hero: null,
    movies: null,
    features: null,
    app: null,
  });

  // Animate elements when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  // Rotate hero content (stop when video is playing)
  useEffect(() => {
    if (isVideoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentMovieIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  // Auto-scroll featured movies carousel
  useEffect(() => {
    if (!autoScrollEnabled || !featuredCarouselRef.current) return;
    
    let scrollPosition = 0;
    const maxScroll = featuredCarouselRef.current.scrollWidth - featuredCarouselRef.current.clientWidth;
    
    const interval = setInterval(() => {
      if (!featuredCarouselRef.current) return;
      
      scrollPosition += 2;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
        // Smoothly reset to beginning
        featuredCarouselRef.current.scrollTo({
          left: 0,
          behavior: 'auto'
        });
      } else {
        featuredCarouselRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'auto'
        });
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [autoScrollEnabled]);

  // Auto-scroll trending movies carousel
  useEffect(() => {
    if (!autoScrollEnabled || !trendingCarouselRef.current) return;
    
    let scrollPosition = 0;
    const maxScroll = trendingCarouselRef.current.scrollWidth - trendingCarouselRef.current.clientWidth;
    
    const interval = setInterval(() => {
      if (!trendingCarouselRef.current) return;
      
      scrollPosition += 1.5;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
        // Smoothly reset to beginning
        trendingCarouselRef.current.scrollTo({
          left: 0,
          behavior: 'auto'
        });
      } else {
        trendingCarouselRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'auto'
        });
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [autoScrollEnabled]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle scroll events for section detection and navbar transparency
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

  // Function to redirect to auth page with a message
  const redirectToAuth = (movieTitle: string) => {
    toast.success(`Sign up to watch ${movieTitle}!`, {
      duration: 2000,
      position: 'bottom-center',
    });
    
    // Short delay before redirecting to auth page
    setTimeout(() => {
      router.push('/auth');
    }, 1500);
  };

  // Function to open Google Play store
  const openGooglePlay = () => {
    window.open('https://play.google.com/store/apps/details?id=com.djafro.moviesbox', '_blank');
  };

  // Function to open social media
  const openTikTok = () => {
    window.open('https://www.tiktok.com/@djafro.streambox?_t=ZM-90BufVceW52&_r=1', '_blank');
  };
  
  const openFacebook = () => {
    window.open('https://www.facebook.com/people/DjAfro-StreamBox-DjAfro/61581274010368/', '_blank');
  };

  const handleWatchMovie = () => {
    redirectToAuth(currentMovie.title);
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
    toast.success('Search feature coming soon!');
  };

  // Pause auto-scroll on carousel hover
  const handleCarouselMouseEnter = () => {
    setAutoScrollEnabled(false);
  };
  
  const handleCarouselMouseLeave = () => {
    setAutoScrollEnabled(true);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">
      <Head>
        <title>DJ Afro StreamBox - Watch Premium DJ Afro Movies Anytime</title>
        <meta 
          name="description" 
          content="Stream premium DJ Afro narrated movies on your phone, tablet, or TV. Enjoy the unique DJ Afro cinema experience with smooth playback and reliable performance."
        />
        <meta name="keywords" content="DJ Afro, movies, streaming, narrated movies, cinema, entertainment, Kenya" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="DJ Afro StreamBox - Premium Movie Streaming" />
        <meta property="og:description" content="Watch DJ Afro narrated movies with our easy-to-use streaming app." />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta property="og:url" content="https://djafro-streambox.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://djafro-streambox.com" />
      </Head>
      
      <Toaster 
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f1f1f',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#dc2626',
              color: '#fff',
            },
          },
        }}
      />

      {/* Video Player */}
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
      
      {/* Search Overlay */}
      {isSearchActive && (
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
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                <Image
                  src="/assets/logo.png"
                  alt="DJ Afro Movies Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold text-white">
                  DJ Afro StreamBox
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
                    <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 w-48 z-50 animate-scale-in">
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
              
              <button 
                onClick={openGooglePlay}
                className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
              >
                <Download size={16} />
                <span>Get App</span>
              </button>
              
              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => router.push('/auth')}
                  className="bg-transparent border border-gray-700 hover:border-white px-4 py-1 rounded text-sm transition-colors"
                >
                  Sign In
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
          <div className="md:hidden bg-black animate-scale-in">
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
              <a 
                href="#features" 
                className={`block py-2 ${visibleSection === 'features' ? 'text-red-500' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#app" 
                className={`block py-2 ${visibleSection === 'app' ? 'text-red-500' : 'text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Mobile App
              </a>
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <button 
                  onClick={openGooglePlay}
                  className="block w-full bg-red-600 text-center py-2 rounded font-semibold flex items-center justify-center space-x-2"
                >
                  <Download size={18} />
                  <span>Download App</span>
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/auth');
                  }}
                  className="block w-full border border-gray-700 text-center py-2 rounded font-semibold"
                >
                  Sign In
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
        <div className="relative z-10 container mx-auto px-6 pt-32 flex flex-col md:flex-row justify-between items-end">
          <div className="max-w-2xl animate-on-scroll">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight hero-title">
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
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 flex items-center space-x-3 pulse-animation"
              >
                <Play fill="white" size={24} />
                <span>Play Now</span>
              </button>
              
              <button 
                onClick={openGooglePlay}
                className="bg-gray-800/80 hover:bg-gray-700 px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 flex items-center space-x-3"
              >
                <Download size={24} />
                <span>Get App</span>
              </button>
            </div>
            
            <div className="mt-6 text-sm text-gray-400">
              <p>
                <span className="text-red-500 font-medium">Available on Google Play</span> - Watch on any device, anytime.
              </p>
            </div>
          </div>
          
          {/* App promo card */}
          <div className="hidden lg:block bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800 w-80 animate-on-scroll">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <Image
                  src="/assets/logo.png"
                  alt="DJ Afro StreamBox Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold">DJ Afro StreamBox</h3>
                <p className="text-sm text-gray-400">50+ Downloads</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Stream DJ Afro narrated movies on your phone, tablet, or smart TV.
            </p>
            <button
              onClick={openGooglePlay}
              className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Download size={18} />
              <span>Download Now</span>
            </button>
            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={openTikTok}
                className="p-2 border border-gray-700 rounded-full hover:border-red-500 transition-colors"
                aria-label="TikTok"
              >
                <span className="text-sm">TikTok</span>
              </button>
              <button
                onClick={openFacebook}
                className="p-2 border border-gray-700 rounded-full hover:border-red-500 transition-colors"
                aria-label="Facebook"
              >
                <span className="text-sm">Facebook</span>
              </button>
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
          <div className="flex justify-between items-center mb-8 animate-on-scroll">
            <h2 className="text-2xl font-bold flex items-center">
              <span>Featured Movies</span>
              <ChevronRight size={24} className="text-red-500 ml-2" />
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => featuredCarouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                aria-label="Previous featured movies"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => featuredCarouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                aria-label="Next featured movies"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div 
            className="overflow-x-auto scrollbar-hide"
            ref={featuredCarouselRef}
            onMouseEnter={handleCarouselMouseEnter}
            onMouseLeave={handleCarouselMouseLeave}
          >
            <div className="flex space-x-4 pb-4 min-w-max">
              {[...featuredMovies, ...featuredMovies].map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
                  className="flex-none w-64 md:w-80 animate-on-scroll"
                >
                  <div className="relative rounded-md overflow-hidden group">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-[360px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <button 
                            onClick={() => redirectToAuth(movie.title)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-transform transform group-hover:scale-110"
                          >
                            <Play fill="white" size={20} />
                          </button>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => redirectToAuth("to your list")}
                              className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors"
                            >
                              <Plus size={18} />
                            </button>
                            <button 
                              onClick={() => redirectToAuth("to your favorites")}
                              className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors"
                            >
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
            <div className="flex justify-between items-center mb-8 animate-on-scroll">
              <h2 className="text-2xl font-bold flex items-center">
                <span>Trending Now</span>
                <ChevronRight size={24} className="text-red-500 ml-2" />
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => trendingCarouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                  aria-label="Previous trending movies"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => trendingCarouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className="bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full transition-colors"
                  aria-label="Next trending movies"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div 
              className="overflow-x-auto scrollbar-hide"
              ref={trendingCarouselRef}
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
            >
              <div className="flex space-x-4 pb-4 min-w-max">
                {[...trendingMovies, ...trendingMovies].map((movie, index) => (
                  <div
                    key={`${movie.id}-${index}`}
                    className="flex-none w-64 md:w-80 animate-on-scroll"
                  >
                    <div className="relative rounded-md overflow-hidden group">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-[360px] object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <div className="flex justify-between items-center mb-2">
                            <button 
                              onClick={() => redirectToAuth(movie.title)}
                              className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-transform transform group-hover:scale-110"
                            >
                              <Play fill="white" size={20} />
                            </button>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => redirectToAuth("to your list")}
                                className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors"
                              >
                                <Plus size={18} />
                              </button>
                              <button 
                                onClick={() => redirectToAuth("to your favorites")}
                                className="bg-gray-800/70 hover:bg-gray-700 p-2 rounded-full transition-colors"
                              >
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
          <h2 className="text-2xl font-bold mb-8 flex items-center animate-on-scroll">
            <span>Browse by Category</span>
            <ChevronRight size={24} className="text-red-500 ml-2" />
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"].map((category, index) => (
              <div 
                key={category}
                className="relative h-32 rounded-lg overflow-hidden group cursor-pointer animate-on-scroll"
                onClick={() => redirectToAuth(`${category} movies`)}
              >
                <img
                  src={`assets/images/image${index + 1}.jpg`}
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
            <button 
              onClick={() => redirectToAuth("to browse all categories")}
              className="border border-gray-700 hover:border-white px-8 py-3 rounded-md transition-colors text-sm"
            >
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
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold mb-6">
              Why Choose <span className="text-red-600">DJ Afro StreamBox?</span>
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
                className="bg-gray-900/50 border border-gray-800 hover:border-red-500/50 rounded-xl p-8 transition-all duration-300 hover:bg-gray-900 hover:shadow-lg hover:shadow-red-500/10 animate-on-scroll"
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

      {/* App Download Section */}
      <section className="py-20 bg-[#0C0C0C] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(229,9,20,0.2),transparent_70%)]"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 animate-on-scroll">
              <h2 className="text-4xl font-bold mb-8">
                Get the <span className="text-red-600">DJ Afro StreamBox App</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Download our mobile app to enjoy DJ Afro narrated movies anytime, anywhere. Available now on Google Play Store!
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600/20 p-3 rounded-full mt-1">
                    <Smartphone className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Stream on Any Device</h3>
                    <p className="text-gray-300">
                      Watch on your phone, tablet, or smart TV with our easy-to-use app.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600/20 p-3 rounded-full mt-1">
                    <Download className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Download for Offline Viewing</h3>
                    <p className="text-gray-300">
                      Save your favorite movies to watch offline, perfect for travel or areas with poor connection.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600/20 p-3 rounded-full mt-1">
                    <Eye className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Exclusive DJ Afro Content</h3>
                    <p className="text-gray-300">
                      Access the complete library of DJ Afro narrated movies not available anywhere else.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={openGooglePlay}
                  className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
                >
                  <Download size={24} />
                  <span>Download Now</span>
                </button>
                
                <div className="flex space-x-4">
                  <button
                    onClick={openTikTok}
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-center"
                    aria-label="Follow on TikTok"
                  >
                    <span className="text-sm">TikTok</span>
                  </button>
                  <button
                    onClick={openFacebook}
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-center"
                    aria-label="Follow on Facebook"
                  >
                    <span className="text-sm">Facebook</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 flex justify-center animate-on-scroll">
              <div className="relative max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-purple-600/30 blur-3xl rounded-full transform -rotate-12"></div>
                <div className="relative bg-black border-8 border-gray-800 rounded-[3rem] p-3 shadow-2xl">
                  <div className="rounded-[2.5rem] overflow-hidden bg-black">
                    <Image
                      src="/assets/images/app.jpg"
                      alt="DJ Afro StreamBox App"
                      width={350}
                      height={700}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute bottom-8 left-0 right-0 mx-auto w-32 h-1 bg-white/20 rounded-full"></div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 bg-red-600 rounded-full p-4 shadow-lg animate-pulse">
                  <Download size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-[#141414]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold mb-6">
              Experience the <span className="text-red-600">Magic</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch a preview of what makes DJ Afro movies special - premium quality, engaging narration, and unforgettable entertainment.
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-on-scroll">
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
                    className="bg-red-600 hover:bg-red-700 p-8 rounded-full transition-transform duration-300 hover:scale-110 group-hover:shadow-2xl group-hover:shadow-red-500/30 pulse-animation"
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
            
            <div className="mt-6 text-center">
              <button
                onClick={openGooglePlay}
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-3 mx-auto"
              >
                <Download size={20} />
                <span>Get the App on Google Play</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[#0C0C0C]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold mb-6">
              What Our <span className="text-red-600">Users Say</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied users enjoying the DJ Afro experience
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-on-scroll">
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
                        <p className="text-gray-300 italic">&ldquo;{testimonial.comment}&rdquo;</p>
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

      {/* CTA Section */}
      <section 
        id="app" 
        className="py-24 bg-gradient-to-b from-[#141414] to-black relative overflow-hidden"
        ref={assignSectionRef('app')}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(229,9,20,0.2),transparent_70%)]"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-on-scroll">
            <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to Experience <span className="text-red-600">DJ Afro StreamBox</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied users and unlock a world of premium entertainment with DJ Afro&apos;s unique narrative style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={openGooglePlay}
                className="bg-red-600 hover:bg-red-700 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 pulse-animation"
              >
                <Download size={24} />
                <span>Download Now</span>
              </button>
              
              <button 
                onClick={openTikTok}
                className="bg-gray-800 hover:bg-gray-700 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <span>Follow on TikTok</span>
              </button>
              
              <button 
                onClick={openFacebook}
                className="bg-gray-800 hover:bg-gray-700 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <span>Follow on Facebook</span>
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
                <Image
                  src="/assets/logo.png"
                  alt="DJ Afro Movies Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-white">
                  DJ Afro StreamBox
                </span>
              </div>
              
              <p className="text-gray-400 mb-6">
                The ultimate destination for premium DJ Afro movie experiences. High-quality streaming with unique narration.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={openTikTok}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="TikTok"
                >
                  <div className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center hover:border-red-500">
                    <span className="text-xs">TikTok</span>
                  </div>
                </button>
                <button
                  onClick={openFacebook}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Facebook"
                >
                  <div className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center hover:border-red-500">
                    <span className="text-xs">FB</span>
                  </div>
                </button>
                <button
                  onClick={openGooglePlay}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Google Play"
                >
                  <div className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center hover:border-red-500">
                    <span className="text-xs">GP</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                {['Home', 'Movies', 'TV Shows', 'New & Popular', 'My List', 'Browse by Languages'].map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        redirectToAuth(link);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
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
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        redirectToAuth(category);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Download</h3>
              <ul className="space-y-4">
                <li>
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.djafro.moviesbox" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Google Play Store</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.tiktok.com/@djafro.streambox?_t=ZM-90BufVceW52&_r=1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Follow on TikTok
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.facebook.com/people/DjAfro-StreamBox-DjAfro/61581274010368/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Follow on Facebook
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      redirectToAuth("to contact support");
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} DJ Afro StreamBox. All rights reserved.
            </p>
            
            <div className="flex space-x-6">
              {['Terms', 'Privacy', 'Cookies'].map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    redirectToAuth(item);
                  }}
                  className="text-gray-500 hover:text-red-500 text-sm transition-colors"
                >
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