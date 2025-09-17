'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Play, Film, Users, Star, Zap } from 'lucide-react';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const onboardingSteps = [
    {
      id: 1,
      title: "Welcome to DJ Afro Movies",
      subtitle: "Your Gateway to African Cinema",
      description: "Experience the rich storytelling and vibrant culture of African cinema like never before. Join thousands of movie lovers on this incredible journey.",
      image: "/assets/images/image1.jpg",
      icon: <Film className="w-16 h-16 text-red-500" />,
      gradient: "from-red-900/20 via-black/40 to-black/80"
    },
    {
      id: 2,
      title: "Discover Amazing Movies",
      subtitle: "Curated Collection of African Films",
      description: "From thrilling dramas to heartwarming comedies, explore our vast library of premium African movies, carefully selected for your entertainment.",
      image: "/assets/images/image2.jpg",
      icon: <Star className="w-16 h-16 text-yellow-500" />,
      gradient: "from-yellow-900/20 via-black/40 to-black/80"
    },
    {
      id: 3,
      title: "Stream Anywhere, Anytime",
      subtitle: "Ultra HD Quality on All Devices",
      description: "Enjoy seamless streaming in crystal clear HD quality. Watch on your phone, tablet, laptop, or TV - your entertainment follows you everywhere.",
      image: "/assets/images/image3.jpg",
      icon: <Play className="w-16 h-16 text-green-500" />,
      gradient: "from-green-900/20 via-black/40 to-black/80"
    },
    {
      id: 4,
      title: "Join Our Community",
      subtitle: "Connect with Fellow Movie Lovers",
      description: "Rate movies, share reviews, and discover new favorites recommended by our passionate community of African cinema enthusiasts.",
      image: "/assets/images/image4.jpg",
      icon: <Users className="w-16 h-16 text-blue-500" />,
      gradient: "from-blue-900/20 via-black/40 to-black/80"
    },
    {
      id: 5,
      title: "Ready to Begin?",
      subtitle: "Start Your Cinematic Journey",
      description: "You're all set! Dive into our amazing collection of African movies and start experiencing cinema like never before. Welcome to the family!",
      image: "/assets/images/image5.jpg",
      icon: <Zap className="w-16 h-16 text-purple-500" />,
      gradient: "from-purple-900/20 via-black/40 to-black/80"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= onboardingSteps.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [currentStep, isAutoPlaying, onboardingSteps.length]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsAutoPlaying(false);
    handleComplete();
  };

  const handleComplete = () => {
    window.location.href = '/dashboard';
  };

  const handleDotClick = (index: React.SetStateAction<number>) => {
    setIsAutoPlaying(false);
    setCurrentStep(index);
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${currentStepData.image})`,
            filter: 'brightness(0.4) contrast(1.2)',
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${currentStepData.gradient} transition-all duration-1000`} />
      </div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleSkip}
          className="px-6 py-2 text-white/80 hover:text-white font-medium transition-all duration-300 hover:bg-white/10 rounded-full backdrop-blur-sm"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl w-full text-center">
          {/* Icon Animation */}
          <div className="mb-8 animate-bounce-slow">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black/30 backdrop-blur-lg border border-white/20">
              {currentStepData.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up">
            {currentStepData.title}
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-red-400 mb-6 animate-fade-in-up">
            {currentStepData.subtitle}
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto mb-12 animate-fade-in-up">
            {currentStepData.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center space-x-3 mb-12">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`relative w-3 h-3 rounded-full transition-all duration-500 hover:scale-125 cursor-pointer ${
                  index === currentStep 
                    ? 'bg-red-500 w-8' 
                    : index < currentStep 
                    ? 'bg-red-400/70' 
                    : 'bg-white/30'
                }`}
              >
                {index === currentStep && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleNext}
              className="group relative overflow-hidden px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 flex items-center space-x-2"
            >
              <span className="relative z-10">
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </button>

            {/* Auto-play indicator */}
            {isAutoPlaying && currentStep < onboardingSteps.length - 1 && (
              <div className="flex items-center space-x-2 text-white/60 text-sm">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                <span>Auto-advancing in 4s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000 ease-out"
          style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
        />
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.8);
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;