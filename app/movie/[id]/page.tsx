// app/movie/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react';
import { useMovieService, Movie } from '@/services/movie_service';
import { useParams } from 'next/navigation';
import PremiumMovieButton from '@/components/PremiumMovieButton';
import Head from 'next/head'; 


export default function MovieDetailPage() {
  const { id } = useParams();
  const { service } = useMovieService();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        if (typeof id !== 'string') {
          setError('Invalid movie ID');
          setLoading(false);
          return;
        }
        
        const movieData = await service.getMovieById(id);
        
        if (!movieData) {
          setError('Movie not found');
        } else {
          setMovie(movieData);
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovie();
  }, [id, service]);
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (error || !movie) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl text-red-500 mb-4">{error}</h1>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check if the movie is premium and user hasn't paid
  const needsPayment = movie.isPremium && movie.paymentStatus === 'premium';
  
  return (
    <div className="container mx-auto p-4">
        <Head>
      <title>Dashboard – DJ Afro Movies | Trending & New Releases</title>
      <meta
        name="description"
        content="Browse DJ Afro trending movies, new releases, and genre-based collections. Continue watching your favorites or add to wishlist anytime."
      />
      <meta
        name="keywords"
        content="DJ Afro movies dashboard, trending DJ Afro movies, new releases, African movies online"
      />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Dashboard – DJ Afro Movies" />
      <meta
        property="og:description"
        content="Watch trending DJ Afro movies, new releases, and explore genres on DJAfroMovies."
      />
      <meta property="og:image" content="/og-image.jpg" />
      <meta property="og:url" content="https://djafromovies.vercel.app" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          
          <div className="flex items-center mb-4">
            <span className="mr-4">{movie.year}</span>
            <span className="mr-4">{movie.duration}</span>
            <span className="bg-yellow-600 text-white px-2 py-1 rounded">
              {movie.rating.toFixed(1)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres.map((genre, index) => (
              <span key={index} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                {genre}
              </span>
            ))}
          </div>
          
          <p className="text-gray-300 mb-6">{movie.description}</p>
          
          {needsPayment ? (
            <div className="mb-6">
              <div className="bg-purple-900 p-4 rounded-lg mb-4">
                <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
                <p className="mb-4">
                  This is a premium movie. Pay KES {process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || 20} to unlock it.
                </p>
                <PremiumMovieButton 
                  movieId={movie.id} 
                  buttonText="Pay to Watch"
                  className="w-full py-3 text-lg font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <a 
                href={`/watch/${movie.id}`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-lg font-medium"
              >
                Watch Now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}