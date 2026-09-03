import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getTrips, deleteTrip, getExpenses } from '../services/api';

const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLOR = { planning: 'blue', active: 'green', completed: 'gray' };
const TYPE_EMOJI   = { budget: '💸', luxury: '💎', adventure: '🧗', chill: '🏖️' };

const StatCard = ({ icon, label, value, sub, color = 'blue' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center text-2xl flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expenseMap, setExpenseMap] = useState({}); // tripId -> { total, breakdown }

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: tripsData } = await getTrips();
      setTrips(tripsData);

      // Fetch expenses for each trip
      const map = {};
      await Promise.all(
        tripsData.map(async (trip) => {
          try {
            const { data: exps } = await getExpenses(trip._id);
            const total = exps.reduce((s, e) => s + e.amount, 0);
            const breakdown = exps.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {});
            map[trip._id] = { total, breakdown };
          } catch { map[trip._id] = { total: 0, breakdown: {} }; }
        })
      );
      setExpenseMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    await deleteTrip(id);
    fetchData();
  };

  // Aggregate stats
  const totalBudget = trips.reduce((s, t) => s + t.budget, 0);
  const totalSpent  = trips.reduce((s, t) => s + (expenseMap[t._id]?.total || 0), 0);
  const activeTrips = trips.filter(t => t.status === 'active').length;

  // Category pie data (aggregate all trips)
  const catTotals = {};
  Object.values(expenseMap).forEach(({ breakdown }) =>
    Object.entries(breakdown).forEach(([cat, amt]) => {
      catTotals[cat] = (catTotals[cat] || 0) + amt;
    })
  );
  const pieData = Object.entries(catTotals).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

  // Bar chart: budget vs spent per trip
  const barData = trips.slice(0, 6).map(t => ({
    name: t.destination.split(',')[0],
    Budget: t.budget,
    Spent: +(expenseMap[t._id]?.total || 0).toFixed(2),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin text-4xl">✈️</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your travel overview</p>
        </div>
        <button onClick={() => navigate('/plan')} className="btn-primary flex items-center gap-2">
          <span>+</span> New Trip
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✈️" label="Total Trips"    value={trips.length}         sub="all time"             color="blue"   />
        <StatCard icon="🟢" label="Active Trips"   value={activeTrips}          sub="in progress"          color="green"  />
        <StatCard icon="💸" label="Total Spent"    value={`$${totalSpent.toFixed(0)}`}  sub="across all trips"   color="purple" />
        <StatCard icon="💰" label="Total Budget"   value={`$${totalBudget.toFixed(0)}`} sub={`$${(totalBudget-totalSpent).toFixed(0)} remaining`} color="amber" />
      </div>

      {/* Charts */}
      {trips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar: Budget vs Spent */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Budget vs Spent per Trip</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v}`} />
                <Legend />
                <Bar dataKey="Budget" fill="#93c5fd" radius={[4,4,0,0]} />
                <Bar dataKey="Spent"  fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie: Expense categories */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                       dataKey="value" nameKey="name" paddingAngle={3}
                       label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                       labelLine={false}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No expenses logged yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Trips</h2>
        {trips.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-500 mb-4">No trips yet. Plan your first adventure!</p>
            <button onClick={() => navigate('/plan')} className="btn-primary">Plan a Trip</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => {
              const spent = expenseMap[trip._id]?.total || 0;
              const pct   = trip.budget > 0 ? Math.min((spent / trip.budget) * 100, 100) : 0;
              const sc    = STATUS_COLOR[trip.status] || 'gray';
              return (
                <div key={trip._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-2xl">{TYPE_EMOJI[trip.tripType] || '✈️'}</span>
                      <h3 className="font-bold text-gray-900 mt-1">{trip.destination}</h3>
                      <p className="text-xs text-gray-400">{trip.duration} days · {trip.numberOfPeople} people</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${sc}-100 text-${sc}-700 font-medium capitalize`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Budget bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>${spent.toFixed(0)} spent</span>
                      <span>${trip.budget} budget</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/expenses?trip=${trip._id}`)}
                      className="flex-1 text-xs btn-secondary py-1.5"
                    >
                      Expenses
                    </button>
                    <button
                      onClick={() => handleDelete(trip._id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
