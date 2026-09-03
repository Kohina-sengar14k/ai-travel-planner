require('dotenv').config();
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'LOADED ✓' : 'NOT FOUND');
console.log("JWT_SECRET:", process.env.JWT_SECRET);    

const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/trip',    require('./routes/trip'));
app.use('/api/expense', require('./routes/expense'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', message: 'AI Travel Planner API is running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
