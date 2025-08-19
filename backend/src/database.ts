import sqlite3 from 'sqlite3';
import path from 'path';

sqlite3.verbose();

type DatabaseCallback<T = any> = (err: Error | null, result?: T) => void;
type RunCallback = (this: sqlite3.RunResult, err: Error | null) => void;

class Database {
  private db: sqlite3.Database | null = null;
  private isInitialized = false;

  async init(): Promise<sqlite3.Database> {
    if (this.isInitialized && this.db) return this.db;

    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '..', 'roommate.db');
      
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          
          if (!this.db) {
            reject(new Error('Database initialization failed'));
            return;
          }

          // Configure database for better concurrency
          this.db.serialize(() => {
            if (!this.db) return;

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
              resolve(this.db!);
            });
          });
        }
      });
    });
  }

  private createTables(callback: () => void): void {
    if (!this.db) return;

    this.db.serialize(() => {
      if (!this.db) return;

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

  getDb(): sqlite3.Database {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  close(): void {
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
  runWithRetry(sql: string, params: any[], callback: RunCallback, retries = 3): void {
    const attempt = (retriesLeft: number) => {
      if (!this.db) {
        callback.call({ lastID: 0, changes: 0 } as sqlite3.RunResult, new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err && (err as any).code === 'SQLITE_BUSY' && retriesLeft > 0) {
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
  getWithRetry<T = any>(sql: string, params: any[], callback: DatabaseCallback<T>, retries = 3): void {
    const attempt = (retriesLeft: number) => {
      if (!this.db) {
        callback(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err && (err as any).code === 'SQLITE_BUSY' && retriesLeft > 0) {
          console.log(`Database busy, retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attempt(retriesLeft - 1), 1000);
        } else {
          callback(err, row as T);
        }
      });
    };
    attempt(retries);
  }

  // Helper method for all queries with retry
  allWithRetry<T = any>(sql: string, params: any[], callback: DatabaseCallback<T[]>, retries = 3): void {
    const attempt = (retriesLeft: number) => {
      if (!this.db) {
        callback(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err && (err as any).code === 'SQLITE_BUSY' && retriesLeft > 0) {
          console.log(`Database busy, retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attempt(retriesLeft - 1), 1000);
        } else {
          callback(err, rows as T[]);
        }
      });
    };
    attempt(retries);
  }
}

// Create singleton instance
const database = new Database();

export default database;