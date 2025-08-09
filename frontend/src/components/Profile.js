import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    occupation: '',
    bio: '',
    budgetMin: '',
    budgetMax: '',
    location: '',
    move_in_date: '',
    lease_duration: '',
    custom_duration: '',
    // Preferences
    smoking: false,
    pets: false,
    nightOwl: false,
    cleanlinessLevel: 3,
    guestsFrequency: 3,
    noiseLevel: 3
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        name: response.data.name || '',
        email: response.data.email || '',
        age: response.data.age || '',
        gender: response.data.gender || '',
        occupation: response.data.occupation || '',
        bio: response.data.bio || '',
        budgetMin: response.data.budget_min || response.data.budget || '',
        budgetMax: response.data.budget_max || response.data.budget || '',
        location: response.data.location || '',
        move_in_date: response.data.move_in_date || '',
        lease_duration: response.data.lease_duration || '',
        custom_duration: response.data.custom_duration || '',
        // Preferences
        smoking: response.data.smoking || false,
        pets: response.data.pets || false,
        nightOwl: response.data.night_owl || false,
        cleanlinessLevel: response.data.cleanliness_level || 3,
        guestsFrequency: response.data.guests_frequency || 3,
        noiseLevel: response.data.noise_level || 3
      });
      setShowCustomDuration(response.data.lease_duration === 'custom');
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : (type === 'range' ? parseInt(value) : value)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(
        `http://localhost:5001/api/profile/${userId}`,
        {
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          occupation: profile.occupation,
          bio: profile.bio,
          budgetMin: profile.budgetMin,
          budgetMax: profile.budgetMax,
          location: profile.location,
          move_in_date: profile.move_in_date,
          lease_duration: profile.lease_duration,
          custom_duration: profile.custom_duration,
          smoking: profile.smoking,
          pets: profile.pets,
          nightOwl: profile.nightOwl,
          cleanlinessLevel: profile.cleanlinessLevel,
          guestsFrequency: profile.guestsFrequency,
          noiseLevel: profile.noiseLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.message) {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
        fetchProfile(); // Refresh the profile data
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitial = () => {
    if (profile?.name) {
      return profile.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatGender = (gender) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <div className={`profile-page ${isEditing ? 'edit-mode' : ''}`}>
      <Navbar />
      {saveSuccess && (
        <div className="success-toast">
          <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profile updated successfully
        </div>
      )}
      <div className="profile-container">
        <div className="profile-content">
          {/* Profile Avatar Section */}
          <div className="profile-avatar-section full-width">
            <div className="profile-avatar-container">
              <div className="profile-avatar-large">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.name} />
                ) : (
                  <span>{getInitial()}</span>
                )}
              </div>
            </div>
            <div className="profile-avatar-info">
              <h2>{profile.name || 'User Name'}</h2>
              <p>{profile.email || 'email@example.com'}</p>
              <p>{profile.occupation || 'Occupation'} • {profile.age ? `${profile.age} years old` : 'Age not set'}</p>
              <div className="profile-quick-info">
                <span className="info-item">
                  {profile.budgetMin && profile.budgetMax ? 
                    `$${profile.budgetMin.toLocaleString()} - $${profile.budgetMax.toLocaleString()}/mo` : 
                    'Budget not set'}
                </span>
                <span className="info-separator">•</span>
                <span className="info-item">{profile.location || 'Location not set'}</span>
                <span className="info-separator">•</span>
                <span className="info-item">
                  {profile.move_in_date ? 
                    new Date(profile.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                    'Move-in date not set'}
                </span>
              </div>
              <span className="profile-status">Active Profile</span>
            </div>
            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    className="btn-save"
                    title="Save changes"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <svg className="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset to original values
                    }}
                    className="btn-cancel"
                    title="Cancel changes"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-edit"
                  title="Edit profile"
                >
                  <svg className="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>
          {/* Personal Information */}
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p>{profile.name || <span className="empty-field">Not provided</span>}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={profile.age}
                    onChange={handleChange}
                    placeholder="Enter your age"
                    min="18"
                    max="100"
                  />
                ) : (
                  <p>{profile.age || <span className="empty-field">Not provided</span>}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Gender</label>
                {isEditing ? (
                  <div className="custom-select-wrapper">
                    <select name="gender" value={profile.gender} onChange={handleChange} className="custom-select">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    <svg className="select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ) : (
                  <p>{formatGender(profile.gender)}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Occupation</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="occupation"
                    value={profile.occupation}
                    onChange={handleChange}
                    placeholder="Enter your occupation"
                  />
                ) : (
                  <p>{profile.occupation || <span className="empty-field">Not provided</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* Housing Details */}
          <div className="profile-section">
            <h2>Housing Details</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Budget Range (Monthly)</label>
                {isEditing ? (
                  <div className="budget-range-inputs">
                    <input
                      type="number"
                      name="budgetMin"
                      value={profile.budgetMin}
                      onChange={handleChange}
                      placeholder="Min budget"
                      min="0"
                    />
                    <span className="range-separator">to</span>
                    <input
                      type="number"
                      name="budgetMax"
                      value={profile.budgetMax}
                      onChange={handleChange}
                      placeholder="Max budget"
                      min="0"
                    />
                  </div>
                ) : (
                  <p>
                    {profile.budgetMin && profile.budgetMax ? 
                      `$${profile.budgetMin.toLocaleString()} - $${profile.budgetMax.toLocaleString()}` : 
                      <span className="empty-field">Not set</span>}
                  </p>
                )}
              </div>
              <div className="profile-field">
                <label>Preferred Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="Enter preferred location"
                  />
                ) : (
                  <p>{profile.location || <span className="empty-field">Not specified</span>}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Move-in Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="move_in_date"
                    value={profile.move_in_date}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{formatDate(profile.move_in_date)}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Lease Duration</label>
                {isEditing ? (
                  <div className="lease-duration-wrapper">
                    <div className="custom-select-wrapper">
                      <select 
                        name="lease_duration" 
                        value={profile.lease_duration || ''} 
                        onChange={(e) => {
                          handleChange(e);
                          setShowCustomDuration(e.target.value === 'custom');
                        }}
                        className="custom-select"
                      >
                        <option value="">Select duration</option>
                        <option value="1-month">1 month</option>
                        <option value="3-months">3 months</option>
                        <option value="6-months">6 months</option>
                        <option value="9-months">9 months</option>
                        <option value="12-months">12 months</option>
                        <option value="18-months">18 months</option>
                        <option value="24-months">24 months</option>
                        <option value="flexible">Flexible</option>
                        <option value="custom">Custom duration</option>
                      </select>
                      <svg className="select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {showCustomDuration && (
                      <input
                        type="text"
                        name="custom_duration"
                        value={profile.custom_duration}
                        onChange={handleChange}
                        placeholder="Enter custom duration (e.g., 15 months)"
                        className="custom-duration-input"
                      />
                    )}
                  </div>
                ) : (
                  <p>{profile.lease_duration === 'custom' ? profile.custom_duration : profile.lease_duration || <span className="empty-field">Not specified</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="profile-section">
            <h2>About Me</h2>
            <div className="profile-field profile-bio">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Tell potential roommates about yourself, your interests, lifestyle, etc."
                />
              ) : (
                <p>{profile.bio || <span className="empty-field">No bio provided yet. Add a bio to help potential roommates get to know you better.</span>}</p>
              )}
            </div>
          </div>

          {/* Living Preferences */}
          <div className="profile-section">
            <h2>Living Preferences</h2>
            
            <div className="preferences-group">
              <h3>Lifestyle Choices</h3>
              <div className="preference-cards">
                <div 
                  className={`preference-card ${profile.smoking ? 'active' : ''} ${!isEditing ? 'disabled' : ''}`}
                  onClick={() => isEditing && handleChange({ target: { name: 'smoking', type: 'checkbox', checked: !profile.smoking }})}
                >
                  <span className="preference-emoji">🚬</span>
                  <span className="preference-text">Smoking OK</span>
                  <div className="preference-check">
                    {profile.smoking ? '✓' : ''}
                  </div>
                </div>
                
                <div 
                  className={`preference-card ${profile.pets ? 'active' : ''} ${!isEditing ? 'disabled' : ''}`}
                  onClick={() => isEditing && handleChange({ target: { name: 'pets', type: 'checkbox', checked: !profile.pets }})}
                >
                  <span className="preference-emoji">🐾</span>
                  <span className="preference-text">Pet Friendly</span>
                  <div className="preference-check">
                    {profile.pets ? '✓' : ''}
                  </div>
                </div>
                
                <div 
                  className={`preference-card ${profile.nightOwl ? 'active' : ''} ${!isEditing ? 'disabled' : ''}`}
                  onClick={() => isEditing && handleChange({ target: { name: 'nightOwl', type: 'checkbox', checked: !profile.nightOwl }})}
                >
                  <span className="preference-emoji">🦉</span>
                  <span className="preference-text">Night Owl</span>
                  <div className="preference-check">
                    {profile.nightOwl ? '✓' : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="preferences-group">
              <h3>Living Habits</h3>
              <div className="habit-sliders">
                <div className="habit-slider-item">
                  <div className="habit-header">
                    <label>Cleanliness</label>
                  </div>
                  <div className="slider-wrapper">
                    <span className="slider-text-left">Relaxed</span>
                    <div className="slider-track">
                      <input
                        type="range"
                        name="cleanlinessLevel"
                        min="1"
                        max="5"
                        value={profile.cleanlinessLevel}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="habit-slider"
                      />
                      <div className="slider-fill" style={{width: `${(profile.cleanlinessLevel - 1) * 25}%`}}></div>
                    </div>
                    <span className="slider-text-right">Spotless</span>
                  </div>
                  <div className="slider-indicators">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`indicator ${profile.cleanlinessLevel >= i ? 'active' : ''}`}>●</span>
                    ))}
                  </div>
                </div>

                <div className="habit-slider-item">
                  <div className="habit-header">
                    <label>Social & Guests</label>
                  </div>
                  <div className="slider-wrapper">
                    <span className="slider-text-left">Rarely</span>
                    <div className="slider-track">
                      <input
                        type="range"
                        name="guestsFrequency"
                        min="1"
                        max="5"
                        value={profile.guestsFrequency}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="habit-slider"
                      />
                      <div className="slider-fill" style={{width: `${(profile.guestsFrequency - 1) * 25}%`}}></div>
                    </div>
                    <span className="slider-text-right">Often</span>
                  </div>
                  <div className="slider-indicators">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`indicator ${profile.guestsFrequency >= i ? 'active' : ''}`}>●</span>
                    ))}
                  </div>
                </div>

                <div className="habit-slider-item">
                  <div className="habit-header">
                    <label>Noise Level</label>
                  </div>
                  <div className="slider-wrapper">
                    <span className="slider-text-left">Quiet</span>
                    <div className="slider-track">
                      <input
                        type="range"
                        name="noiseLevel"
                        min="1"
                        max="5"
                        value={profile.noiseLevel}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="habit-slider"
                      />
                      <div className="slider-fill" style={{width: `${(profile.noiseLevel - 1) * 25}%`}}></div>
                    </div>
                    <span className="slider-text-right">Loud</span>
                  </div>
                  <div className="slider-indicators">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`indicator ${profile.noiseLevel >= i ? 'active' : ''}`}>●</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;