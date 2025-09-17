'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LayoutController from '@/components/LayoutController';
import { authService, AuthState } from '@/services/auth_service';
import { useTheme, AppTheme } from '@/context/ThemeContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Settings, 
  Heart, 
  History, 
  Download, 
  Crown, 
  Palette, 
  Bell, 
  Shield, 
  LogOut,
  Edit3,
  Camera,
  ChevronRight,
  Monitor,
  Smartphone,
  Star,
  Clock,
  Trophy,
  Activity,
  CreditCard,
  Gift,
  Zap,
  Moon,
  Sun,
  Tv
} from 'lucide-react';
import '@/styles/ProfilePage.scss';

interface ProfileStats {
  totalWatchTime: number;
  moviesWatched: number;
  favoritesCount: number;
  downloadsUsed: number;
  maxDownloads: number;
}

interface UserProfile {
  $id: string;
  user_id: string;
  display_name: string;
  phone_number?: string;
  subscription_status: string;
  subscription_type: string;
  subscription_expires?: string;
  payment_method?: string;
  favorites: string[];
  watchlist: string[];
  watch_history: string;
  preferred_quality: string;
  download_limit_used: number;
  max_downloads: number;
  theme_preference: string;
  notifications_enabled: boolean;
  total_watch_time: number;
  $createdAt: string;
  $updatedAt: string;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { currentTheme, setTheme, toggleThemeMode, colors } = useTheme();
  const [authState, setAuthState] = useState<AuthState>({ 
    user: null, 
    isLoading: true, 
    isAuthenticated: false, 
    isOnboarded: false 
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalWatchTime: 0,
    moviesWatched: 0,
    favoritesCount: 0,
    downloadsUsed: 0,
    maxDownloads: 5
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    phone_number: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Available profile images
  const profileImages = [
    '/assets/images/image1.jpg',
    '/assets/images/image2.jpg',
    '/assets/images/image3.jpg',
    '/assets/images/image4.jpg',
    '/assets/images/image5.jpg',
    '/assets/images/image6.jpg',
    '/assets/images/image7.jpg',
    '/assets/images/image8.jpg',
    '/assets/images/image9.jpg',
    '/assets/images/image10.jpg'
  ];

  // Auto-change profile images
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % profileImages.length);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profileImages.length]);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      if (state.user) {
        setEditForm({
          display_name: state.user.name,
          phone_number: ''
        });
      }
    });

    // Get initial state
    const initialState = authService.getState();
    setAuthState(initialState);

    return unsubscribe;
  }, []);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authState.user) return;

      try {
        setIsLoading(true);
        
        // Here you would fetch from your users collection
        // For now, we'll create a mock profile based on the collection structure
        const mockProfile: UserProfile = {
          $id: 'profile_' + authState.user.$id,
          user_id: authState.user.$id,
          display_name: authState.user.name,
          phone_number: '',
          subscription_status: 'active',
          subscription_type: 'premium',
          subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: 'Credit Card',
          favorites: [],
          watchlist: [],
          watch_history: '{}',
          preferred_quality: '720p',
          download_limit_used: 2,
          max_downloads: 5,
          theme_preference: currentTheme,
          notifications_enabled: true,
          total_watch_time: 12450, // in minutes
          $createdAt: authState.user.$createdAt,
          $updatedAt: authState.user.$updatedAt || authState.user.$createdAt
        };

        setUserProfile(mockProfile);

        // Calculate stats
        const calculatedStats: ProfileStats = {
          totalWatchTime: mockProfile.total_watch_time,
          moviesWatched: Math.floor(mockProfile.total_watch_time / 120), // Assuming 2hr average
          favoritesCount: mockProfile.favorites.length,
          downloadsUsed: mockProfile.download_limit_used,
          maxDownloads: mockProfile.max_downloads
        };

        setStats(calculatedStats);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.user && !authState.isLoading) {
      loadUserProfile();
    }
  }, [authState.user, authState.isLoading, currentTheme]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'premium':
      case 'active':
        return 'from-yellow-500 to-amber-500';
      case 'basic':
        return 'from-blue-500 to-cyan-500';
      case 'expired':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const themeOptions = [
    { key: AppTheme.netflixDark, name: 'Netflix Dark', icon: Tv, color: '#E50914' },
    { key: AppTheme.primeVideoDark, name: 'Prime Video', icon: Monitor, color: '#00A8E1' },
    { key: AppTheme.disneyPlusDark, name: 'Disney Plus', icon: Star, color: '#0063E5' },
    { key: AppTheme.huluDark, name: 'Hulu Dark', icon: Zap, color: '#1CE783' },
    { key: AppTheme.hboMaxDark, name: 'HBO Max', icon: Crown, color: '#9646FA' },
    { key: AppTheme.amoledDark, name: 'AMOLED Dark', icon: Moon, color: '#FFFFFF' },
    { key: AppTheme.light, name: 'Light Mode', icon: Sun, color: '#FFA500' }
  ];

  if (authState.isLoading || isLoading) {
    return (
      <LayoutController>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading profile...</p>
          </div>
        </div>
      </LayoutController>
    );
  }

  if (!authState.isAuthenticated || !authState.user) {
    router.push('/auth');
    return null;
  }

  return (
    <LayoutController>
      <div className="profile-page min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="profile-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black/80 to-black"></div>
          
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Profile Avatar */}
              <div className="profile-avatar relative group">
                <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-red-500/50 shadow-2xl group-hover:border-red-500 transition-all duration-500">
                  <Image
                    src={profileImages[currentImageIndex]}
                    alt="Profile"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    onError={() => setCurrentImageIndex((prev) => (prev + 1) % profileImages.length)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button className="absolute bottom-4 right-4 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Avatar Indicators */}
                <div className="flex justify-center mt-4 space-x-1">
                  {profileImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-red-500 w-6' 
                          : 'bg-gray-600 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent mb-4">
                    {authState.user.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-gray-300 mb-6">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-red-400" />
                      <span>{authState.user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-red-400" />
                      <span>Member since {new Date(authState.user.$createdAt).getFullYear()}</span>
                    </div>
                  </div>

                  {/* Subscription Badge */}
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${getSubscriptionColor(userProfile?.subscription_type || 'basic')} text-white font-bold shadow-lg`}>
                    <Crown className="w-5 h-5" />
                    <span className="uppercase">{userProfile?.subscription_type || 'Basic'} Member</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="stat-card bg-gradient-to-br from-red-900/30 to-red-800/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                        <Clock className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{formatWatchTime(stats.totalWatchTime)}</p>
                        <p className="text-sm text-gray-400">Watch Time</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <Tv className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.moviesWatched}</p>
                        <p className="text-sm text-gray-400">Movies Watched</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                        <Heart className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.favoritesCount}</p>
                        <p className="text-sm text-gray-400">Favorites</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                        <Download className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.downloadsUsed}/{stats.maxDownloads}</p>
                        <p className="text-sm text-gray-400">Downloads</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Settings */}
            <div className="settings-section bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-500/20 rounded-2xl group-hover:bg-red-500/30 transition-colors">
                  <User className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Account Settings</h2>
              </div>

              <div className="space-y-6">
                <div className="setting-item p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group/item">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Edit3 className="w-5 h-5 text-gray-400 group-hover/item:text-red-400 transition-colors" />
                      <div>
                        <p className="font-semibold text-white">Edit Profile</p>
                        <p className="text-sm text-gray-400">Update your personal information</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover/item:text-red-400 group-hover/item:translate-x-1 transition-all" />
                  </div>
                </div>

                <div className="setting-item p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group/item">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-400 group-hover/item:text-red-400 transition-colors" />
                      <div>
                        <p className="font-semibold text-white">Privacy & Security</p>
                        <p className="text-sm text-gray-400">Manage your account security</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover/item:text-red-400 group-hover/item:translate-x-1 transition-all" />
                  </div>
                </div>

                <div className="setting-item p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group/item">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className={`w-5 h-5 transition-colors ${userProfile?.notifications_enabled ? 'text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold text-white">Notifications</p>
                        <p className="text-sm text-gray-400">
                          {userProfile?.notifications_enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${userProfile?.notifications_enabled ? 'bg-green-500' : 'bg-gray-600'} relative cursor-pointer`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${userProfile?.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="settings-section bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-500/20 rounded-2xl group-hover:bg-purple-500/30 transition-colors">
                  <Palette className="w-7 h-7 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Theme Settings</h2>
              </div>

              <div className="space-y-4">
                {themeOptions.map((theme) => {
                  const Icon = theme.icon;
                  const isActive = currentTheme === theme.key;
                  
                  return (
                    <button
                      key={theme.key}
                      onClick={() => setTheme(theme.key)}
                      className={`w-full p-4 rounded-2xl transition-all duration-300 group/theme ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50' 
                          : 'bg-gray-800/30 hover:bg-gray-800/50 border-2 border-transparent hover:border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg transition-colors ${
                          isActive ? 'bg-purple-500/30' : 'bg-gray-700/50 group-hover/theme:bg-purple-500/20'
                        }`}>
                          <Icon 
                            className="w-5 h-5 transition-colors" 
                            style={{ color: isActive ? theme.color : undefined }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {theme.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.color }}
                            ></div>
                            {isActive && (
                              <span className="text-xs text-purple-400 font-medium">Active</span>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription Info */}
            <div className="settings-section bg-gradient-to-br from-yellow-900/50 to-amber-800/30 backdrop-blur-xl rounded-3xl p-8 border border-yellow-700/50 hover:border-yellow-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-500/20 rounded-2xl group-hover:bg-yellow-500/30 transition-colors">
                  <Crown className="w-7 h-7 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Subscription</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300">Current Plan</p>
                  <p className="text-2xl font-bold text-yellow-400 capitalize">{userProfile?.subscription_type || 'Basic'}</p>
                </div>
                
                {userProfile?.subscription_expires && (
                  <div>
                    <p className="text-gray-300">Expires</p>
                    <p className="text-white font-semibold">
                      {new Date(userProfile.subscription_expires).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <button className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105">
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="settings-section bg-gradient-to-br from-blue-900/50 to-cyan-800/30 backdrop-blur-xl rounded-3xl p-8 border border-blue-700/50 hover:border-blue-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-2xl group-hover:bg-blue-500/30 transition-colors">
                  <Activity className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 bg-gray-800/30 hover:bg-blue-500/20 rounded-xl transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Watch History</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-gray-800/30 hover:bg-blue-500/20 rounded-xl transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-blue-400" />
                    <span className="text-white">My Watchlist</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-gray-800/30 hover:bg-blue-500/20 rounded-xl transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Downloads</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Logout Section */}
            <div className="settings-section bg-gradient-to-br from-red-900/50 to-pink-800/30 backdrop-blur-xl rounded-3xl p-8 border border-red-700/50 hover:border-red-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/20 rounded-2xl group-hover:bg-red-500/30 transition-colors">
                  <LogOut className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Account Actions</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Manage your account or sign out securely
                </p>
                
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutController>
  );
};

export default ProfilePage;