import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Dashboard.css';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [matchData, setMatchData] = useState({
    confirmed: [],
    incoming: [],
    outgoing: [],
    total: 0
  });
  const [stats, setStats] = useState({
    profileCompletion: 0,
    newRequests: 0,
    totalMatches: 0,
    pendingResponses: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileResponse = await axios.get(`http://localhost:5001/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileResponse.data);
      
      // Calculate profile completion
      const profileFields = ['name', 'age', 'gender', 'occupation', 'bio', 'location', 'budget_min', 'budget_max', 'move_in_date'];
      const completedFields = profileFields.filter(field => profileResponse.data[field]);
      const completion = Math.round((completedFields.length / profileFields.length) * 100);
      
      // Fetch matches
      const matchesResponse = await axios.get(`http://localhost:5001/api/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const confirmed = matchesResponse.data.confirmed || [];
      const incoming = matchesResponse.data.incoming || [];
      const outgoing = matchesResponse.data.outgoing || [];
      
      setMatchData({
        confirmed,
        incoming,
        outgoing,
        total: confirmed.length + incoming.length + outgoing.length
      });
      
      // Calculate stats
      setStats({
        profileCompletion: completion,
        newRequests: incoming.length,
        totalMatches: confirmed.length,
        pendingResponses: outgoing.length
      });
      
      // Create recent activity
      const activities = [];
      
      incoming.slice(0, 2).forEach(match => {
        activities.push({
          type: 'incoming',
          message: `${match.name} sent you a match request`,
          time: match.match_created_at || match.created_at,
          userId: match.id
        });
      });
      
      confirmed.slice(0, 2).forEach(match => {
        activities.push({
          type: 'confirmed',
          message: `You matched with ${match.name}`,
          time: match.responded_at || match.created_at,
          userId: match.id
        });
      });
      
      // Sort by time and take most recent
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activities.slice(0, 5));
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>{getGreeting()}, {profile?.name || 'there'}!</h1>
          <p className="welcome-subtitle">Here's your roommate matching overview</p>
        </div>
        
        {/* Stats Cards Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon profile-icon">👤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.profileCompletion}%</div>
              <div className="stat-label">Profile Complete</div>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => navigate('/matches')}>
            <div className="stat-icon matches-icon">🤝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalMatches}</div>
              <div className="stat-label">Confirmed Matches</div>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => navigate('/matches')}>
            <div className="stat-icon requests-icon">📨</div>
            <div className="stat-content">
              <div className="stat-value">{stats.newRequests}</div>
              <div className="stat-label">New Requests</div>
              {stats.newRequests > 0 && <span className="badge-new">NEW</span>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pendingResponses}</div>
              <div className="stat-label">Pending Responses</div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-main-grid">
          {/* Left Column */}
          <div className="dashboard-left">
            {/* Profile Overview Card */}
            <div className="dashboard-card profile-card">
              <div className="card-header">
                <h2>Profile Overview</h2>
                <button onClick={() => navigate('/profile')} className="btn-edit">Edit</button>
              </div>
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">📍 Location</span>
                  <span className="profile-value">{profile?.location || 'Not set'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">💰 Budget Range</span>
                  <span className="profile-value">
                    {profile?.budget_min && profile?.budget_max 
                      ? `$${profile.budget_min} - $${profile.budget_max}/mo`
                      : 'Not set'}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">📅 Move-in Date</span>
                  <span className="profile-value">
                    {profile?.move_in_date 
                      ? new Date(profile.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Flexible'}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">📋 Lease Duration</span>
                  <span className="profile-value">
                    {profile?.lease_duration === 'custom' && profile?.custom_duration
                      ? profile.custom_duration
                      : profile?.lease_duration || 'Not specified'}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">💼 Occupation</span>
                  <span className="profile-value">{profile?.occupation || 'Not specified'}</span>
                </div>
              </div>
              
              {stats.profileCompletion < 100 && (
                <div className="completion-alert">
                  <p>Complete your profile to get better matches!</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${stats.profileCompletion}%`}}></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Actions Card */}
            <div className="dashboard-card actions-card">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button onClick={() => navigate('/search')} className="action-btn primary">
                  <span className="action-icon">🔍</span>
                  <div className="action-content">
                    <div className="action-title">Find Roommates</div>
                    <div className="action-desc">Browse and connect with potential roommates</div>
                  </div>
                </button>
                <button onClick={() => navigate('/matches')} className="action-btn">
                  <span className="action-icon">🤝</span>
                  <div className="action-content">
                    <div className="action-title">View Matches</div>
                    <div className="action-desc">Manage requests and confirmed matches</div>
                  </div>
                </button>
                <button onClick={() => navigate('/profile')} className="action-btn">
                  <span className="action-icon">👤</span>
                  <div className="action-content">
                    <div className="action-title">Edit Profile</div>
                    <div className="action-desc">Update your preferences and information</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="dashboard-right">
            {/* Recent Activity Card */}
            <div className="dashboard-card activity-card">
              <div className="card-header">
                <h2>Recent Activity</h2>
                {recentActivity.length > 0 && (
                  <button onClick={() => navigate('/matches')} className="btn-text">View All</button>
                )}
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className={`activity-item ${activity.type}`}>
                      <div className="activity-icon">
                        {activity.type === 'incoming' ? '📥' : '✅'}
                      </div>
                      <div className="activity-content">
                        <p className="activity-message">{activity.message}</p>
                        <span className="activity-time">{formatDate(activity.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div>
                    <p>No recent activity yet</p>
                    <p style={{fontSize: '0.85rem', marginTop: '0.25rem', color: '#a0aec0'}}>Start searching to find your perfect roommate!</p>
                  </div>
                  <button onClick={() => navigate('/search')} className="btn-start-search">
                    Start Searching
                  </button>
                </div>
              )}
            </div>
            
            {/* Match Requests Summary */}
            {(matchData.incoming.length > 0 || matchData.outgoing.length > 0) && (
              <div className="dashboard-card requests-card">
                <h2>Match Requests</h2>
                
                {matchData.incoming.length > 0 && (
                  <div className="request-section">
                    <h3>📥 Awaiting Your Response ({matchData.incoming.length})</h3>
                    <div className="request-list">
                      {matchData.incoming.slice(0, 3).map(match => (
                        <div key={match.match_id} className="request-item">
                          <div className="request-info">
                            <span className="request-name">{match.name}</span>
                            <span className="request-location">{match.location}</span>
                          </div>
                          <button 
                            onClick={() => navigate('/matches')} 
                            className="btn-respond"
                          >
                            Respond
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {matchData.outgoing.length > 0 && (
                  <div className="request-section">
                    <h3>📤 Sent Requests ({matchData.outgoing.length})</h3>
                    <div className="request-list">
                      {matchData.outgoing.slice(0, 3).map(match => (
                        <div key={match.match_id} className="request-item">
                          <div className="request-info">
                            <span className="request-name">{match.name}</span>
                            <span className="request-status pending">Pending</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button onClick={() => navigate('/matches')} className="btn-view-all">
                  Manage All Requests →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;