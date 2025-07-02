import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import api from './api';
import ImageCropperModal from './components/ImageCropperModal';
import { supabase } from './supabaseClient';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    drive_link: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }
        const res = await api.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsAdmin(res.data.user.role === 'admin');
      } catch (err) {
        console.error('Failed to check admin status:', err);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }
        const res = await api.get('/api/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEvents(res.data.events || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!imageFile) {
      setFormError('Please upload an event image.');
      setFormLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        navigate('/login');
        return;
      }
      const data = new FormData();
      data.append('name', formData.name);
      data.append('date', formData.date);
      data.append('description', formData.description);
      data.append('drive_link', formData.drive_link);
      data.append('image', imageFile);
      const res = await api.post('/api/events', data, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.data.success) {
        setEvents([res.data.event, ...events]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          date: '',
          description: '',
          drive_link: '',
        });
        setImageFile(null);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!imageFile && !existingImageUrl) {
      setFormError('Please upload an event image.');
      setFormLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        navigate('/login');
        return;
      }
      const data = new FormData();
      data.append('name', formData.name);
      data.append('date', formData.date);
      data.append('description', formData.description);
      data.append('drive_link', formData.drive_link);
      if (imageFile) {
        data.append('image', imageFile);
      }
      const res = await api.put(`/api/events/${editingEventId}`, data, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.data.success) {
        setEvents(events.map(event => 
          event.id === editingEventId ? res.data.event : event
        ));
        setEditingEventId(null);
        setFormData({
          name: '',
          date: '',
          description: '',
          drive_link: '',
        });
        setImageFile(null);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await api.delete(`/api/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data.success) {
        setEvents(events.filter(event => event.id !== eventId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const startEdit = (event) => {
    setEditingEventId(event.id);
    setFormData({
      name: event.name,
      date: event.date,
      description: event.description || '',
      drive_link: event.drive_link || '',
    });
    setImageFile(null);
    setExistingImageUrl(event.image_url || '');
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setFormData({
      name: '',
      date: '',
      description: '',
      drive_link: '',
    });
    setImageFile(null);
    setExistingImageUrl('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob) => {
    setImageFile(new File([croppedBlob], 'event-image.jpeg', { type: 'image/jpeg' }));
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCropperCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  if (loading) return <MainLayout><div className="p-8 text-center">Loading events...</div></MainLayout>;
  if (error) return <MainLayout><div className="p-8 text-center text-red-600">{error}</div></MainLayout>;

  const renderEventForm = (isEditing = false) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}
      {showCropper && imageToCrop && (
        <ImageCropperModal
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropperCancel}
          aspect={16 / 9}
          circularCrop={false}
        />
      )}
      <form onSubmit={isEditing ? handleEditEvent : handleCreateEvent}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b32a2a] focus:ring-[#b32a2a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b32a2a] focus:ring-[#b32a2a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b32a2a] focus:ring-[#b32a2a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Google Drive Link (optional)</label>
            <input
              type="url"
              name="drive_link"
              value={formData.drive_link}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b32a2a] focus:ring-[#b32a2a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Image <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleImageChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b32a2a] focus:ring-[#b32a2a]"
              disabled={formLoading}
              required={!isEditing || (!imageFile && !existingImageUrl)}
            />
            {imageFile && (
              <div className="mt-2 text-sm text-gray-600">
                Selected file: {imageFile.name}
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="mt-2 rounded w-full max-w-md aspect-video object-cover" />
              </div>
            )}
            {!imageFile && existingImageUrl && (
              <div className="mt-2">
                <img src={existingImageUrl} alt="Current Event" className="h-24 rounded aspect-video object-cover" />
                <div className="text-xs text-gray-500">Current event image</div>
              </div>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-[#b32a2a] text-white px-4 py-2 rounded-md hover:bg-[#8a2121] transition-colors disabled:opacity-50"
            >
              {formLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Events</h1>
          {isAdmin && !editingEventId && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#b32a2a] text-white px-4 py-2 rounded-md hover:bg-[#8a2121] transition-colors"
            >
              {showCreateForm ? 'Cancel' : 'Create Event'}
            </button>
          )}
        </div>

        {showCreateForm && isAdmin && !editingEventId && renderEventForm(false)}
        {editingEventId && isAdmin && renderEventForm(true)}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event.id} className="block bg-white rounded-lg shadow hover:shadow-lg transition relative">
              {isAdmin && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => startEdit(event)}
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                    title="Edit Event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                    title="Delete Event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
              <Link to={`/events/${event.id}`} className="block">
                {event.image_url && (
                  <div className="w-full aspect-video rounded-t-lg overflow-hidden bg-gray-100">
                    <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <p className="text-gray-500">{event.date}</p>
                  <p className="mt-2 text-gray-700">{event.description?.slice(0, 60)}...</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Events;

