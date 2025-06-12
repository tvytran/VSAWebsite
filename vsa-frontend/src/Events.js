import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import api from './api';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.get('/api/events');
        if (!res.data.success) throw new Error(res.data.message || 'Failed to fetch events');
        setEvents(res.data.events);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) return <MainLayout><div className="p-8 text-center">Loading events...</div></MainLayout>;
  if (error) return <MainLayout><div className="p-8 text-center text-red-600">{error}</div></MainLayout>;

  return (
    <MainLayout>
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {events.map(event => (
          <Link to={`/events/${event.id}`} key={event.id} className="block bg-white rounded-lg shadow hover:shadow-lg transition">
            {event.image_url && (
              <img src={event.image_url} alt={event.name} className="w-full h-48 object-cover rounded-t-lg" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold">{event.name}</h2>
              <p className="text-gray-500">{event.date}</p>
              <p className="mt-2 text-gray-700">{event.description?.slice(0, 60)}...</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </MainLayout>
  );
}

export default Events;

