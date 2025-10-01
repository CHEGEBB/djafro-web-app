/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authService } from '@/services/auth_service';
import { 
  Film, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ChevronLeft, 
  X, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import '../../styles/animationsauth.scss';
import Head from "next/head";


// Auth page component
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | React.ReactNode | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  
  // Movie poster images for rotating background
  const movieImages = [
    '/assets/images/image1.jpg',
    '/assets/images/image2.jpg',
    '/assets/images/image3.jpg',
    '/assets/images/image4.jpg',
  ];

  // SIMPLE: Quick session check - if user exists, go to dashboard
  useEffect(() => {
    const quickSessionCheck = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // User exists = they go to dashboard, simple as that
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.log('No existing session, showing auth form');
      }
      
      // No session or error -> show auth form
      setInitialLoading(false);
    };

    quickSessionCheck();
  }, [router]);

  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === movieImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [movieImages.length]);

  // Focus first input when form is ready
  useEffect(() => {
    if (!initialLoading && emailRef.current) {
      emailRef.current.focus();
    }
    setError(null);
    setSuccess(null);
    setWarning(null);
  }, [isLogin, initialLoading]);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success && !loading) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, loading]);

  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  // FIXED: Handle form submission with proper logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setWarning(null);
    setLoading(true);
    
    const email = emailRef.current?.value.trim() || '';
    const password = passwordRef.current?.value || '';
    
    // Client-side validation
    if (!email || !password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    
    try {
      if (isLogin) {
        // LOGIN: Existing user - go to dashboard
        await authService.login(email, password);
        
        setSuccess('Welcome back! Redirecting...');
        
        // LOGIN = Dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        
      } else {
        // SIGNUP: New user - go to onboarding
        const name = nameRef.current?.value.trim() || '';
        if (!name) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }

        if (name.length < 2) {
          setError('Name must be at least 2 characters long');
          setLoading(false);
          return;
        }
        
        await authService.register(email, password, name);
        
        setSuccess('Account created! Setting up your experience...');
        
        // SIGNUP = Onboarding
        setTimeout(() => {
          router.push('/onboarding');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle specific errors
      if (err.message.includes('Invalid credentials') || err.message.includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('user with the same id, email') || err.message.includes('already exists')) {
        setError('Account already exists. Please sign in instead.');
        setTimeout(() => setIsLogin(true), 2000);
      } else if (err.message.includes('Password must be between')) {
        setError('Password must be between 8 and 265 characters.');
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('network') || err.message.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Alert component
  const Alert = ({ type, children }: { type: 'error' | 'success' | 'warning', children: React.ReactNode }) => {
    const icons = {
      error: <X className="h-5 w-5 flex-shrink-0" />,
      success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
      warning: <AlertTriangle className="h-5 w-5 flex-shrink-0" />
    };

    const styles = {
      error: 'bg-red-500/10 border-red-500/20 text-red-400',
      success: 'bg-green-500/10 border-green-500/20 text-green-400',
      warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
    };

    return (
      <div className={`alert ${type} ${styles[type]} border rounded-lg p-4 flex items-start space-x-3`}>
        <div className="alert-icon">
          {icons[type]}
        </div>
        <div className="flex-1 text-sm">
          {children}
        </div>
      </div>
    );
  };

  // BETTER LOADING SCREEN - only shows briefly
  if (initialLoading) {
    return (
      
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <Image
                  src="/assets/logo.png"
                  alt="DJ Afro Movies Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 to-red-700/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">DJ Afro Movies</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container flex flex-col md:flex-row min-h-screen">
      {/* Left side - Movie poster */}
      <div className="auth-image-section hidden md:block md:w-1/2 h-screen relative overflow-hidden">
        {movieImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-2000 ease-in-out ${
              index === currentImageIndex 
                ? 'opacity-100 scale-105' 
                : 'opacity-0 scale-100'
            }`}
          >
            <Image
              src={image}
              alt={`DJ Afro Movies ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          </div>
        ))}
        
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
            <Image
            src="/assets/logo.png"
            alt="DJ Afro Movies Logo"
            width={70}
            height={70}
            className="object-contain"
            />
            </div>
            <h1 className="text-2xl font-bold text-white">DJ Afro Movies</h1>
          </div>
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-12 left-8 right-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Premium Entertainment
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Stream exclusive movies in 4K quality
          </p>
          
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Film className="text-red-500" size={20} />
              </div>
              <span className="text-gray-300">4K Quality</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="text-red-500" size={20} />
              </div>
              <span className="text-gray-300">Ad-Free</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="auth-form-section flex-1 flex flex-col justify-center items-center p-6 bg-gray-900">
        {/* Mobile background */}
        <div className="md:hidden absolute inset-0">
          <Image 
            src={movieImages[currentImageIndex]} 
            alt="Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/80"></div>
        </div>
        
        <div className="form-container w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center justify-center space-x-2 md:hidden mb-8">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Film className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">DJ Afro Movies</h1>
          </div>
          
          {/* Form header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join Us Today'}
            </h2>
            <p className="text-gray-400">
              {isLogin 
                ? 'Sign in to access your premium content' 
                : 'Create your account and start streaming'}
            </p>
          </div>
          
          {/* Alerts */}
          <div className="space-y-4 mb-6">
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            {warning && <Alert type="warning">{warning}</Alert>}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    ref={nameRef}
                    required
                    placeholder="Enter your full name"
                    className="bg-gray-800/80 backdrop-blur-sm block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            )}
            
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  ref={emailRef}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="bg-gray-800/80 backdrop-blur-sm block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
            </div>
            
            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  ref={passwordRef}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  className="bg-gray-800/80 backdrop-blur-sm block w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Toggle between login and signup */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-medium text-red-400 hover:text-red-300 transition-colors"
                disabled={loading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
          
          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
              <span className="text-red-400">Terms of Service</span>{' '}
              and{' '}
              <span className="text-red-400">Privacy Policy</span>
            </p>
          </div>
          
          {/* Back button (mobile only) */}
          <div className="mt-8 md:hidden">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}