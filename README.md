# Roommate Finder

A modern full-stack web application for finding compatible roommates with advanced search, filtering, and matching capabilities.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure registration and login with JWT tokens
- **Advanced Search**: Browse and filter potential roommates with real-time results
- **Smart Matching System**: Send, receive, accept, and decline match requests
- **Detailed Profiles**: Comprehensive user profiles with lifestyle preferences
- **Responsive Design**: Seamless experience across desktop and mobile devices

### Search & Discovery
- **Multi-criteria Filtering**: 
  - Budget range (min/max)
  - Location with radius selection (1-50 miles)
  - Age range and gender
  - Lifestyle preferences (smoking, pets, night owl)
- **User Cards**: Quick preview with essential information
- **Profile Modals**: View detailed profiles without leaving the search page

### Match Management
- **Three-way Categorization**:
  - ✅ Confirmed Matches - Mutually accepted connections
  - 📥 Pending Requests - Incoming requests from others
  - 📤 Sent Requests - Your outgoing requests
- **Quick Actions**: Accept, decline, or cancel requests with one click
- **Real-time Updates**: Instant refresh after any action

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite3** with WAL mode for better concurrency
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **Database pooling** with retry logic

### Frontend
- **React.js** with React Router
- **Axios** for API communication
- **Custom CSS** with responsive design
- **Modal system** for seamless UX

## 📁 Project Structure

```
Roommate Finder/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js              # Styled login page
│   │   │   ├── Register.js           # Multi-field registration
│   │   │   ├── Dashboard.js          # User dashboard
│   │   │   ├── Profile.js            # Profile management
│   │   │   ├── Search.js             # Browse roommates
│   │   │   ├── Matches.js            # Match management
│   │   │   ├── UserProfileModal.js   # Profile viewing modal
│   │   │   └── Navbar.js             # Navigation
│   │   └── App.js                    # Main app with routing
│   └── package.json
└── backend/
    ├── server.js                      # Express server & APIs
    ├── database.js                    # Database management
    ├── roommate.db                    # SQLite database
    └── package.json
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install

# Create .env file
echo "JWT_SECRET=your-secret-key-here" > .env
echo "PORT=5001" >> .env

# Start server
npm start
```
Server runs on http://localhost:5001

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Application opens at http://localhost:3000

## 📊 Database Schema

### Users Table
- Personal info (name, age, gender, occupation, bio)
- Housing preferences (budget range, location, move-in date)
- Account details (email, password hash)

### Preferences Table
- Lifestyle choices (smoking, pets, night owl)
- Living habits (cleanliness, guests, noise - scale 1-5)

### Matches Table
- Match relationships (from_user_id, to_user_id)
- Status (pending, accepted, rejected)
- Timestamps for tracking

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - User login

### Profile
- `GET /api/profile/:id` - Get user profile
- `PUT /api/profile/:userId` - Update profile

### Users & Search
- `GET /api/users` - Get all users for search

### Matches
- `GET /api/matches/:userId` - Get categorized matches
- `POST /api/match-request` - Send match request
- `POST /api/matches/:id/accept` - Accept request
- `POST /api/matches/:id/reject` - Reject request
- `DELETE /api/matches/:id` - Cancel request

## 💡 Key Features Explained

### Smart Search System
The search page allows users to:
- Apply multiple filters simultaneously
- See results update in real-time
- Click on any user to view their full profile
- Send match requests directly from search results

### Match Request Flow
1. **Browse** users in the Search page
2. **Send** match requests to compatible roommates
3. **Receive** requests from interested users
4. **Accept/Decline** incoming requests
5. **Connect** with confirmed matches

### Profile System
- Comprehensive profiles with personal and housing info
- Lifestyle preferences for better matching
- Living habit scales for compatibility
- Custom lease duration options

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- Database transaction safety
- CORS properly configured

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints for all screen sizes
- Touch-friendly interface
- Optimized modal system for mobile

## 🎨 UI/UX Highlights

- Clean, modern interface with gray theme
- Intuitive navigation
- Clear visual hierarchy
- Smooth transitions and animations
- Consistent design language

## 🔄 Recent Updates

- Implemented user search with advanced filters
- Added match request system
- Created profile modal system
- Redesigned matches page layout
- Added database retry logic
- Fixed match status tracking
- Improved mobile responsiveness

## 🚧 Future Enhancements

- Real-time messaging between matches
- Photo uploads for profiles
- Email notifications
- Advanced compatibility algorithm
- Location-based search with maps
- Social media integration
- Roommate group formation
- Lease document sharing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👏 Acknowledgments

- React.js documentation and community
- Express.js for robust backend framework
- SQLite for lightweight database solution
- The open-source community for inspiration