const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, 'roommate.db');
      
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          
          // Configure database for better concurrency
          this.db.serialize(() => {
            // Use WAL mode for better concurrency
            this.db.run('PRAGMA journal_mode = WAL', (err) => {
              if (err) console.error('Error setting WAL mode:', err);
            });
            
            // Set busy timeout to 10 seconds
            this.db.run('PRAGMA busy_timeout = 10000');
            
            // Other optimizations
            this.db.run('PRAGMA synchronous = NORMAL');
            this.db.run('PRAGMA cache_size = 10000');
            this.db.run('PRAGMA temp_store = MEMORY');
            
            // Create tables
            this.createTables(() => {
              this.isInitialized = true;
              resolve(this.db);
            });
          });
        }
      });
    });
  }

  createTables(callback) {
    this.db.serialize(() => {
      // Users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
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
        custom_duration TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating users table:', err);
      });

      // Preferences table
      this.db.run(`CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        smoking BOOLEAN DEFAULT 0,
        pets BOOLEAN DEFAULT 0,
        night_owl BOOLEAN DEFAULT 0,
        cleanliness_level INTEGER DEFAULT 3,
        guests_frequency INTEGER DEFAULT 3,
        noise_level INTEGER DEFAULT 3,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) console.error('Error creating preferences table:', err);
      });

      // Matches table
      this.db.run(`CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        compatibility_score REAL,
        status TEXT DEFAULT 'pending',
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(from_user_id, to_user_id)
      )`, (err) => {
        if (err) console.error('Error creating matches table:', err);
        if (callback) callback();
      });
    });
  }

  getDb() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }

  // Helper method to run queries with retry logic
  runWithRetry(sql, params, callback, retries = 3) {
    const attempt = (retriesLeft) => {
      this.db.run(sql, params, function(err) {
        if (err && err.code === 'SQLITE_BUSY' && retriesLeft > 0) {
          console.log(`Database busy, retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attempt(retriesLeft - 1), 1000);
        } else {
          callback.call(this, err);
        }
      });
    };
    attempt(retries);
  }

  // Helper method for get queries with retry
  getWithRetry(sql, params, callback, retries = 3) {
    const attempt = (retriesLeft) => {
      this.db.get(sql, params, (err, row) => {
        if (err && err.code === 'SQLITE_BUSY' && retriesLeft > 0) {
          console.log(`Database busy, retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attempt(retriesLeft - 1), 1000);
        } else {
          callback(err, row);
        }
      });
    };
    attempt(retries);
  }

  // Helper method for all queries with retry
  allWithRetry(sql, params, callback, retries = 3) {
    const attempt = (retriesLeft) => {
      this.db.all(sql, params, (err, rows) => {
        if (err && err.code === 'SQLITE_BUSY' && retriesLeft > 0) {
          console.log(`Database busy, retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attempt(retriesLeft - 1), 1000);
        } else {
          callback(err, rows);
        }
      });
    };
    attempt(retries);
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;