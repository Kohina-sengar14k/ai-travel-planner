import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();
  const navigate              = useNavigate();

  const onChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit  = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm)
      return setError('Passwords do not match.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 -m-6 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌍</div>
          <h1 className="text-3xl font-bold text-gray-900">AI Travel Planner</h1>
          <p className="text-gray-500 mt-1">Your AI-powered travel companion</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input name="name" required className="input" placeholder="Jane Doe"
                value={form.name} onChange={onChange} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={onChange} />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required className="input" placeholder="Min 6 characters"
                value={form.password} onChange={onChange} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input name="confirm" type="password" required className="input" placeholder="Repeat password"
                value={form.confirm} onChange={onChange} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
