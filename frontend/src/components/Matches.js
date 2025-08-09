import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './Matches.css';

function Matches() {
  const [matches, setMatches] = useState([]);
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
      setMatches(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    try {
      await axios.post(`http://localhost:5001/api/matches/${matchId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches();
    } catch (err) {
      alert('Error accepting match');
    }
  };

  const handleReject = async (matchId) => {
    try {
      await axios.post(`http://localhost:5001/api/matches/${matchId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches();
    } catch (err) {
      alert('Error rejecting match');
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

  if (loading) {
    return (
      <div className="matches-page">
        <Navbar />
        <div className="matches-container">
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <Navbar />
      <div className="matches-container">
        <div className="matches-header">
          <h1>Your Matches</h1>
          <button onClick={calculateMatches} className="btn-primary">
            Refresh Matches
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matches found yet.</p>
            <p>Make sure you've set your preferences and try calculating matches.</p>
            <button onClick={calculateMatches} className="btn-primary">
              Calculate Matches Now
            </button>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <h3>{match.name}</h3>
                  <span className="compatibility-badge">
                    {match.compatibility_score ? `${Math.round(match.compatibility_score)}% Match` : 'N/A'}
                  </span>
                </div>
                
                <div className="match-details">
                  <p><strong>Age:</strong> {match.age}</p>
                  <p><strong>Gender:</strong> {match.gender}</p>
                  <p><strong>Occupation:</strong> {match.occupation}</p>
                  <p><strong>Location:</strong> {match.location}</p>
                  <p><strong>Budget:</strong> ${match.budget}/month</p>
                  <p><strong>Move-in:</strong> {match.move_in_date ? new Date(match.move_in_date).toLocaleDateString() : 'Flexible'}</p>
                </div>

                {match.bio && (
                  <div className="match-bio">
                    <p><strong>About:</strong></p>
                    <p>{match.bio}</p>
                  </div>
                )}

                <div className="match-preferences">
                  <h4>Lifestyle</h4>
                  <div className="preference-tags">
                    {match.smoking && <span className="tag">Smoker</span>}
                    {match.pets && <span className="tag">Pet Owner</span>}
                    {match.night_owl && <span className="tag">Night Owl</span>}
                    {!match.smoking && !match.pets && !match.night_owl && match.user_id && 
                      <span className="tag">No specific preferences</span>
                    }
                  </div>
                </div>

                <div className="match-actions">
                  {match.status === 'accepted' ? (
                    <span className="status-accepted">✓ Accepted</span>
                  ) : match.status === 'rejected' ? (
                    <span className="status-rejected">✗ Rejected</span>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleReject(match.match_id)}
                        className="btn-secondary"
                      >
                        Pass
                      </button>
                      <button 
                        onClick={() => handleAccept(match.match_id)}
                        className="btn-primary"
                      >
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;