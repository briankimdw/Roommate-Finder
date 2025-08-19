# Roommate Finder Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your settings:
```
JWT_SECRET=your-secure-secret-key
PORT=5001
```

## Running the Server

Start the server:
```bash
npm start
```

The server will run on http://localhost:5001

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Profile
- `GET /api/profile/:id` - Get user profile
- `PUT /api/profile/:userId` - Update user profile

### Users & Search
- `GET /api/users` - Get all users (requires auth)

### Matches
- `GET /api/matches/:userId` - Get user's matches (incoming/outgoing/confirmed)
- `POST /api/match-request` - Send match request
- `POST /api/matches/:id/accept` - Accept match request
- `POST /api/matches/:id/reject` - Reject match request
- `DELETE /api/matches/:id` - Cancel match request

## Database

SQLite database with three main tables:
- `users` - User accounts and basic info
- `preferences` - User lifestyle preferences
- `matches` - Match requests and connections

The database uses WAL mode for better concurrency and includes retry logic for all operations.