// components/PremiumMovieButton.tsx
'use client'
import { useState } from 'react';
import { usePaymentService } from '@/services/payment_service';
import { useRouter } from 'next/navigation';
import PaymentModal from './PaymentModal';

interface PremiumMovieButtonProps {
  movieId: string;
  className?: string;
  buttonText?: string;
}

const PremiumMovieButton: React.FC<PremiumMovieButtonProps> = ({ 
  movieId, 
  className = '', 
  buttonText = 'Unlock Movie'
}) => {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { handlePaymentStart } = usePaymentService();
  
  const handlePurchaseClick = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await handlePaymentStart(movieId);
      
      if (result.success) {
        if (result.data?.alreadyPaid) {
          // Already paid, redirect to watch page
          router.push(`/watch/${movieId}`);
          return;
        }
        
        setShowPaymentModal(true);
      } else {
        setError(result.message || 'Failed to start payment process');
      }
    } catch (err) {
      console.error('Error starting payment:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaymentSuccess = (movieId: string) => {
    setShowPaymentModal(false);
    // Redirect to watch page
    router.push(`/watch/${movieId}`);
  };
  
  return (
    <>
      <button
        onClick={handlePurchaseClick}
        disabled={isLoading}
        className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors ${className}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
      
      {showPaymentModal && (
        <PaymentModal 
          movieId={movieId} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PremiumMovieButton;