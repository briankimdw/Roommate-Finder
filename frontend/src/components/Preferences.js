import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Preferences.css';

function Preferences() {
  const [preferences, setPreferences] = useState({
    smoking: false,
    pets: false,
    nightOwl: false,
    cleanlinessLevel: 3,
    guestsFrequency: 3,
    noiseLevel: 3
  });
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.user_id) {
        setPreferences({
          smoking: response.data.smoking || false,
          pets: response.data.pets || false,
          nightOwl: response.data.night_owl || false,
          cleanlinessLevel: response.data.cleanliness_level || 3,
          guestsFrequency: response.data.guests_frequency || 3,
          noiseLevel: response.data.noise_level || 3
        });
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5001/api/preferences/${userId}`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Preferences saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Error saving preferences');
    }
  };

  return (
    <div className="preferences-page">
      <Navbar />
      <div className="preferences-container">
        <h1>Living Preferences</h1>
        <p className="preferences-subtitle">Help us find your perfect roommate match</p>

        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="preferences-section">
            <h2>Lifestyle Choices</h2>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="smoking"
                  checked={preferences.smoking}
                  onChange={handleChange}
                />
                <span>I smoke or don't mind smoking</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="pets"
                  checked={preferences.pets}
                  onChange={handleChange}
                />
                <span>I have pets or like pets</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="nightOwl"
                  checked={preferences.nightOwl}
                  onChange={handleChange}
                />
                <span>I'm a night owl (stay up late)</span>
              </label>
            </div>
          </div>

          <div className="preferences-section">
            <h2>Living Habits</h2>
            
            <div className="slider-group">
              <label>Cleanliness Level</label>
              <div className="slider-container">
                <span>Relaxed</span>
                <input
                  type="range"
                  name="cleanlinessLevel"
                  min="1"
                  max="5"
                  value={preferences.cleanlinessLevel}
                  onChange={handleChange}
                />
                <span>Very Clean</span>
              </div>
              <p className="slider-value">Level: {preferences.cleanlinessLevel}</p>
            </div>

            <div className="slider-group">
              <label>Guest Frequency</label>
              <div className="slider-container">
                <span>Rarely</span>
                <input
                  type="range"
                  name="guestsFrequency"
                  min="1"
                  max="5"
                  value={preferences.guestsFrequency}
                  onChange={handleChange}
                />
                <span>Often</span>
              </div>
              <p className="slider-value">Level: {preferences.guestsFrequency}</p>
            </div>

            <div className="slider-group">
              <label>Noise Tolerance</label>
              <div className="slider-container">
                <span>Quiet</span>
                <input
                  type="range"
                  name="noiseLevel"
                  min="1"
                  max="5"
                  value={preferences.noiseLevel}
                  onChange={handleChange}
                />
                <span>Lively</span>
              </div>
              <p className="slider-value">Level: {preferences.noiseLevel}</p>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Preferences;