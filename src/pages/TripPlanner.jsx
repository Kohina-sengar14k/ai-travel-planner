import { useState } from 'react';
import { createTrip, generateItinerary, chatWithAI } from '../services/api';

const TRIP_TYPES = ['budget', 'luxury', 'adventure', 'chill'];
const TYPE_EMOJI = { budget: '💸', luxury: '💎', adventure: '🧗', chill: '🏖️' };

const TripPlanner = () => {
  const [form, setForm] = useState({
    destination: '',
    budget: '',
    numberOfPeople: 2,
    duration: 5,
    tripType: 'budget',
    members: '',
  });
  const [itinerary, setItinerary]   = useState(null);
  const [savedTrip, setSavedTrip]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [activeDay, setActiveDay]   = useState(0);

  // Chat assistant state
  const [chatMsg, setChatMsg]   = useState('');
  const [chatLog, setChatLog]   = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.budget || !form.duration) return setError('Please fill in budget and duration.');
    setError('');
    setGenerating(true);
    setItinerary(null);
    try {
      const { data } = await generateItinerary({
        destination: form.destination || undefined,
        budget: Number(form.budget),
        numberOfPeople: Number(form.numberOfPeople),
        duration: Number(form.duration),
        tripType: form.tripType,
      });
      setItinerary(data);
      setActiveDay(0);
    } catch (err) {
      setError('AI generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    setSaving(true);
    try {
      const members = form.members ? form.members.split(',').map(s => s.trim()).filter(Boolean) : [];
      const { data } = await createTrip({
        destination: itinerary.destination,
        budget: Number(form.budget),
        numberOfPeople: Number(form.numberOfPeople),
        duration: Number(form.duration),
        tripType: form.tripType,
        members,
        itinerary,
      });
      setSavedTrip(data);
    } catch (err) {
      setError('Save failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const msg = chatMsg;
    setChatMsg('');
    setChatLog(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const tripContext = itinerary
        ? { destination: itinerary.destination, budget: form.budget, numberOfPeople: form.numberOfPeople }
        : null;
      const { data } = await chatWithAI({ message: msg, tripContext });
      setChatLog(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch {
      setChatLog(prev => [...prev, { role: 'ai', text: 'Sorry, I could not get a response right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">✈️ AI Trip Planner</h1>
        <p className="text-gray-500 text-sm mt-1">Describe your dream trip and let AI build your itinerary</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Form ── */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleGenerate} className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Trip Details</h2>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

            <div>
              <label className="label">Destination</label>
              <input name="destination" className="input" placeholder="Paris, France (leave blank to suggest)"
                value={form.destination} onChange={onChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Budget (USD) *</label>
                <input name="budget" type="number" min="1" required className="input" placeholder="e.g. 3000"
                  value={form.budget} onChange={onChange} />
              </div>
              <div>
                <label className="label">People *</label>
                <input name="numberOfPeople" type="number" min="1" max="20" className="input"
                  value={form.numberOfPeople} onChange={onChange} />
              </div>
            </div>
            <div>
              <label className="label">Duration (days) *</label>
              <input name="duration" type="number" min="1" max="30" className="input"
                value={form.duration} onChange={onChange} />
            </div>
            <div>
              <label className="label">Trip Style</label>
              <div className="grid grid-cols-2 gap-2">
                {TRIP_TYPES.map(type => (
                  <button type="button" key={type}
                    onClick={() => setForm({ ...form, tripType: type })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                      ${form.tripType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                  >
                    {TYPE_EMOJI[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Members (comma-separated names)</label>
              <input name="members" className="input" placeholder="Alice, Bob, Charlie"
                value={form.members} onChange={onChange} />
            </div>
            <button type="submit" disabled={generating} className="btn-primary w-full py-3">
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Generating with AI…
                </span>
              ) : '🪄 Generate Itinerary'}
            </button>
          </form>

          {/* AI Chat */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">🤖 AI Travel Assistant</h2>
            <div className="h-48 overflow-y-auto space-y-2 mb-3 bg-gray-50 rounded-lg p-3">
              {chatLog.length === 0 && (
                <p className="text-gray-400 text-sm text-center mt-12">Ask me anything about your trip!</p>
              )}
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border text-gray-700 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-xl rounded-bl-none px-3 py-2 text-sm text-gray-400 shadow-sm animate-pulse">
                    Thinking…
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="What should I pack for Tokyo?" value={chatMsg}
                onChange={e => setChatMsg(e.target.value)} />
              <button type="submit" disabled={chatLoading} className="btn-primary px-4 text-sm">Send</button>
            </form>
          </div>
        </div>

        {/* ── Right: Itinerary ── */}
        <div className="lg:col-span-3">
          {!itinerary && !generating && (
            <div className="card h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-lg font-medium">Your AI itinerary will appear here</p>
                <p className="text-sm mt-1">Fill in the form and click Generate</p>
              </div>
            </div>
          )}

          {generating && (
            <div className="card h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="text-6xl animate-bounce mb-4">✈️</div>
                <p className="text-gray-600 font-medium">AI is crafting your perfect itinerary…</p>
                <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
              </div>
            </div>
          )}

          {itinerary && (
            <div className="space-y-4">
              {/* Header card */}
              <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">📍 {itinerary.destination}</h2>
                    <p className="mt-1 opacity-90">{form.duration} days · {form.numberOfPeople} people</p>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {itinerary.totalBudget}
                  </span>
                </div>
                <div className="mt-4 flex gap-3">
                  {!savedTrip ? (
                    <button onClick={handleSave} disabled={saving}
                      className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                      {saving ? 'Saving…' : '💾 Save Trip'}
                    </button>
                  ) : (
                    <span className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">✅ Trip Saved!</span>
                  )}
                </div>
              </div>

              {/* Day tabs */}
              <div className="card">
                <div className="flex gap-2 flex-wrap mb-4">
                  {itinerary.dailyPlan?.map((day, i) => (
                    <button key={i} onClick={() => setActiveDay(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${activeDay === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Day {day.day}
                    </button>
                  ))}
                </div>

                {itinerary.dailyPlan?.[activeDay] && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">Day {itinerary.dailyPlan[activeDay].day} Activities</h3>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        Est. {itinerary.dailyPlan[activeDay].estimatedCost}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {itinerary.dailyPlan[activeDay].activities?.map((act, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                          <span className="text-blue-500 font-bold mt-0.5">→</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Hotels & Food */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3">🏨 Hotel Suggestions</h3>
                  <ul className="space-y-2">
                    {itinerary.hotelSuggestions?.map((h, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-amber-500">★</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3">🍽️ Food Picks</h3>
                  <ul className="space-y-2">
                    {itinerary.foodSuggestions?.map((f, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-green-500">🥢</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
