# AI Travel Planner + Expense Splitter

A full-stack web application to plan trips with AI, manage group expenses, and stay within budget.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Recharts, React Router v6
- **Backend**: Node.js, Express.js, MongoDB/Mongoose
- **AI**: OpenAI GPT-3.5-turbo (itinerary + budget tips + chat assistant)
- **Auth**: JWT (JSON Web Tokens)

## Features
- JWT-based signup / login
- AI-generated day-by-day itinerary from budget & preferences
- Expense tracking with equal / custom / percentage splits
- Automatic settlement calculation (who owes whom)
- Budget progress bar with alerts and AI saving suggestions
- Dashboard with Recharts (pie + bar charts)
- AI chat travel assistant

## Project Structure
```
ai-travel-planner/
├── backend/
│   ├── config/db.js
│   ├── controllers/   (authController, tripController, expenseController)
│   ├── middleware/auth.js
│   ├── models/        (User, Trip, Expense)
│   ├── routes/        (auth, trip, expense)
│   ├── services/openaiService.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── components/ (Navbar, ProtectedRoute, BudgetAlert)
    │   ├── context/AuthContext.jsx
    │   ├── pages/     (Login, Register, Dashboard, TripPlanner, ExpenseTracker)
    │   ├── services/api.js
    │   └── App.jsx
    └── package.json
```

## Setup

### Prerequisites
- Node.js >= 16
- MongoDB running locally (or MongoDB Atlas connection string)
- OpenAI API key

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and add your MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm run dev        # starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start          # starts on http://localhost:3000
```

## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login & receive JWT |
| GET  | /api/auth/profile | Get current user (protected) |

### Trips
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/trip/create | Create a trip |
| GET  | /api/trip | Get all user trips |
| GET  | /api/trip/:id | Get single trip |
| PUT  | /api/trip/:id | Update trip |
| DELETE | /api/trip/:id | Delete trip |
| POST | /api/trip/generate-itinerary | AI itinerary generation |
| POST | /api/trip/budget-suggestions | AI budget saving tips |
| POST | /api/trip/chat | AI travel chat assistant |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/expense/add | Add expense to trip |
| GET  | /api/expense/:tripId | List expenses for trip |
| DELETE | /api/expense/:id | Delete expense |
| GET  | /api/expense/settlement/:tripId | Get settlement calculations |

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-travel-planner
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```
