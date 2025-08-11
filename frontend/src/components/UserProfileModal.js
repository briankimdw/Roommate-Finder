import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfileModal.css';

function UserProfileModal({ userId, isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [matchStatus, setMatchStatus] = useState(null);
  
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
      checkMatchStatus();
    }
  }, [userId, isOpen]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setLoading(false);
    }
  };

  const checkMatchStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/matches/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check in confirmed matches (already matched)
      const confirmedMatch = response.data.confirmed?.find(match => 
        match.id === parseInt(userId)
      );
      
      if (confirmedMatch) {
        setMatchStatus('accepted');
        setRequestSent(true);
        return;
      }
      
      // Check in outgoing requests (we sent them a request)
      const outgoingMatch = response.data.outgoing?.find(match => 
        match.id === parseInt(userId)
      );
      
      if (outgoingMatch) {
        setMatchStatus('pending');
        setRequestSent(true);
        return;
      }
      
      // Check in incoming requests (they sent us a request)
      const incomingMatch = response.data.incoming?.find(match => 
        match.id === parseInt(userId)
      );
      
      if (incomingMatch) {
        setMatchStatus('pending_incoming');
        setRequestSent(false);
        return;
      }
      
      // No existing match
      setMatchStatus(null);
      setRequestSent(false);
    } catch (err) {
      console.error('Error checking match status:', err);
    }
  };

  const sendMatchRequest = async () => {
    setSendingRequest(true);
    try {
      await axios.post(`http://localhost:5001/api/match-request`, {
        fromUserId: currentUserId,
        toUserId: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequestSent(true);
      setMatchStatus('pending');
      setSendingRequest(false);
    } catch (err) {
      console.error('Error sending match request:', err);
      setSendingRequest(false);
      if (err.response?.data?.error === 'Match request already exists') {
        setRequestSent(true);
        setMatchStatus('pending');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!isOpen) return null;

  // Prevent closing when clicking inside the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={handleModalClick}>
        <button className="modal-close" onClick={onClose}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : user ? (
          <div className="modal-content">
            {/* Header Section */}
            <div className="modal-header">
              <div className="modal-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
              
              <div className="modal-header-info">
                <h2>{user.name}</h2>
                <div className="modal-meta">
                  {user.age && <span>{user.age} years old</span>}
                  {user.gender && <span> • {user.gender}</span>}
                  {user.location && <span> • {user.location}</span>}
                </div>
                <div className="modal-occupation">
                  {user.occupation || 'Occupation not specified'}
                </div>
              </div>

              <div className="modal-action">
                {matchStatus === 'accepted' ? (
                  <button className="btn-matched" disabled>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Matched!
                  </button>
                ) : matchStatus === 'pending_incoming' ? (
                  <button className="btn-pending-incoming" disabled>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    They Requested You
                  </button>
                ) : requestSent ? (
                  <button className="btn-request-sent" disabled>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Request Sent
                  </button>
                ) : (
                  <button 
                    className="btn-send-match"
                    onClick={sendMatchRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <>
                        <div className="btn-spinner"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Send Request
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="modal-section">
                <h3>About Me</h3>
                <p className="bio-text">{user.bio}</p>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="modal-columns">
              {/* Housing Preferences */}
              <div className="modal-column">
                <h3>Housing Preferences</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Budget</span>
                    <span className="info-value">
                      {user.budget_min && user.budget_max ? 
                        `$${user.budget_min} - $${user.budget_max}/mo` : 
                        user.budget ? `$${user.budget}/mo` : 'Flexible'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{user.location || 'Flexible'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Move-in</span>
                    <span className="info-value">{formatDate(user.move_in_date)}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Lease</span>
                    <span className="info-value">
                      {user.lease_duration === 'custom' && user.custom_duration ? 
                        user.custom_duration : 
                        user.lease_duration ? `${user.lease_duration} months` : 'Flexible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <div className="modal-column">
                <h3>Lifestyle</h3>
                
                <div className="lifestyle-badges">
                  <div className={`badge ${user.smoking ? 'badge-yes' : 'badge-no'}`}>
                    {user.smoking ? '🚬 Smoker' : '🚭 Non-Smoker'}
                  </div>
                  <div className={`badge ${user.pets ? 'badge-yes' : 'badge-no'}`}>
                    {user.pets ? '🐾 Has Pets' : '🚫 No Pets'}
                  </div>
                  <div className={`badge ${user.night_owl ? 'badge-yes' : 'badge-no'}`}>
                    {user.night_owl ? '🦉 Night Owl' : '☀️ Early Bird'}
                  </div>
                </div>

                <div className="preference-scales">
                  <div className="scale-item">
                    <div className="scale-header">
                      <span>Cleanliness</span>
                      <span className="scale-value">
                        {user.cleanliness_level || 3}/5
                      </span>
                    </div>
                    <div className="scale-bar">
                      <div 
                        className="scale-fill"
                        style={{ width: `${(user.cleanliness_level || 3) * 20}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="scale-item">
                    <div className="scale-header">
                      <span>Guests</span>
                      <span className="scale-value">
                        {user.guests_frequency || 3}/5
                      </span>
                    </div>
                    <div className="scale-bar">
                      <div 
                        className="scale-fill"
                        style={{ width: `${(user.guests_frequency || 3) * 20}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="scale-item">
                    <div className="scale-header">
                      <span>Noise Level</span>
                      <span className="scale-value">
                        {user.noise_level || 3}/5
                      </span>
                    </div>
                    <div className="scale-bar">
                      <div 
                        className="scale-fill"
                        style={{ width: `${(user.noise_level || 3) * 20}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            {matchStatus === 'accepted' && (
              <div className="modal-contact">
                <div className="contact-matched">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>You're matched! Contact information is now available.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-error">
            <p>Unable to load profile</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal;