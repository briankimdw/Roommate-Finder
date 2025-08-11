import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: '',
    occupation: '',
    bio: '',
    budget_min: '',
    budget_max: '',
    location: '',
    move_in_date: '',
    lease_duration: '12'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'email':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'name':
        if (value.length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      case 'age':
        if (value < 18 || value > 100) {
          error = 'Age must be between 18 and 100';
        }
        break;
      case 'budget_min':
        if (value && formData.budget_max && parseInt(value) > parseInt(formData.budget_max)) {
          error = 'Minimum budget cannot exceed maximum budget';
        }
        break;
      case 'budget_max':
        if (value && formData.budget_min && parseInt(value) < parseInt(formData.budget_min)) {
          error = 'Maximum budget cannot be less than minimum budget';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  const checkPasswordStrength = (password) => {
    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password)) {
      setPasswordStrength('medium');
    } else if (password.length >= 10 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('medium');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    // Validate on change for better UX
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Please select your gender';
    if (!formData.occupation) newErrors.occupation = 'Occupation is required';
    if (!formData.budget_min) newErrors.budget_min = 'Minimum budget is required';
    if (!formData.budget_max) newErrors.budget_max = 'Maximum budget is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.move_in_date) newErrors.move_in_date = 'Move-in date is required';
    
    // Additional validation
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.error-alert');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        moveInDate: formData.move_in_date // Convert to camelCase for backend
      };
      delete submitData.confirmPassword; // Don't send confirmPassword to backend
      delete submitData.move_in_date; // Remove snake_case version
      
      const response = await axios.post('http://localhost:5001/api/register', submitData);
      
      // Store auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      
      // Navigate to dashboard
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setLoading(false);
      setErrors({
        submit: err.response?.data?.error || 'Registration failed. Please try again.'
      });
      
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Join Roommate Finder</h1>
          <p>Find your perfect roommate match</p>
        </div>
        
        <form className="register-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="error-alert">
              <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.submit}
            </div>
          )}
          
          {/* Account Information */}
          <div className="form-section">
            <h2 className="section-title">Account Information</h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Email Address
                  <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
                {errors.email && <span className="input-hint" style={{color: '#dc3545'}}>{errors.email}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Password
                  <span className="required-star">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                />
                {formData.password && (
                  <div className="password-strength">
                    <div className={`strength-bars strength-${passwordStrength}`}>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                    </div>
                    <span className="strength-text">
                      Password strength: {passwordStrength}
                    </span>
                  </div>
                )}
                {errors.password && <span className="input-hint" style={{color: '#dc3545'}}>{errors.password}</span>}
              </div>
              
              <div className="form-field full-width">
                <label className="form-label">
                  Confirm Password
                  <span className="required-star">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && <span className="input-hint" style={{color: '#dc3545'}}>{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>
          
          {/* Personal Information */}
          <div className="form-section">
            <h2 className="section-title">Personal Information</h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Full Name
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
                {errors.name && <span className="input-hint" style={{color: '#dc3545'}}>{errors.name}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Age
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  placeholder="25"
                />
                {errors.age && <span className="input-hint" style={{color: '#dc3545'}}>{errors.age}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Gender
                  <span className="required-star">*</span>
                </label>
                <div className="gender-options">
                  <div className="gender-option">
                    <input
                      type="radio"
                      id="male"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                    />
                    <label htmlFor="male" className="gender-label">Male</label>
                  </div>
                  <div className="gender-option">
                    <input
                      type="radio"
                      id="female"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                    />
                    <label htmlFor="female" className="gender-label">Female</label>
                  </div>
                  <div className="gender-option">
                    <input
                      type="radio"
                      id="other"
                      name="gender"
                      value="other"
                      checked={formData.gender === 'other'}
                      onChange={handleChange}
                    />
                    <label htmlFor="other" className="gender-label">Other</label>
                  </div>
                </div>
                {errors.gender && <span className="input-hint" style={{color: '#dc3545'}}>{errors.gender}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Occupation
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="occupation"
                  className="form-input"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                />
                {errors.occupation && <span className="input-hint" style={{color: '#dc3545'}}>{errors.occupation}</span>}
              </div>
              
              <div className="form-field full-width">
                <label className="form-label">
                  Bio
                  <span className="input-hint" style={{marginLeft: '0.5rem', fontWeight: 'normal'}}>(Optional)</span>
                </label>
                <textarea
                  name="bio"
                  className="form-textarea"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell potential roommates about yourself, your interests, lifestyle, etc."
                />
                <span className="input-hint">
                  {formData.bio.length}/500 characters
                </span>
              </div>
            </div>
          </div>
          
          {/* Housing Preferences */}
          <div className="form-section">
            <h2 className="section-title">Housing Preferences</h2>
            <div className="form-grid">
              <div className="form-field full-width">
                <label className="form-label">
                  Monthly Budget Range
                  <span className="required-star">*</span>
                </label>
                <div className="budget-inputs">
                  <input
                    type="number"
                    name="budget_min"
                    className="form-input"
                    value={formData.budget_min}
                    onChange={handleChange}
                    min="0"
                    placeholder="Min ($)"
                  />
                  <span className="budget-separator">to</span>
                  <input
                    type="number"
                    name="budget_max"
                    className="form-input"
                    value={formData.budget_max}
                    onChange={handleChange}
                    min="0"
                    placeholder="Max ($)"
                  />
                </div>
                {(errors.budget_min || errors.budget_max) && (
                  <span className="input-hint" style={{color: '#dc3545'}}>
                    {errors.budget_min || errors.budget_max}
                  </span>
                )}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Preferred Location
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City or neighborhood"
                />
                {errors.location && <span className="input-hint" style={{color: '#dc3545'}}>{errors.location}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Move-in Date
                  <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  name="move_in_date"
                  className="form-input"
                  value={formData.move_in_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.move_in_date && <span className="input-hint" style={{color: '#dc3545'}}>{errors.move_in_date}</span>}
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  Lease Duration
                </label>
                <select
                  name="lease_duration"
                  className="form-select"
                  value={formData.lease_duration}
                  onChange={handleChange}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="custom">Other</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;