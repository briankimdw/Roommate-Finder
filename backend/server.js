const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'content-type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// Initialize database
let db;
database.init().then(database => {
  db = database;
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register endpoint with retry logic
app.post('/api/register', async (req, res) => {
  const { email, password, name, age, gender, occupation, bio, budget, budget_min, budget_max, location, moveInDate, lease_duration } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    database.runWithRetry(
      `INSERT INTO users (email, password, name, age, gender, occupation, bio, budget, budget_min, budget_max, location, move_in_date, lease_duration) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, age, gender, occupation, bio, budget || null, budget_min, budget_max, location, moveInDate, lease_duration],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          console.error('Registration error:', err);
          return res.status(500).json({ error: 'Registration failed. Please try again.' });
        }
        
        const token = jwt.sign(
          { id: this.lastID, email }, 
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        // Create default preferences for the user
        database.runWithRetry(
          `INSERT INTO preferences (user_id, smoking, pets, night_owl, cleanliness_level, guests_frequency, noise_level)
           VALUES (?, 0, 0, 0, 3, 3, 3)`,
          [this.lastID],
          (prefErr) => {
            if (prefErr) {
              console.error('Error creating default preferences:', prefErr);
            }
          }
        );
        
        res.json({ token, userId: this.lastID });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login endpoint with retry logic
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  database.getWithRetry('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({ token, userId: user.id });
  });
});

// Get profile with retry logic
app.get('/api/profile/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  
  database.getWithRetry(
    `SELECT u.*, p.* FROM users u 
     LEFT JOIN preferences p ON u.id = p.user_id 
     WHERE u.id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        console.error('Profile fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      delete row.password;
      res.json(row);
    }
  );
});

// Update profile with retry logic
app.put('/api/profile/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const { 
    name, age, gender, occupation, bio, 
    budgetMin, budgetMax, location, move_in_date, lease_duration,
    smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel 
  } = req.body;
  
  // Update user profile
  database.runWithRetry(
    `UPDATE users SET 
     name = ?, age = ?, gender = ?, occupation = ?, bio = ?,
     budget_min = ?, budget_max = ?, location = ?, move_in_date = ?, lease_duration = ?
     WHERE id = ?`,
    [name, age, gender, occupation, bio, budgetMin, budgetMax, location, move_in_date, lease_duration, userId],
    (err) => {
      if (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      
      // Check if preferences exist
      database.getWithRetry('SELECT id FROM preferences WHERE user_id = ?', [userId], (err, existing) => {
        if (err) {
          console.error('Preferences check error:', err);
          return res.status(500).json({ error: 'Failed to update preferences' });
        }
        
        if (existing) {
          // Update existing preferences
          database.runWithRetry(
            `UPDATE preferences SET 
             smoking = ?, pets = ?, night_owl = ?, cleanliness_level = ?, guests_frequency = ?, noise_level = ?
             WHERE user_id = ?`,
            [smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel, userId],
            (err) => {
              if (err) {
                console.error('Preferences update error:', err);
                return res.status(500).json({ error: 'Failed to update preferences' });
              }
              res.json({ message: 'Profile updated successfully' });
            }
          );
        } else {
          // Insert new preferences
          database.runWithRetry(
            `INSERT INTO preferences (user_id, smoking, pets, night_owl, cleanliness_level, guests_frequency, noise_level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel],
            (err) => {
              if (err) {
                console.error('Preferences insert error:', err);
                return res.status(500).json({ error: 'Failed to update preferences' });
              }
              res.json({ message: 'Profile updated successfully' });
            }
          );
        }
      });
    }
  );
});

// Get all users with retry logic
app.get('/api/users', authenticateToken, (req, res) => {
  database.allWithRetry(
    `SELECT u.*, p.* FROM users u 
     LEFT JOIN preferences p ON u.id = p.user_id 
     ORDER BY u.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Users fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      
      // Remove passwords from results
      const users = rows.map(user => {
        delete user.password;
        return user;
      });
      
      res.json(users);
    }
  );
});

// Get matches with categorization
app.get('/api/matches/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  // Get incoming requests (others requesting to match with current user)
  database.allWithRetry(
    `SELECT m.id as match_id, m.from_user_id, m.to_user_id, m.status, m.created_at as match_created_at,
            u.id, u.email, u.name, u.age, u.gender, u.occupation, u.bio, 
            u.budget_min, u.budget_max, u.location, u.move_in_date, u.lease_duration, u.custom_duration,
            p.smoking, p.pets, p.night_owl, p.cleanliness_level, p.guests_frequency, p.noise_level
     FROM matches m 
     JOIN users u ON m.from_user_id = u.id 
     LEFT JOIN preferences p ON u.id = p.user_id 
     WHERE m.to_user_id = ? AND m.status = 'pending'`,
    [userId],
    (err, incoming) => {
      if (err) {
        console.error('Incoming matches error:', err);
        return res.status(500).json({ error: 'Failed to fetch matches' });
      }
      
      // Get outgoing requests (current user's requests to others)
      database.allWithRetry(
        `SELECT m.id as match_id, m.from_user_id, m.to_user_id, m.status, m.created_at as match_created_at,
                u.id, u.email, u.name, u.age, u.gender, u.occupation, u.bio, 
                u.budget_min, u.budget_max, u.location, u.move_in_date, u.lease_duration, u.custom_duration,
                p.smoking, p.pets, p.night_owl, p.cleanliness_level, p.guests_frequency, p.noise_level
         FROM matches m 
         JOIN users u ON m.to_user_id = u.id 
         LEFT JOIN preferences p ON u.id = p.user_id 
         WHERE m.from_user_id = ? AND m.status = 'pending'`,
        [userId],
        (err, outgoing) => {
          if (err) {
            console.error('Outgoing matches error:', err);
            return res.status(500).json({ error: 'Failed to fetch matches' });
          }
          
          // Get confirmed matches
          database.allWithRetry(
            `SELECT m.id as match_id, m.from_user_id, m.to_user_id, m.status, m.created_at as match_created_at,
                    u.id, u.email, u.name, u.age, u.gender, u.occupation, u.bio, 
                    u.budget_min, u.budget_max, u.location, u.move_in_date, u.lease_duration, u.custom_duration,
                    p.smoking, p.pets, p.night_owl, p.cleanliness_level, p.guests_frequency, p.noise_level
             FROM matches m 
             JOIN users u ON (
               CASE 
                 WHEN m.from_user_id = ? THEN m.to_user_id = u.id 
                 ELSE m.from_user_id = u.id 
               END
             )
             LEFT JOIN preferences p ON u.id = p.user_id 
             WHERE (m.from_user_id = ? OR m.to_user_id = ?) AND m.status = 'accepted'`,
            [userId, userId, userId],
            (err, confirmed) => {
              if (err) {
                console.error('Confirmed matches error:', err);
                return res.status(500).json({ error: 'Failed to fetch matches' });
              }
              
              // Clean up password fields
              const cleanData = (data) => data.map(item => {
                delete item.password;
                return item;
              });
              
              res.json({
                incoming: cleanData(incoming || []),
                outgoing: cleanData(outgoing || []),
                confirmed: cleanData(confirmed || [])
              });
            }
          );
        }
      );
    }
  );
});

// Send match request
app.post('/api/match-request', authenticateToken, (req, res) => {
  const { fromUserId, toUserId, message } = req.body;
  
  // Check if match already exists
  database.getWithRetry(
    `SELECT * FROM matches 
     WHERE (from_user_id = ? AND to_user_id = ?) 
     OR (from_user_id = ? AND to_user_id = ?)`,
    [fromUserId, toUserId, toUserId, fromUserId],
    (err, existing) => {
      if (err) {
        console.error('Match check error:', err);
        return res.status(500).json({ error: 'Failed to send match request' });
      }
      
      if (existing) {
        return res.status(400).json({ error: 'Match request already exists' });
      }
      
      // Insert new match request
      database.runWithRetry(
        `INSERT INTO matches (from_user_id, to_user_id, message, status) 
         VALUES (?, ?, ?, 'pending')`,
        [fromUserId, toUserId, message || ''],
        function(err) {
          if (err) {
            console.error('Match insert error:', err);
            return res.status(500).json({ error: 'Failed to send match request' });
          }
          res.json({ message: 'Match request sent successfully', matchId: this.lastID });
        }
      );
    }
  );
});

// Accept match request
app.post('/api/matches/:id/accept', authenticateToken, (req, res) => {
  const matchId = req.params.id;
  
  database.runWithRetry(
    `UPDATE matches SET status = 'accepted', responded_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [matchId],
    (err) => {
      if (err) {
        console.error('Accept match error:', err);
        return res.status(500).json({ error: 'Failed to accept match' });
      }
      res.json({ message: 'Match accepted successfully' });
    }
  );
});

// Reject match request
app.post('/api/matches/:id/reject', authenticateToken, (req, res) => {
  const matchId = req.params.id;
  
  database.runWithRetry(
    `UPDATE matches SET status = 'rejected', responded_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [matchId],
    (err) => {
      if (err) {
        console.error('Reject match error:', err);
        return res.status(500).json({ error: 'Failed to reject match' });
      }
      res.json({ message: 'Match rejected successfully' });
    }
  );
});

// Cancel match request
app.delete('/api/matches/:id', authenticateToken, (req, res) => {
  const matchId = req.params.id;
  
  database.runWithRetry(
    `DELETE FROM matches WHERE id = ?`,
    [matchId],
    (err) => {
      if (err) {
        console.error('Cancel match error:', err);
        return res.status(500).json({ error: 'Failed to cancel match' });
      }
      res.json({ message: 'Match cancelled successfully' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  database.close();
  process.exit(0);
});