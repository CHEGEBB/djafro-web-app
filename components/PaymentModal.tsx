// components/PaymentModal.tsx
'use client'
import { useState, useEffect } from 'react';
import { usePaymentService } from '@/services/payment_service';

interface PaymentModalProps {
  movieId: string | null;
  customAmount?: number;
  movieIds?: string[];
  offerReference?: string;
  onClose: () => void;
  onSuccess: (movieId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  movieId, 
  customAmount,
  movieIds,
  offerReference,
  onClose, 
  onSuccess 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [reference, setReference] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  const { 
    isProcessingPayment, 
    processIntasendPayment,
    verifyPaymentStatus 
  } = usePaymentService();

  const actualAmount = customAmount ?? Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10);
  const isBundle = movieIds && movieIds.length > 1;

  // Handle countdown for payment status checking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0 && reference && movieId) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        
        // Check payment status every 5 seconds
        if (countdown % 5 === 0) {
          verifyPaymentStatus(reference, movieId)
            .then(isPaid => {
              if (isPaid) {
                setSuccess('Payment successful! 🎉');
                setShowStatusDialog(false);
                setCountdown(0);
                setTimeout(() => {
                  onSuccess(movieId);
                }, 2000);
              }
            })
            .catch(err => console.error('Error verifying payment:', err));
        }
      }, 1000);
    }
    
    // If countdown reaches 0 without payment confirmation
    if (countdown === 0 && reference && showStatusDialog) {
      setShowStatusDialog(false);
      setError('Payment verification timed out. If you completed the payment, please refresh and try watching the movie.');
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, reference, movieId, verifyPaymentStatus, onSuccess, showStatusDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movieId) {
      setError('Movie selection is invalid');
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await processIntasendPayment(
        movieId, 
        phoneNumber,
        customAmount,
        movieIds,
        offerReference
      );
      
      if (result.success) {
        if (result.data?.alreadyPaid) {
          setSuccess('You already own this movie! 🎬');
          setTimeout(() => onSuccess(movieId), 2000);
          return;
        }
        
        const ref = result.data?.reference || '';
        
        if (ref) {
          setReference(ref);
          setSuccess('STK Push sent! Please check your phone to enter M-Pesa PIN 📱');
          setShowStatusDialog(true);
          
          // Start countdown for payment status checking (60 seconds)
          setCountdown(60);
        } else {
          setError('Payment initiated but no reference received. Please try again.');
        }
      } else {
        setError(result.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred during payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckAgain = async () => {
    if (!reference || !movieId) return;
    
    setIsSubmitting(true);
    try {
      const isPaid = await verifyPaymentStatus(reference, movieId);
      if (isPaid) {
        setSuccess('Payment confirmed! 🎉');
        setShowStatusDialog(false);
        setTimeout(() => {
          onSuccess(movieId);
        }, 2000);
      } else {
        setError('Payment not yet confirmed. Please wait a moment if you just completed the payment.');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Failed to verify payment status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full text-white border border-gray-800 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">M-PESA Express Payment</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            disabled={isSubmitting || isProcessingPayment}
          >
            ✕
          </button>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Amount to Pay</p>
            <p className="text-3xl font-bold">KES {actualAmount}</p>
            {customAmount && customAmount < Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10) && (
              <p className="text-xs opacity-75 mt-1">
                <span className="line-through">KES {process.env.NEXT_PUBLIC_MOVIE_PRICE}</span>
                {' '}
                <span className="bg-green-600 px-2 py-0.5 rounded">
                  SAVE {Math.round(((Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10) - customAmount) / Number(process.env.NEXT_PUBLIC_MOVIE_PRICE || 10)) * 100)}%
                </span>
              </p>
            )}
            {isBundle && (
              <p className="text-xs opacity-90 mt-1">
                🎬 Bundle: {movieIds?.length} movies
              </p>
            )}
          </div>
          <div className="text-5xl">💳</div>
        </div>

        {showStatusDialog ? (
          <div className="mb-4">
            <div className="bg-blue-900 bg-opacity-50 border border-blue-700 text-white p-4 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <div className="animate-pulse mr-3 text-2xl">📱</div>
                <div>
                  <p className="font-semibold">Check Your Phone</p>
                  <p className="text-sm opacity-90">Enter your M-Pesa PIN when prompted</p>
                </div>
              </div>
            </div>
            
            <div className="text-center bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">Waiting for payment confirmation...</p>
              <div className="text-3xl font-bold text-blue-400">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {countdown > 0 ? 'Auto-checking payment status...' : 'Verification timeout'}
              </p>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-white p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleCheckAgain}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Checking...' : 'Check Payment Status'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="mb-4">
            <div className="bg-green-900 bg-opacity-50 border border-green-700 text-white p-4 rounded-lg mb-4 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold text-lg">{success}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                M-Pesa Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
                disabled={isSubmitting || isProcessingPayment}
              />
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <span className="mr-1">📱</span>
                You will receive an M-Pesa prompt to complete payment
              </p>
            </div>
            
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-white p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || isProcessingPayment}
              >
                {isSubmitting || isProcessingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `LIPA NA MPESA ${actualAmount} KSH 🔥`
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                disabled={isSubmitting || isProcessingPayment}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Info */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Secure payment powered by Intasend • M-Pesa
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;