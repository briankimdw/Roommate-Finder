import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import UserProfileModal from './UserProfileModal';
import './Search.css';

function Search() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    minBudget: '',
    maxBudget: '',
    location: '',
    radius: '10',
    gender: '',
    minAge: '',
    maxAge: '',
    smoking: '',
    pets: '',
    nightOwl: ''
  });
  const [showFilters, setShowFilters] = useState(true);
  const [sendingRequest, setSendingRequest] = useState({});
  const [sentRequests, setSentRequests] = useState(new Set());
  const [matchStatuses, setMatchStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAllUsers();
    fetchExistingMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out current user
      const otherUsers = response.data.filter(user => user.id !== parseInt(userId));
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setLoading(false);
    }
  };

  const fetchExistingMatches = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const statuses = {};
      
      // Mark confirmed matches
      response.data.confirmed?.forEach(match => {
        const otherUserId = match.id;
        statuses[otherUserId] = 'matched';
      });
      
      // Mark outgoing requests (sent by us)
      response.data.outgoing?.forEach(match => {
        const otherUserId = match.id;
        statuses[otherUserId] = 'requested';
        setSentRequests(prev => new Set([...prev, otherUserId]));
      });
      
      // Mark incoming requests (received by us)
      response.data.incoming?.forEach(match => {
        const otherUserId = match.id;
        statuses[otherUserId] = 'pending_incoming';
      });
      
      setMatchStatuses(statuses);
    } catch (err) {
      console.error('Error fetching existing matches:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Budget filter
    if (filters.minBudget) {
      filtered = filtered.filter(user => 
        (user.budget_min >= parseInt(filters.minBudget)) || 
        (user.budget >= parseInt(filters.minBudget))
      );
    }
    if (filters.maxBudget) {
      filtered = filtered.filter(user => 
        (user.budget_max <= parseInt(filters.maxBudget)) || 
        (user.budget <= parseInt(filters.maxBudget))
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(user => 
        user.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
      // Note: Real radius filtering would require geocoding and distance calculation
      // For now, this is a placeholder that just uses location text matching
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(user => user.gender === filters.gender);
    }

    // Age filter
    if (filters.minAge) {
      filtered = filtered.filter(user => user.age >= parseInt(filters.minAge));
    }
    if (filters.maxAge) {
      filtered = filtered.filter(user => user.age <= parseInt(filters.maxAge));
    }

    // Lifestyle filters
    if (filters.smoking !== '') {
      filtered = filtered.filter(user => user.smoking === (filters.smoking === 'yes'));
    }
    if (filters.pets !== '') {
      filtered = filtered.filter(user => user.pets === (filters.pets === 'yes'));
    }
    if (filters.nightOwl !== '') {
      filtered = filtered.filter(user => user.night_owl === (filters.nightOwl === 'yes'));
    }

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minBudget: '',
      maxBudget: '',
      location: '',
      radius: '10',
      gender: '',
      minAge: '',
      maxAge: '',
      smoking: '',
      pets: '',
      nightOwl: ''
    });
  };

  const sendMatchRequest = async (targetUserId) => {
    setSendingRequest(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      await axios.post(`http://localhost:5001/api/match-request`, {
        fromUserId: userId,
        toUserId: targetUserId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSentRequests(prev => new Set([...prev, targetUserId]));
      setSendingRequest(prev => ({ ...prev, [targetUserId]: false }));
    } catch (err) {
      console.error('Error sending match request:', err);
      setSendingRequest(prev => ({ ...prev, [targetUserId]: false }));
      
      if (err.response?.data?.error === 'Match request already exists') {
        setSentRequests(prev => new Set([...prev, targetUserId]));
      } else {
        alert('Failed to send match request');
      }
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  return (
    <div className="search-page">
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <div className="header-content">
            <h1>Find Your Perfect Roommate</h1>
            <p>Browse through {filteredUsers.length} potential roommates</p>
          </div>
          <button 
            className="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        <div className="search-content">
          {/* Filters Sidebar */}
          <div className={`filters-sidebar ${showFilters ? 'show' : 'hide'}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All
              </button>
            </div>

            <div className="filter-section">
              <label className="filter-label">Budget Range ($)</label>
              <div className="filter-row">
                <input
                  type="number"
                  name="minBudget"
                  placeholder="Min"
                  value={filters.minBudget}
                  onChange={handleFilterChange}
                  className="filter-input"
                  min="0"
                />
                <span className="filter-separator">to</span>
                <input
                  type="number"
                  name="maxBudget"
                  placeholder="Max"
                  value={filters.maxBudget}
                  onChange={handleFilterChange}
                  className="filter-input"
                  min="0"
                />
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Location</label>
              <input
                type="text"
                name="location"
                placeholder="City or neighborhood"
                value={filters.location}
                onChange={handleFilterChange}
                className="filter-input-full"
              />
              {filters.location && (
                <div className="radius-selector">
                  <label className="radius-label">Search Radius</label>
                  <div className="radius-input-group">
                    <input
                      type="range"
                      name="radius"
                      min="1"
                      max="50"
                      value={filters.radius}
                      onChange={handleFilterChange}
                      className="radius-slider"
                    />
                    <span className="radius-value">{filters.radius} miles</span>
                  </div>
                  <div className="radius-preset-buttons">
                    <button 
                      className={`radius-preset ${filters.radius === '5' ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, radius: '5' }))}
                    >
                      5 mi
                    </button>
                    <button 
                      className={`radius-preset ${filters.radius === '10' ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, radius: '10' }))}
                    >
                      10 mi
                    </button>
                    <button 
                      className={`radius-preset ${filters.radius === '25' ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, radius: '25' }))}
                    >
                      25 mi
                    </button>
                    <button 
                      className={`radius-preset ${filters.radius === '50' ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, radius: '50' }))}
                    >
                      50 mi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="filter-section">
              <label className="filter-label">Gender</label>
              <select 
                name="gender" 
                value={filters.gender} 
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Age Range</label>
              <div className="filter-row">
                <input
                  type="number"
                  name="minAge"
                  placeholder="Min"
                  value={filters.minAge}
                  onChange={handleFilterChange}
                  className="filter-input"
                  min="18"
                  max="100"
                />
                <span className="filter-separator">to</span>
                <input
                  type="number"
                  name="maxAge"
                  placeholder="Max"
                  value={filters.maxAge}
                  onChange={handleFilterChange}
                  className="filter-input"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Lifestyle Preferences</label>
              <div className="filter-options">
                <div className="filter-option">
                  <span className="option-label">Smoking</span>
                  <select 
                    name="smoking" 
                    value={filters.smoking} 
                    onChange={handleFilterChange}
                    className="option-select"
                  >
                    <option value="">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="filter-option">
                  <span className="option-label">Pets</span>
                  <select 
                    name="pets" 
                    value={filters.pets} 
                    onChange={handleFilterChange}
                    className="option-select"
                  >
                    <option value="">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="filter-option">
                  <span className="option-label">Night Owl</span>
                  <select 
                    name="nightOwl" 
                    value={filters.nightOwl} 
                    onChange={handleFilterChange}
                    className="option-select"
                  >
                    <option value="">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="filter-summary">
              <span className="summary-text">
                Showing {filteredUsers.length} of {users.length} roommates
              </span>
            </div>
          </div>

          {/* Results Grid */}
          <div className={`search-results ${!showFilters ? 'full-width' : ''}`}>
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading potential roommates...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h3>No roommates found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button onClick={clearFilters} className="btn-clear-filters">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="results-grid">
                {filteredUsers.map(user => (
                  <div key={user.id} className="user-card" onClick={() => openUserProfile(user.id)}>
                    <div className="user-card-header">
                      <div className="user-avatar">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                          </div>
                        )}
                      </div>
                      <div className="user-basic-info">
                        <h3 className="user-name" title={user.name}>
                          {truncateText(user.name, 20)}
                        </h3>
                        <p className="user-meta">
                          {user.age && `${user.age} years old`}
                          {user.age && user.gender && ' • '}
                          {user.gender}
                        </p>
                        <p className="user-occupation" title={user.occupation}>
                          {truncateText(user.occupation || 'Occupation not specified', 25)}
                        </p>
                      </div>
                    </div>

                    <div className="user-card-body">
                      {user.bio && (
                        <p className="user-bio" title={user.bio}>
                          {truncateText(user.bio, 120)}
                        </p>
                      )}
                      
                      <div className="user-details">
                        <div className="detail-item">
                          <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="detail-text">
                            {user.budget_min && user.budget_max ? 
                              `$${user.budget_min} - $${user.budget_max}/mo` : 
                              user.budget ? `$${user.budget}/mo` : 'Budget flexible'}
                          </span>
                        </div>
                        
                        {user.location && (
                          <div className="detail-item">
                            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="detail-text" title={user.location}>
                              {truncateText(user.location, 20)}
                            </span>
                          </div>
                        )}

                        {user.move_in_date && (
                          <div className="detail-item">
                            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="detail-text">
                              Move-in: {new Date(user.move_in_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="user-preferences">
                        {user.smoking && <span className="pref-tag smoking">🚬 Smoker</span>}
                        {user.pets && <span className="pref-tag pets">🐾 Has Pets</span>}
                        {user.night_owl && <span className="pref-tag night">🦉 Night Owl</span>}
                        {!user.smoking && !user.pets && !user.night_owl && (
                          <span className="pref-tag neutral">🏠 Flexible Lifestyle</span>
                        )}
                      </div>
                    </div>

                    <div className="user-card-footer">
                      {matchStatuses[user.id] === 'matched' ? (
                        <button className="btn-matched" disabled>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Matched!
                        </button>
                      ) : matchStatuses[user.id] === 'pending_incoming' ? (
                        <button className="btn-pending" disabled>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          They Requested You
                        </button>
                      ) : sentRequests.has(user.id) || matchStatuses[user.id] === 'requested' ? (
                        <button className="btn-request-sent" disabled>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Request Sent
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            sendMatchRequest(user.id);
                          }}
                          className="btn-send-request"
                          disabled={sendingRequest[user.id]}
                        >
                          {sendingRequest[user.id] ? (
                            <>
                              <div className="btn-spinner"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              Send Match Request
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default Search;