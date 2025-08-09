# Roommate Finder Application

A full-stack web application that helps people find compatible roommates based on their preferences and lifestyle choices.

## Features

- **User Registration & Authentication**: Secure user accounts with JWT authentication
- **Profile Management**: Users can create and edit their profiles with personal information
- **Preference Settings**: Set living preferences including cleanliness, noise level, pet preferences, and more
- **Smart Matching Algorithm**: Calculates compatibility scores based on user preferences
- **Match Management**: Accept or reject potential roommate matches
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite3** database for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend
- **React** (Create React App)
- **React Router** for navigation
- **Axios** for API calls
- **Custom CSS** for styling

## Project Structure

```
roommate-finder/
├── backend/
│   ├── server.js         # Express server and API endpoints
│   ├── roommate.db       # SQLite database (auto-created)
│   ├── .env             # Environment variables
│   └── package.json     # Backend dependencies
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration page
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── Profile.js      # User profile management
│   │   │   ├── Preferences.js  # Living preferences
│   │   │   ├── Matches.js      # View and manage matches
│   │   │   ├── Navbar.js       # Navigation component
│   │   │   └── *.css           # Component styles
│   │   ├── App.js         # Main app component with routing
│   │   └── App.css        # Global styles
│   └── package.json       # Frontend dependencies
│
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already created with default values):
```
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register**: Create a new account with your basic information
2. **Set Preferences**: After registration, you'll be prompted to set your living preferences
3. **Complete Profile**: Add more details about yourself in the profile section
4. **Calculate Matches**: Click "Calculate Matches" to find compatible roommates
5. **Review Matches**: Browse through potential matches and see compatibility scores
6. **Connect**: Accept matches you're interested in or pass on incompatible ones

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### User Management
- `GET /api/profile/:id` - Get user profile
- `PUT /api/preferences/:userId` - Update user preferences

### Matching
- `GET /api/matches/:userId` - Get user's matches
- `POST /api/calculate-matches/:userId` - Calculate new matches
- `POST /api/matches/:matchId/accept` - Accept a match
- `POST /api/matches/:matchId/reject` - Reject a match

## Database Schema

### Users Table
- Basic user information (email, name, age, gender, etc.)
- Housing preferences (budget, location, move-in date)

### Preferences Table
- Lifestyle preferences (smoking, pets, night owl)
- Living habits (cleanliness, guests, noise levels)

### Matches Table
- Connections between users
- Compatibility scores
- Match status (pending/accepted/rejected)

## Matching Algorithm

The compatibility algorithm considers:
- **Lifestyle Choices** (smoking, pets, sleep schedule): Binary matching
- **Living Habits** (cleanliness, guests, noise): Scale-based matching (1-5)
- Returns a compatibility score from 0-100%

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation
- SQL injection prevention

## Future Enhancements

- Real-time messaging between matched users
- Photo uploads for profiles
- Advanced filtering options
- Email notifications
- Mobile app version
- Integration with rental listings
- Group housing support
- Verification system

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.