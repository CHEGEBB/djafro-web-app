/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { appwriteHelpers } from '@/lib/appwrite';
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

// Auth page component
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === movieImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [movieImages.length]);

  // Form animation on mount
  useEffect(() => {
    const form = document.querySelector('.auth-form-container');
    if (form) {
      setTimeout(() => {
        form.classList.add('animate-in');
      }, 100);
    }
  }, []);

  // Focus first input on mount and clear messages when switching forms
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
    setError(null);
    setSuccess(null);
    setWarning(null);
  }, [isLogin]);

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

  // Auto-handle existing session (silent for users)
  const handleExistingSessionAuto = async () => {
    try {
      await appwriteHelpers.deleteSession();
      return true;
    } catch (err) {
      console.error('Error clearing session:', err);
      return false;
    }
  };

  // Handle form submission with auto session handling
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
        // Login
        await appwriteHelpers.createSession(email, password);
        setSuccess('Welcome back! Redirecting...');
        
        // Redirect after successful login
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // Signup
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
        
        await appwriteHelpers.createAccount(email, password, name);
        setSuccess('Account created! You can now sign in.');
        
        // Switch to login form after successful signup
        setTimeout(() => {
          setIsLogin(true);
          // Clear form fields
          if (emailRef.current) emailRef.current.value = '';
          if (passwordRef.current) passwordRef.current.value = '';
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle existing session automatically
      if (err.message.includes('session') && err.message.includes('active')) {
        setWarning('Signing you in...');
        const sessionCleared = await handleExistingSessionAuto();
        
        if (sessionCleared) {
          // Retry the original operation
          try {
            if (isLogin) {
              await appwriteHelpers.createSession(email, password);
              setSuccess('Welcome back! Redirecting...');
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else {
              const name = nameRef.current?.value.trim() || '';
              await appwriteHelpers.createAccount(email, password, name);
              setSuccess('Account created! You can now sign in.');
              setTimeout(() => {
                setIsLogin(true);
                if (emailRef.current) emailRef.current.value = '';
                if (passwordRef.current) passwordRef.current.value = '';
              }, 2000);
            }
            setWarning(null);
          } catch (retryErr: any) {
            setWarning(null);
            setError('Please check your credentials and try again.');
          }
        } else {
          setWarning(null);
          setError('Please refresh the page and try again.');
        }
      } else if (err.message.includes('Invalid credentials')) {
        setError('Invalid email or password.');
      } else if (err.message.includes('user with the same id, email')) {
        setError('Account already exists. Try signing in instead.');
        setTimeout(() => setIsLogin(true), 3000);
      } else if (err.message.includes('Password must be between')) {
        setError('Password must be between 8 and 265 characters.');
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Alert component with proper styling
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

  return (
    <div className="auth-container flex flex-col md:flex-row">
      {/* Left side - Clean movie poster with simple gradient */}
      <div className="auth-image-section hidden md:block md:w-1/2 h-screen relative overflow-hidden">
        {/* Rotating background images */}
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
            {/* Simple bottom gradient ONLY - no other overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          </div>
        ))}
        
        {/* Logo at top left */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <Film className="text-white" size={24} />
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
          
          {/* Simple features */}
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Film className="text-red-500" size={20} />
              </div>
              <span className="text-gray-300">4K Quality</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="text-red-500"
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 17.8L5.8 21L7 14.1L2 9.3L8.9 8.5L12 2L15.1 8.5L22 9.3L17 14.1L18.2 21L12 17.8Z" />
                </svg>
              </div>
              <span className="text-gray-300">Exclusive</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="text-red-500"
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <span className="text-gray-300">Ad-Free</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="auth-form-section flex-1 flex flex-col justify-center items-center p-6 md:overflow-y-auto">
        {/* Mobile background image */}
        <div className="md:hidden absolute inset-0">
          <Image 
            src={movieImages[currentImageIndex]} 
            alt="DJ Afro Movies Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        
        <div className="form-container w-full max-w-md p-6 md:p-0 relative z-10">
          <div className="auth-form-container">
            {/* Mobile logo */}
            <div className="mobile-logo flex items-center justify-center space-x-2 md:hidden mb-8">
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
                <div className="input-group space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="input-icon h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      ref={nameRef}
                      required
                      placeholder="Enter your full name"
                      className="input-field bg-gray-800/60 backdrop-blur-sm block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
              
              {/* Email field */}
              <div className="input-group space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="input-icon h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    ref={emailRef}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="input-field bg-gray-800/60 backdrop-blur-sm block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
              
              {/* Password field */}
              <div className="input-group space-y-2">
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
                    <Lock className="input-icon h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    ref={passwordRef}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    className="input-field bg-gray-800/60 backdrop-blur-sm block w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
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
                className={`submit-button w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center relative ${loading ? 'loading' : ''}`}
              >
                <div className="spinner">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="button-content flex items-center">
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </button>
            </form>
            
            {/* Toggle between login and signup */}
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="toggle-button ml-2 font-medium"
                  disabled={loading}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
            
            {/* Additional info */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
                <button className="text-red-400 hover:text-red-300 transition-colors">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-red-400 hover:text-red-300 transition-colors">
                  Privacy Policy
                </button>
              </p>
            </div>
            
            {/* Back button (only on mobile) */}
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
    </div>
  );
}