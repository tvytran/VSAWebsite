import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import api from './api';


function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await api.get(`/api/events/${id}`);
        if (!res.data.success) throw new Error(res.data.message || 'Failed to fetch event');
        setEvent(res.data.event);
      } catch (err) {
        setError(err.message || 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) return <MainLayout><div className="p-8 text-center">Loading event...</div></MainLayout>;
  if (error) return <MainLayout><div className="p-8 text-center text-red-600">{error}</div></MainLayout>;
  if (!event) return <MainLayout><div className="p-8 text-center">Event not found.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl w-full mx-auto py-8">
        <div className="bg-white shadow overflow-hidden w-full rounded-2xl">
          <div className="w-full aspect-video bg-gray-100 rounded-t-2xl overflow-hidden">
            {event.image_url ? (
              <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="px-8 pb-8 pt-6">
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            <p className="text-gray-500 mb-2">{event.date}</p>
            <p className="mb-4">{event.description}</p>
            {event.drive_link && (
              <a href={event.drive_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                View Event Photos on Google Drive
              </a>
            )}
            <div className="mt-6">
              <Link to="/events" className="text-indigo-600 hover:underline">← Back to Events</Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default EventDetailPage; 