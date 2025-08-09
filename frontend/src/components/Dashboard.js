import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Dashboard.css';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
    fetchMatches();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const calculateMatches = async () => {
    try {
      await axios.post(`http://localhost:5001/api/calculate-matches/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.error || 'Error calculating matches');
    }
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-container">
        <h1>Welcome back, {profile?.name}!</h1>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Your Profile</h2>
            <div className="profile-summary">
              <p><strong>Location:</strong> {profile?.location || 'Not set'}</p>
              <p><strong>Budget:</strong> ${profile?.budget || 'Not set'}/month</p>
              <p><strong>Move-in Date:</strong> {profile?.move_in_date ? new Date(profile.move_in_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            <button onClick={() => navigate('/profile')} className="btn-secondary">
              Edit Profile
            </button>
          </div>

          <div className="dashboard-card">
            <h2>Preferences</h2>
            {profile?.user_id ? (
              <div className="preferences-summary">
                <p>✓ Preferences set</p>
                <button onClick={() => navigate('/profile')} className="btn-secondary">
                  Update Preferences
                </button>
              </div>
            ) : (
              <div>
                <p>Set your preferences to find better matches</p>
                <button onClick={() => navigate('/profile')} className="btn-primary">
                  Set Preferences
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h2>Recent Matches</h2>
            {matches.length > 0 ? (
              <div className="matches-preview">
                {matches.map((match) => (
                  <div key={match.id} className="match-item">
                    <span>{match.name}</span>
                    <span className="compatibility">
                      {match.compatibility_score ? `${Math.round(match.compatibility_score)}%` : 'N/A'}
                    </span>
                  </div>
                ))}
                <button onClick={() => navigate('/matches')} className="btn-secondary">
                  View All Matches
                </button>
              </div>
            ) : (
              <div>
                <p>No matches yet</p>
                <button onClick={calculateMatches} className="btn-primary">
                  Find Matches
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button onClick={calculateMatches} className="btn-primary">
                Calculate New Matches
              </button>
              <button onClick={() => navigate('/matches')} className="btn-secondary">
                Browse Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;