# DJ Afro Movies - Web Application

## 🎬 Project Overview
A modern, responsive web application for streaming DJ Afro movies with integrated advertising revenue system. This web app complements the existing Flutter mobile app, sharing the same Appwrite backend and user authentication system.

## 🎯 Business Goals
- Generate ad revenue through strategic ad placements
- Promote the mobile DJ Afro app
- Improve SEO rankings for "DJ Afro" searches
- Provide seamless cross-platform user experience
- Allow limited free content with premium features for registered users

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + SCSS/SASS for animations
- **Backend**: Appwrite BaaS (shared with mobile app)
- **Authentication**: Appwrite Auth (cross-platform login)
- **Video Storage**: Bunny CDN, YouTube, DailyMotion
- **Deployment**: Vercel (recommended for Next.js)

## 🏗 Project Structure
```
djafro-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   │   ├── home/
│   │   │   ├── movies/
│   │   │   ├── discover/
│   │   │   ├── library/
│   │   │   └── profile/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (reusable components)
│   │   ├── layout/
│   │   ├── movie/
│   │   ├── auth/
│   │   └── ads/
│   ├── lib/
│   │   ├── appwrite.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── hooks/
│   ├── context/
│   │   └── ThemeContext.tsx
│   └── styles/
│       └── animations.scss
├── public/
├── next.config.js
└── package.json
```

## 🎨 Design System & Themes
Implement the same theme system as mobile app:
- **Netflix Dark** (default)
- **Hulu Dark**
- **Disney Dark**
- **Prime Video Dark**
- **AMOLED Dark**
- **HBO Dark**

### Color Palette (Hulu Dark - Default)
- Primary: `#1CE783` (Green)
- Background: `#0B0E11` (Dark)
- Surface: `#1A1D29`
- Text Primary: `#FFFFFF`
- Text Secondary: `#B3B3B3`

## 📱 Pages & Features

### 1. Landing Page (`/`)
**Purpose**: Convert visitors and promote mobile app
- Hero section with DJ Afro branding
- Featured movie carousel (2-3 movies)
- "Watch 2 free movies" CTA
- Mobile app download section
- SEO optimized for "DJ Afro" keywords
- Strategic ad placements

**User Flow**:
- Visitor can watch 2 movies without signup
- After 2 movies: "Sign up to continue watching"
- Ad before each movie play

### 2. Authentication (`/auth/login`, `/auth/register`)
- Shared Appwrite authentication
- Mobile app users can login directly
- Email/password with "Remember me"
- Smooth transitions and modern UI

### 3. Dashboard Home (`/dashboard/home`)
- Featured movie hero section
- "Continue Watching" (if user has progress)
- "Trending Now" section
- Genre-based categories
- Quick stats (movies watched, day streak, etc.)

### 4. Movies Page (`/dashboard/movies`)
- All movies grid/list view
- Genre filtering (Action, Horror, Sci-Fi, Comedy, Thriller)
- Search functionality
- Sort options (Latest, Rating, Alphabetical)
- Movie cards with play buttons and ratings

### 5. Discover Page (`/dashboard/discover`)
- Search functionality
- "New This Week" section
- "DJ Afro Picks" section
- "Most Watched" section
- "Trending Now" section
- Advanced filters

### 6. Library Page (`/dashboard/library`)
- Continue Watching with progress bars
- My Wishlist
- Watch history
- Personal statistics
- Download status (future feature)

### 7. Profile Page (`/dashboard/profile`)
- User profile management
- Theme selector
- App settings
- Push notification preferences
- Account statistics
- Sign out functionality

### 8. Movie Player (`/watch/[movieId]`)
- Custom video player
- Progress tracking
- Quality selection
- Fullscreen support
- Ad integration (pre-roll, mid-roll)
- Next episode suggestions

## 🔐 Authentication & Security
- Appwrite authentication integration
- JWT token management
- Protected routes middleware
- Cross-platform session sharing
- Secure video URL obfuscation

