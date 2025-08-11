import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import UserProfileModal from './UserProfileModal';
import './Matches.css';

function Matches() {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matches, setMatches] = useState({
    incoming: [],
    outgoing: [],
    confirmed: []
  });
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Check if response.data has the expected structure
      if (response.data && typeof response.data === 'object') {
        if (response.data.incoming && response.data.outgoing && response.data.confirmed) {
          // New format with categorized matches
          setMatches(response.data);
        } else if (Array.isArray(response.data)) {
          // Old format - array of matches, need to categorize
          setMatches({
            incoming: [],
            outgoing: [],
            confirmed: response.data
          });
        } else {
          // Fallback to empty structure
          setMatches({
            incoming: [],
            outgoing: [],
            confirmed: []
          });
        }
      } else {
        // Fallback to empty structure
        setMatches({
          incoming: [],
          outgoing: [],
          confirmed: []
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMatches({
        incoming: [],
        outgoing: [],
        confirmed: []
      });
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    if (!matchId) {
      console.error('No match ID provided!');
      return;
    }
    try {
      await axios.post(`http://localhost:5001/api/matches/${matchId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches(); // Refresh the list
    } catch (err) {
      console.error('Error accepting match:', err.response?.data || err.message);
    }
  };

  const handleReject = async (matchId) => {
    if (!matchId) {
      console.error('No match ID provided!');
      return;
    }
    try {
      await axios.post(`http://localhost:5001/api/matches/${matchId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting match:', err.response?.data || err.message);
    }
  };

  const handleCancel = async (matchId) => {
    if (!matchId) {
      console.error('No match ID provided!');
      return;
    }
    try {
      await axios.delete(`http://localhost:5001/api/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches(); // Refresh the list
    } catch (err) {
      console.error('Error cancelling match:', err.response?.data || err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    // Refresh matches after closing modal in case status changed
    fetchMatches();
  };

  const renderUserCard = (user, type) => {
    return (
      <div key={user.match_id || user.id} className="match-card" onClick={() => openUserProfile(user.id)}>
        <div className="match-card-header">
          <div className="match-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="match-info">
            <h3>{user.name}</h3>
            <p className="match-meta">
              {user.age && `${user.age} years old`}
              {user.age && user.occupation && ' • '}
              {user.occupation}
            </p>
            {user.location && (
              <p className="match-location">
                <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.location}
              </p>
            )}
          </div>
          {type !== 'confirmed' && (
            <span className="match-time">{formatDate(user.match_created_at || user.created_at)}</span>
          )}
        </div>

        {user.bio && (
          <div className="match-bio">
            <p>{user.bio}</p>
          </div>
        )}

        <div className="match-details">
          <div className="detail-row">
            <span className="detail-label">Budget:</span>
            <span className="detail-value">
              {user.budget_min && user.budget_max ? 
                `$${user.budget_min} - $${user.budget_max}/mo` : 
                user.budget ? `$${user.budget}/mo` : 'Not specified'}
            </span>
          </div>
          {user.move_in_date && (
            <div className="detail-row">
              <span className="detail-label">Move-in:</span>
              <span className="detail-value">
                {new Date(user.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        <div className="match-preferences">
          {user.smoking && <span className="pref-badge">🚬 Smoker</span>}
          {user.pets && <span className="pref-badge">🐾 Pet Owner</span>}
          {user.night_owl && <span className="pref-badge">🦉 Night Owl</span>}
        </div>

        <div className="match-actions">
          {type === 'incoming' && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept(user.match_id);
                }}
                className="btn-accept"
              >
                <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(user.match_id);
                }}
                className="btn-reject"
              >
                <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </button>
            </>
          )}
          {type === 'outgoing' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(user.match_id);
              }}
              className="btn-cancel"
            >
              <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Request
            </button>
          )}
          {type === 'confirmed' && (
            <button className="btn-message">
              <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="matches-page">
        <Navbar />
        <div className="matches-container">
          <div className="loading-state">Loading your matches...</div>
        </div>
      </div>
    );
  }

  const currentData = matches[activeTab] || [];

  return (
    <div className="matches-page">
      <Navbar />
      <div className="matches-container">
        <div className="matches-header">
          <h1>Your Matches</h1>
          <p>Connect with your roommate matches</p>
        </div>

        <div className="matches-layout">
          <div className="main-section">
            <div className="section-header">
              <h2>Confirmed Matches</h2>
              {matches.confirmed && matches.confirmed.length > 0 && (
                <span className="count-badge">{matches.confirmed.length}</span>
              )}
            </div>
            
            {matches.confirmed && matches.confirmed.length === 0 ? (
              <div className="empty-state main-empty">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3>No confirmed matches yet</h3>
                <p>When you match with someone, they will appear here</p>
              </div>
            ) : (
              <div className="confirmed-matches-grid">
                {matches.confirmed && matches.confirmed.map(user => (
                  renderUserCard(user, 'confirmed')
                ))}
              </div>
            )}
          </div>

          <div className="side-sections">
            <div className="side-section">
              <div className="section-header">
                <h3>Pending Requests</h3>
                {matches.incoming && matches.incoming.length > 0 && (
                  <span className="count-badge alert">{matches.incoming.length}</span>
                )}
              </div>
              
              {matches.incoming && matches.incoming.length === 0 ? (
                <div className="empty-state-small">
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="request-list">
                  {matches.incoming && matches.incoming.map(user => (
                    <div key={user.match_id || user.id} className="request-item">
                      <div className="request-user" onClick={() => openUserProfile(user.id)}>
                        <div className="request-avatar">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} />
                          ) : (
                            <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="request-info">
                          <h4>{user.name}</h4>
                          <p>{user.location || 'Location not specified'}</p>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(user.match_id);
                          }}
                          className="btn-icon accept"
                          title="Accept"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(user.match_id);
                          }}
                          className="btn-icon reject"
                          title="Decline"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="side-section">
              <div className="section-header">
                <h3>Sent Requests</h3>
                {matches.outgoing && matches.outgoing.length > 0 && (
                  <span className="count-badge">{matches.outgoing.length}</span>
                )}
              </div>
              
              {matches.outgoing && matches.outgoing.length === 0 ? (
                <div className="empty-state-small">
                  <p>No sent requests</p>
                </div>
              ) : (
                <div className="request-list">
                  {matches.outgoing && matches.outgoing.map(user => (
                    <div key={user.match_id || user.id} className="request-item">
                      <div className="request-user" onClick={() => openUserProfile(user.id)}>
                        <div className="request-avatar">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} />
                          ) : (
                            <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="request-info">
                          <h4>{user.name}</h4>
                          <p>{formatDate(user.match_created_at || user.created_at)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(user.match_id);
                        }}
                        className="btn-text-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* User Profile Modal */}
      <UserProfileModal 
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

export default Matches;