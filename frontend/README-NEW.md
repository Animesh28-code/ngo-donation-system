# NGO Donation System - Frontend

A React + Vite application for the NGO Donation System that allows users to register, donate, and track their donation history, while providing administrators with comprehensive dashboards and reporting features.

## Features

### User Features
- **Registration**: Register with personal and address information
- **Login/Authentication**: Secure login with JWT tokens
- **Donation**: Make donations with tracking
- **Donation History**: View all your donations with status (SUCCESS, PENDING, FAILED)
- **Profile Management**: View registration details

### Admin Features
- **Dashboard**: Overview of total registrations, donations, and amount received
- **Registration Management**: View all registered users and filter by search parameters
- **Donation Management**: Track all donations with their status
- **Export**: Export registration data as CSV
- **Donation Filtering**: Filter donations by status (SUCCESS, PENDING, FAILED)

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **React Router DOM 6** - Routing and navigation
- **Axios** - HTTP client for API calls

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port)

### Environment Configuration

The API base URL is configured in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api'
```

If your backend is running on a different port, update this URL accordingly.

## Project Structure

```
src/
├── pages/              # Page components
│   ├── Login.jsx      # Login page
│   ├── Register.jsx   # User registration page
│   ├── UserDashboard.jsx      # User main dashboard
│   ├── DonationForm.jsx        # Create donation
│   ├── DonationHistory.jsx     # View donations
│   └── AdminDashboard.jsx      # Admin dashboard
├── services/          # API services
│   └── api.js        # Axios configuration and API endpoints
├── App.jsx           # Main app component with routing
├── App.css           # Application styles
├── main.jsx          # Entry point
└── index.css         # Base styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Operations
- `GET /api/user/profile` - Get user profile and registration details
- `POST /api/user/donate` - Create a donation
- `GET /api/user/donations` - List user's donations
- `POST /api/user/donate/status` - Update donation status

### Admin Operations
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/registrations` - Get all registrations
- `GET /api/admin/registrations/export` - Export registrations as CSV
- `GET /api/admin/donations` - Get all donations

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:
1. User logs in/registers
2. Server returns a JWT token
3. Token is stored in localStorage
4. Token is sent with each request in the Authorization header

Protected routes require a valid token and appropriate role:
- User routes require `USER` role
- Admin routes require `ADMIN` role

## Running the Full Stack

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

The optimized production bundle will be created in the `dist/` directory.

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Verify backend has CORS enabled with the frontend origin

### Authentication Issues
- Clear localStorage and login again
- Check if JWT secret is properly configured in backend
- Verify token is being sent in request headers

### State Not Persisting
- Check browser localStorage for stored token and user data
- Verify user object is being stored correctly on login

## Contributing

Please ensure all changes follow the existing code style and update this README if adding new features.
