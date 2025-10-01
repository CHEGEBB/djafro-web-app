// components/PaymentModal.tsx
'use client'
import { useState, useEffect } from 'react';
import { usePaymentService } from '@/services/payment_service';

interface PaymentModalProps {
  movieId: string | null;
  onClose: () => void;
  onSuccess: (movieId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ movieId, onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [reference, setReference] = useState('');
  
  const { 
    isProcessingPayment, 
    processPesapalPayment, 
    handlePesapalRedirect,
    verifyPaymentStatus 
  } = usePaymentService();

  // Handle countdown for payment status checking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0 && reference && movieId) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        
        // Check payment status
        if (countdown % 5 === 0) { // Check every 5 seconds
          verifyPaymentStatus(reference, movieId)
            .then(isPaid => {
              if (isPaid) {
                setSuccess('Payment successful! Unlocking movie...');
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
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, reference, movieId, verifyPaymentStatus, onSuccess]);

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
    
    try {
      const result = await processPesapalPayment(movieId, phoneNumber);
      
      if (result.success) {
        if (result.data?.alreadyPaid) {
          setSuccess('You already own this movie!');
          setTimeout(() => onSuccess(movieId), 2000);
          return;
        }
        
        const redirectUrl = result.data?.redirectUrl;
        const ref = result.data?.reference || '';
        
        if (redirectUrl) {
          setReference(ref);
          setSuccess('Redirecting to payment page...');
          
          // Start countdown for payment status checking
          setCountdown(120); // 2 minutes
          
          // Open payment window
          await handlePesapalRedirect(redirectUrl, movieId);
        } else {
          setError('Payment initiated but no redirect URL received. Please try again.');
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Purchase Movie</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="mb-4">
            <div className="bg-green-800 text-white p-3 rounded mb-4">
              {success}
            </div>
            
            {countdown > 0 && (
              <div className="text-center">
                <p>Waiting for payment confirmation...</p>
                <p className="text-sm mt-2">This window will automatically close when payment is confirmed.</p>
                <p className="text-sm mt-1">Time remaining: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="mb-2">
                Pay KES {process.env.NEXT_PUBLIC_WEB_MOVIE_PRICE || 20} to unlock this movie.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                You&apos;ll be redirected to Pesapal to complete your payment.
              </p>
              
              <label className="block text-sm font-medium mb-2">
                Your M-Pesa Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 07XX XXX XXX"
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                disabled={isSubmitting || isProcessingPayment}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter the phone number you want to use for M-Pesa payment
              </p>
            </div>
            
            {error && (
              <div className="bg-red-800 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                disabled={isSubmitting || isProcessingPayment}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors"
                disabled={isSubmitting || isProcessingPayment}
              >
                {isSubmitting || isProcessingPayment ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;