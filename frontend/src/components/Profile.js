import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    occupation: '',
    bio: '',
    budget: '',
    location: '',
    move_in_date: ''
  });
  const [isEditing, setIsEditing] = useState(false);
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
        age: response.data.age || '',
        gender: response.data.gender || '',
        occupation: response.data.occupation || '',
        bio: response.data.bio || '',
        budget: response.data.budget || '',
        location: response.data.location || '',
        move_in_date: response.data.move_in_date || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    alert('Profile update feature coming soon!');
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="btn-primary"
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile.name}</p>
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
                  />
                ) : (
                  <p>{profile.age}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Gender</label>
                {isEditing ? (
                  <select name="gender" value={profile.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p>{profile.gender}</p>
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
                  />
                ) : (
                  <p>{profile.occupation}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>About Me</h2>
            <div className="profile-field">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows="4"
                />
              ) : (
                <p>{profile.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Housing Details</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Monthly Budget</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="budget"
                    value={profile.budget}
                    onChange={handleChange}
                  />
                ) : (
                  <p>${profile.budget}</p>
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
                  />
                ) : (
                  <p>{profile.location}</p>
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
                  <p>{profile.move_in_date ? new Date(profile.move_in_date).toLocaleDateString() : 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;