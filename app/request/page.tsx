'use client';

import React, { useEffect, useState, useRef } from 'react';
import LayoutController from '@/components/LayoutController';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Film, 
  Calendar, 
  Clapperboard,
  MessageCircle, 
  X,
  ChevronDown, 
  Hourglass,
  Search
} from 'lucide-react';
import Image from 'next/image';
import { useMovieService } from '@/services/movie_service';
import '@/styles/RequestsPage.scss';

// Interface for movie request
interface MovieRequest {
  $id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message_type: string;
  priority: string;
  status: string;
  is_read: boolean;
  movie_title: string;
  movie_year: string;
  movie_genre: string;
  admin_response_at: string;
  content: string;
  subject: string;
  admin_response: string;
  $createdAt: string;
  $updatedAt: string;
}

// Request form interface
interface RequestFormData {
  movie_title: string;
  movie_year: string;
  movie_genre: string;
  content: string;
  subject: string;
  message_type: string;
}

// RequestPage component
export default function RequestsPage() {
  const router = useRouter();
  const { service, isInitialized } = useMovieService();
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<RequestFormData>({
    movie_title: '',
    movie_year: '',
    movie_genre: '',
    content: '',
    subject: '',
    message_type: 'movie_request'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MovieRequest | null>(null);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const detailModalRef = useRef<HTMLDivElement>(null);

  // Load user requests
  useEffect(() => {
    if (!isInitialized) return;

    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const userRequests = await service.getUserRequests();
        setRequests(userRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [isInitialized, service]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.movie_title.trim()) {
      errors.movie_title = 'Movie title is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Request details are required';
    } else if (formData.content.length < 10) {
      errors.content = 'Please provide more details (at least 10 characters)';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await service.createMovieRequest(formData);
      
      // Reset form
      setFormData({
        movie_title: '',
        movie_year: '',
        movie_genre: '',
        content: '',
        subject: '',
        message_type: 'movie_request'
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
      // Refresh requests list
      const userRequests = await service.getUserRequests();
      setRequests(userRequests);
      
      // Scroll back to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-resize the content textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [formData.content]);

  // Handle outside click for detail modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailModalRef.current && !detailModalRef.current.contains(event.target as Node)) {
        setShowRequestDetail(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open request detail modal
  const openRequestDetail = (request: MovieRequest) => {
    setSelectedRequest(request);
    setShowRequestDetail(true);
    
    // Mark as read if not already
    if (!request.is_read) {
      service.markRequestAsRead(request.$id);
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.$id === request.$id ? { ...req, is_read: true } : req
        )
      );
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    // First apply status filter
    if (filter !== 'all' && request.status !== filter) {
      return false;
    }
    
    // Then apply search filter if there's a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.movie_title?.toLowerCase().includes(query) ||
        request.subject?.toLowerCase().includes(query) ||
        request.content?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="status-badge status-new">New</span>;
      case 'in_progress':
        return <span className="status-badge status-in-progress">In Progress</span>;
      case 'completed':
        return <span className="status-badge status-completed">Completed</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">Rejected</span>;
      default:
        return <span className="status-badge status-new">New</span>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'in_progress':
        return <Hourglass className="w-5 h-5 text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <LayoutController>
      <div className="requests-page">
        <header className="requests-header">
          <div className="container mx-auto px-4 py-12">
            <div className="requests-header__content">
              <h1 className="requests-header__title">Movie Requests</h1>
              <p className="requests-header__description">
                Can&apos;t find a movie you&apos;re looking for? Submit a request and our team will try to add it to our collection.
              </p>
            </div>
          </div>
          <div className="requests-header__background">
            <div className="requests-header__overlay"></div>
            <Image 
              src="/images/cinema-bg.jpg" 
              alt="Cinema background" 
              fill 
              priority
              className="requests-header__image" 
            />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Success message */}
          {showSuccess && (
            <div className="success-alert">
              <div className="success-alert__icon">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="success-alert__content">
                <h3 className="success-alert__title">Request Submitted Successfully!</h3>
                <p className="success-alert__message">
                  Thank you for your request. Our team will review it and get back to you soon.
                </p>
              </div>
              <button 
                className="success-alert__close" 
                onClick={() => setShowSuccess(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="requests-content">
            <div className="requests-grid">
              {/* Previous Requests */}
              <div className="requests-list">
                <div className="requests-list__header">
                  <h2 className="requests-list__title">Your Requests</h2>
                  
                  <div className="requests-list__actions">
                    <div className="requests-list__search">
                      <Search className="w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="requests-list__filter">
                      <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="requests-list__content">
                  {isLoading ? (
                    <div className="requests-loading">
                      <div className="requests-loading__spinner"></div>
                      <p className="requests-loading__text">Loading your requests...</p>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    <ul className="requests-list__items">
                      {filteredRequests.map((request) => (
                        <li 
                          key={request.$id} 
                          className={`request-item ${!request.is_read ? 'request-item--unread' : ''}`}
                          onClick={() => openRequestDetail(request)}
                        >
                          <div className="request-item__content">
                            <div className="request-item__header">
                              <h3 className="request-item__title">{request.movie_title || request.subject}</h3>
                              {!request.is_read && <div className="request-item__unread-badge"></div>}
                            </div>
                            
                            <div className="request-item__meta">
                              <div className="request-item__status">
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="request-item__date">
                                {formatDate(request.$createdAt)}
                              </div>
                            </div>
                            
                            <p className="request-item__excerpt">
                              {request.content?.length > 100 
                                ? `${request.content.substring(0, 100)}...` 
                                : request.content}
                            </p>
                            
                            {request.admin_response && (
                              <div className="request-item__response-indicator">
                                <MessageCircle className="w-4 h-4" />
                                <span>Admin responded</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="request-item__icon">
                            {getStatusIcon(request.status)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="requests-empty">
                      <div className="requests-empty__icon">
                        <Film className="w-10 h-10" />
                      </div>
                      <h3 className="requests-empty__title">No requests found</h3>
                      <p className="requests-empty__message">
                        {searchQuery || filter !== 'all' 
                          ? 'Try changing your search or filter' 
                          : 'You haven\'t made any movie requests yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* New Request Form */}
              <div className="request-form">
                <div className="request-form__header">
                  <h2 className="request-form__title">Request a Movie</h2>
                  <p className="request-form__subtitle">
                    Fill out the form below to request a movie you&apos;d like to see on our platform
                  </p>
                </div>

                <form ref={formRef} className="request-form__content" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">
                      Movie Title <span className="text-red-500">*</span>
                    </label>
                    <div className="form-input-wrapper">
                      <Film className="form-input-icon" />
                      <input
                        type="text"
                        name="movie_title"
                        placeholder="Enter movie title"
                        value={formData.movie_title}
                        onChange={handleInputChange}
                        className={`form-input ${formErrors.movie_title ? 'form-input--error' : ''}`}
                      />
                    </div>
                    {formErrors.movie_title && (
                      <p className="form-error">{formErrors.movie_title}</p>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Release Year</label>
                      <div className="form-input-wrapper">
                        <Calendar className="form-input-icon" />
                        <input
                          type="text"
                          name="movie_year"
                          placeholder="E.g. 2023"
                          value={formData.movie_year}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Genre</label>
                      <div className="form-input-wrapper">
                        <Clapperboard className="form-input-icon" />
                        <input
                          type="text"
                          name="movie_genre"
                          placeholder="E.g. Action, Comedy"
                          value={formData.movie_genre}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="form-input-wrapper">
                      <MessageCircle className="form-input-icon" />
                      <input
                        type="text"
                        name="subject"
                        placeholder="Brief subject of your request"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`form-input ${formErrors.subject ? 'form-input--error' : ''}`}
                      />
                    </div>
                    {formErrors.subject && (
                      <p className="form-error">{formErrors.subject}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Request Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      ref={contentRef}
                      name="content"
                      placeholder="Please provide any additional details about the movie you're requesting..."
                      value={formData.content}
                      onChange={handleInputChange}
                      className={`form-textarea ${formErrors.content ? 'form-textarea--error' : ''}`}
                      rows={4}
                    />
                    {formErrors.content && (
                      <p className="form-error">{formErrors.content}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Request Type</label>
                    <div className="request-type-selector">
                      <div
                        className={`request-type-option ${formData.message_type === 'movie_request' ? 'request-type-option--active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, message_type: 'movie_request' }))}
                      >
                        <Film className="w-5 h-5" />
                        <span>Movie Request</span>
                      </div>
                      <div
                        className={`request-type-option ${formData.message_type === 'series_request' ? 'request-type-option--active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, message_type: 'series_request' }))}
                      >
                        <Clapperboard className="w-5 h-5" />
                        <span>TV Series</span>
                      </div>
                      <div
                        className={`request-type-option ${formData.message_type === 'other' ? 'request-type-option--active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, message_type: 'other' }))}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Other</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="request-form__submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Request Detail Modal */}
        {showRequestDetail && selectedRequest && (
          <div className="request-modal">
            <div className="request-modal__overlay" onClick={() => setShowRequestDetail(false)}></div>
            <div className="request-modal__container" ref={detailModalRef}>
              <div className="request-modal__header">
                <h2 className="request-modal__title">Request Details</h2>
                <button className="request-modal__close" onClick={() => setShowRequestDetail(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="request-modal__content">
                <div className="request-modal__info">
                  <div className="request-modal__status">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="request-modal__date">
                      {formatDate(selectedRequest.$createdAt)}
                    </span>
                  </div>

                  <h3 className="request-modal__movie-title">
                    {selectedRequest.movie_title || 'No title provided'}
                  </h3>

                  <div className="request-modal__details">
                    {selectedRequest.movie_year && (
                      <div className="request-modal__detail">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedRequest.movie_year}</span>
                      </div>
                    )}
                    {selectedRequest.movie_genre && (
                      <div className="request-modal__detail">
                        <Clapperboard className="w-4 h-4" />
                        <span>{selectedRequest.movie_genre}</span>
                      </div>
                    )}
                    <div className="request-modal__detail">
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {selectedRequest.message_type === 'movie_request' 
                          ? 'Movie Request' 
                          : selectedRequest.message_type === 'series_request'
                            ? 'TV Series Request'
                            : 'Other Request'}
                      </span>
                    </div>
                  </div>

                  <div className="request-modal__subject">
                    <h4>Subject:</h4>
                    <p>{selectedRequest.subject}</p>
                  </div>

                  <div className="request-modal__message">
                    <h4>Your Request:</h4>
                    <p>{selectedRequest.content}</p>
                  </div>
                </div>

                {/* Admin Response */}
                {selectedRequest.admin_response ? (
                  <div className="admin-response">
                    <div className="admin-response__header">
                      <div className="admin-response__avatar">
                        <Image 
                          src="/images/admin-avatar.jpg" 
                          alt="Admin" 
                          width={40} 
                          height={40} 
                        />
                      </div>
                      <div className="admin-response__info">
                        <h4 className="admin-response__title">Admin Response</h4>
                        <p className="admin-response__date">
                          {selectedRequest.admin_response_at 
                            ? formatDate(selectedRequest.admin_response_at)
                            : formatDate(selectedRequest.$updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="admin-response__content">
                      <p>{selectedRequest.admin_response}</p>
                    </div>
                  </div>
                ) : (
                  <div className="admin-response admin-response--pending">
                    <div className="admin-response__pending-icon">
                      <Clock className="w-10 h-10" />
                    </div>
                    <h4 className="admin-response__pending-title">Awaiting Response</h4>
                    <p className="admin-response__pending-text">
                      Our team hasn&apos;t responded to your request yet. 
                      We&apos;ll notify you when we have an update.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutController>
  );
}