import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import ExpenseTracker from './pages/ExpenseTracker';
import { useAuth } from './context/AuthContext';

// Layout wrapper (shows Navbar for authenticated pages)
const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      {user && <Navbar />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/plan" element={
        <ProtectedRoute><TripPlanner /></ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute><ExpenseTracker /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
