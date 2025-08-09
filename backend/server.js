const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Handle preflight requests
app.options('*', cors(corsOptions));

const db = new sqlite3.Database('./roommate.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    occupation TEXT,
    bio TEXT,
    budget INTEGER,
    budget_min INTEGER,
    budget_max INTEGER,
    location TEXT,
    move_in_date TEXT,
    lease_duration TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    smoking BOOLEAN,
    pets BOOLEAN,
    night_owl BOOLEAN,
    cleanliness_level INTEGER,
    guests_frequency INTEGER,
    noise_level INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    compatibility_score REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
  )`);
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

app.post('/api/register', async (req, res) => {
  const { email, password, name, age, gender, occupation, bio, budget, location, moveInDate } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (email, password, name, age, gender, occupation, bio, budget, location, move_in_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, age, gender, occupation, bio, budget, location, moveInDate],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign(
          { id: this.lastID, email }, 
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        res.json({ token, userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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

app.get('/api/profile/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  
  db.get(
    `SELECT u.*, p.* FROM users u 
     LEFT JOIN preferences p ON u.id = p.user_id 
     WHERE u.id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      delete row.password;
      res.json(row);
    }
  );
});

app.put('/api/profile/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const { 
    name, age, gender, occupation, bio, 
    budgetMin, budgetMax, location, move_in_date, lease_duration,
    smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel 
  } = req.body;
  
  // Update user profile
  db.run(
    `UPDATE users SET 
     name = ?, age = ?, gender = ?, occupation = ?, bio = ?,
     budget_min = ?, budget_max = ?, location = ?, move_in_date = ?, lease_duration = ?
     WHERE id = ?`,
    [name, age, gender, occupation, bio, budgetMin, budgetMax, location, move_in_date, lease_duration, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Check if preferences exist
      db.get('SELECT id FROM preferences WHERE user_id = ?', [userId], (err, existing) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (existing) {
          // Update preferences
          db.run(
            `UPDATE preferences SET 
             smoking = ?, pets = ?, night_owl = ?, 
             cleanliness_level = ?, guests_frequency = ?, noise_level = ?
             WHERE user_id = ?`,
            [smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel, userId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'Profile updated successfully' });
            }
          );
        } else {
          // Insert new preferences
          db.run(
            `INSERT INTO preferences (user_id, smoking, pets, night_owl, cleanliness_level, guests_frequency, noise_level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'Profile updated successfully' });
            }
          );
        }
      });
    }
  );
});

app.put('/api/preferences/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const { smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel } = req.body;
  
  db.get('SELECT id FROM preferences WHERE user_id = ?', [userId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (existing) {
      db.run(
        `UPDATE preferences SET 
         smoking = ?, pets = ?, night_owl = ?, 
         cleanliness_level = ?, guests_frequency = ?, noise_level = ?
         WHERE user_id = ?`,
        [smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Preferences updated' });
        }
      );
    } else {
      db.run(
        `INSERT INTO preferences (user_id, smoking, pets, night_owl, cleanliness_level, guests_frequency, noise_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, smoking, pets, nightOwl, cleanlinessLevel, guestsFrequency, noiseLevel],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Preferences saved' });
        }
      );
    }
  });
});

app.get('/api/matches/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  db.all(
    `SELECT u.*, p.*, m.compatibility_score, m.status, m.id as match_id
     FROM users u
     LEFT JOIN preferences p ON u.id = p.user_id
     LEFT JOIN matches m ON (m.user1_id = ? AND m.user2_id = u.id) OR (m.user2_id = ? AND m.user1_id = u.id)
     WHERE u.id != ?
     ORDER BY m.compatibility_score DESC`,
    [userId, userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      rows.forEach(row => delete row.password);
      res.json(rows);
    }
  );
});

function calculateCompatibility(user1Prefs, user2Prefs) {
  if (!user1Prefs || !user2Prefs) return 50;
  
  let score = 100;
  const weights = {
    smoking: 20,
    pets: 15,
    night_owl: 10,
    cleanliness_level: 20,
    guests_frequency: 15,
    noise_level: 20
  };
  
  if (user1Prefs.smoking !== user2Prefs.smoking) score -= weights.smoking;
  if (user1Prefs.pets !== user2Prefs.pets) score -= weights.pets;
  if (user1Prefs.night_owl !== user2Prefs.night_owl) score -= weights.night_owl;
  
  const cleanDiff = Math.abs(user1Prefs.cleanliness_level - user2Prefs.cleanliness_level);
  score -= (cleanDiff * 4);
  
  const guestDiff = Math.abs(user1Prefs.guests_frequency - user2Prefs.guests_frequency);
  score -= (guestDiff * 3);
  
  const noiseDiff = Math.abs(user1Prefs.noise_level - user2Prefs.noise_level);
  score -= (noiseDiff * 4);
  
  return Math.max(0, Math.min(100, score));
}

app.post('/api/calculate-matches/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT * FROM preferences WHERE user_id = ?', [userId], (err, userPrefs) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!userPrefs) {
      return res.status(400).json({ error: 'Please set your preferences first' });
    }
    
    db.all(
      `SELECT u.id, p.* FROM users u 
       LEFT JOIN preferences p ON u.id = p.user_id 
       WHERE u.id != ?`,
      [userId],
      (err, otherUsers) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const stmt = db.prepare(
          `INSERT OR REPLACE INTO matches (user1_id, user2_id, compatibility_score) 
           VALUES (?, ?, ?)`
        );
        
        otherUsers.forEach(otherUser => {
          const score = calculateCompatibility(userPrefs, otherUser);
          stmt.run(userId, otherUser.id, score);
        });
        
        stmt.finalize();
        res.json({ message: 'Matches calculated successfully' });
      }
    );
  });
});

app.post('/api/matches/:matchId/accept', authenticateToken, (req, res) => {
  const matchId = req.params.matchId;
  
  db.run(
    'UPDATE matches SET status = ? WHERE id = ?',
    ['accepted', matchId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Match accepted' });
    }
  );
});

app.post('/api/matches/:matchId/reject', authenticateToken, (req, res) => {
  const matchId = req.params.matchId;
  
  db.run(
    'UPDATE matches SET status = ? WHERE id = ?',
    ['rejected', matchId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Match rejected' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});