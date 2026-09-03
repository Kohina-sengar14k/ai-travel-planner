import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach JWT to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register        = (data) => API.post('/auth/register', data);
export const login           = (data) => API.post('/auth/login', data);
export const getProfile      = ()     => API.get('/auth/profile');

// Trips
export const createTrip      = (data) => API.post('/trip/create', data);
export const getTrips        = ()     => API.get('/trip');
export const getTripById     = (id)   => API.get(`/trip/${id}`);
export const updateTrip      = (id, d)=> API.put(`/trip/${id}`, d);
export const deleteTrip      = (id)   => API.delete(`/trip/${id}`);
export const generateItinerary=(data) => API.post('/trip/generate-itinerary', data);
export const getBudgetSuggestions=(d) => API.post('/trip/budget-suggestions', d);
export const chatWithAI      = (data) => API.post('/trip/chat', data);

// Expenses
export const addExpense      = (data) => API.post('/expense/add', data);
export const getExpenses     = (tid)  => API.get(`/expense/${tid}`);
export const deleteExpense   = (id)   => API.delete(`/expense/${id}`);
export const getSettlement   = (tid)  => API.get(`/expense/settlement/${tid}`);