## 📊 Ad Revenue Implementation
### Ad Placements:
1. **Pre-roll ads** (before movie starts)
2. **Banner ads** (landing page, movie listings)
3. **Interstitial ads** (between page navigation)
4. **Rewarded ads** ("Watch ad for premium feature")

### Ad Networks Integration:
- Google AdSense
- Custom ad server integration
- Video ad networks (for pre-roll)

## 🎥 Video Integration
### Obfuscated URL System:
```typescript
// Example obfuscation strategy
const generateSecureVideoUrl = (videoId: string, userId: string) => {
  const timestamp = Date.now();
  const hash = generateHash(videoId + userId + timestamp + SECRET_KEY);
  return `/api/stream/${hash}?t=${timestamp}`;
};
```

### Video Sources Priority:
1. Bunny CDN (primary)
2. YouTube (fallback)
3. DailyMotion (fallback)

## 🚀 Development Phases

### Phase 1: Foundation (Days 1-2)
- [x] Next.js 15 project setup
- [x] Tailwind CSS configuration
- [x] Appwrite integration
- [x] Basic routing structure
- [x] Theme system implementation

### Phase 2: Core Features (Days 3-4)
- [ ] Landing page with movie previews
- [ ] Authentication system
- [ ] Basic movie listing
- [ ] Video player integration
- [ ] Ad system foundation

### Phase 3: Advanced Features (Days 5-6)
- [ ] Dashboard with all sections
- [ ] Search and filtering
- [ ] User library and progress tracking
- [ ] Profile management
- [ ] Responsive design refinements

### Phase 4: Polish & Deploy (Day 7)
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Ad integration completion
- [ ] Testing and bug fixes
- [ ] Production deployment

## 📱 Responsive Design
- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🔍 SEO Strategy
### Key Optimizations:
- Next.js App Router with SSR
- Dynamic meta tags for movie pages
- Structured data (JSON-LD) for movies
- Optimized images with next/image
- Fast loading times (<3s)

### Target Keywords:
- "DJ Afro movies"
- "DJ Afro streaming"
- "Watch DJ Afro movies online"
- "DJ Afro HD movies"

## 🎬 Animation Strategy
Using SASS instead of Framer Motion to avoid layout shifts:

```scss
// Example smooth transitions
.movie-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(28, 231, 131, 0.2);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 🔧 Environment Variables
```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key

# Video CDN
NEXT_PUBLIC_BUNNY_CDN_URL=https://your-cdn.com
BUNNY_API_KEY=your-bunny-api-key

# Ad Networks
NEXT_PUBLIC_ADSENSE_ID=ca-pub-your-id
AD_SERVER_API_KEY=your-ad-api-key

# Security
JWT_SECRET=your-jwt-secret
VIDEO_URL_SECRET=your-video-secret
```

## 📦 Key Dependencies
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "sass": "^1.69.0",
    "appwrite": "^14.0.0",
    "lucide-react": "^0.263.1",
    "next-seo": "^6.4.0",
    "js-cookie": "^3.0.5",
    "react-player": "^2.13.0",
    "hls.js": "^1.4.0",
    "video.js": "^8.6.0"
  }
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Appwrite account setup

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd djafro-web

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Build for Production
```bash
npm run build
npm run start
```

## 📈 Success Metrics
- **SEO**: Top 3 results for "DJ Afro" searches
- **Revenue**: $X daily ad revenue target
- **Engagement**: 30%+ conversion from free to registered users
- **Performance**: <3s page load times
- **Mobile App Downloads**: 20% increase through web app promotion

## 🔄 Cross-Platform Features
- Shared user accounts (Appwrite Auth)
- Synchronized watch progress
- Consistent theming
- Shared movie ratings and reviews

## 🛡 Security Considerations
- Video URL obfuscation to prevent direct access
- Rate limiting on API endpoints
- CSRF protection
- Input validation and sanitization
- Secure cookie management

## 📞 Support & Maintenance
- Regular security updates
- Performance monitoring
- Ad revenue optimization
- User feedback integration
- A/B testing for conversion optimization

---

**Timeline**: 7 days to production
**Budget**: Ad revenue focused
**Success**: SEO dominance + sustainable revenue