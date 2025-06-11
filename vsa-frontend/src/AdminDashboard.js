import React, { useState, useEffect } from 'react';
import api from './api';
import MainLayout from './MainLayout';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  // State for editing posts/announcements
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editPointValue, setEditPointValue] = useState('');

  // State for editing users
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editUserError, setEditUserError] = useState('');

  // State for editing families
  const [editingFamilyId, setEditingFamilyId] = useState(null);
  const [editFamilyName, setEditFamilyName] = useState('');
  const [editFamilyDescription, setEditFamilyDescription] = useState('');
  const [editFamilyError, setEditFamilyError] = useState('');
  const [editFamilyLoading, setEditFamilyLoading] = useState(false);

  // State for creating a new family
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyCode, setNewFamilyCode] = useState('');
  const [createFamilyLoading, setCreateFamilyLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        // Fetch users
        const usersRes = await api.get('/api/users', {
          headers: { 'x-auth-token': token }
        });
        setUsers(usersRes.data.users || []);
        // Fetch families
        const familiesRes = await api.get('/api/families', {
          headers: { 'x-auth-token': token }
        });
        setFamilies(familiesRes.data.families || []);
        // Fetch announcements
        const announcementsRes = await api.get('/api/posts/announcements', {
           headers: { 'x-auth-token': token }
        });
        setAnnouncements(announcementsRes.data.posts || []);
        // Fetch all posts for admin view
        const allPostsRes = await api.get('/api/posts/all', {
           headers: { 'x-auth-token': token }
        });
        setAllPosts(allPostsRes.data.posts || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
        if (err.response?.status === 403) {
          navigate('/dashboard');
        }
      }
    };
    fetchData();
  }, [navigate]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/users/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteFamily = async (familyId) => {
    if (!window.confirm('Are you sure you want to delete this family? This will also remove all associated posts and files.')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/families/${familyId}`, {
        headers: { 'x-auth-token': token }
      });
      setFamilies(families.filter(family => family.id !== familyId));
    } catch (err) {
      alert('Failed to delete family: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/posts/${announcementId}`, {
        headers: { 'x-auth-token': token }
      });
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    } catch (err) {
      alert('Failed to delete announcement: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      setAllPosts(allPosts.filter(post => post.id !== postId));
    } catch (err) {
      alert('Failed to delete post: ' + (err.response?.data?.message || err.message));
    }
  };

  // Functions for editing posts/announcements
  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditPointValue(post.point_value?.toString() || '');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditPointValue('');
    setEditError('');
  };

  const handleEditPost = async (e, postId) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/posts/${postId}`, {
        title: editTitle,
        content: editContent,
        ...(allPosts.find(post => post.id === postId)?.type === 'hangout' && { pointValue: editPointValue }),
      }, {
        headers: { 'x-auth-token': token }
      });
      if (res.data.success) {
         const updatedPost = res.data.post;
         if (updatedPost.type === 'announcement') {
            setAnnouncements(announcements.map(ann => ann.id === postId ? updatedPost : ann));
         } else {
            setAllPosts(allPosts.map(post => post.id === postId ? updatedPost : post));
         }
      }
      setEditLoading(false);
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      setEditPointValue('');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  // Functions for editing users
  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditUserError('');
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditEmail('');
    setEditRole('');
    setEditUserError('');
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditUserError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/users/${editingUserId}`, {
        username: editUsername,
        email: editEmail,
        role: editRole
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setUsers(users.map(user => user.id === editingUserId ? res.data.user : user));
        setEditLoading(false);
        setEditingUserId(null);
        setEditUsername('');
        setEditEmail('');
        setEditRole('');
      }
    } catch (err) {
      setEditUserError(err.response?.data?.message || 'Failed to edit user.');
      setEditLoading(false);
    }
  };

  // Functions for editing families
  const startEditFamily = (family) => {
    setEditingFamilyId(family.id);
    setEditFamilyName(family.name);
    setEditFamilyDescription(family.description || '');
    setEditFamilyError('');
  };

  const cancelEditFamily = () => {
    setEditingFamilyId(null);
    setEditFamilyName('');
    setEditFamilyDescription('');
    setEditFamilyError('');
  };

  const handleEditFamily = async (e) => {
    e.preventDefault();
    setEditFamilyError('');
    setEditFamilyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/families/${editingFamilyId}`, {
        name: editFamilyName,
        description: editFamilyDescription
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setFamilies(families.map(family => family.id === editingFamilyId ? res.data.family : family));
        setEditFamilyLoading(false);
        setEditingFamilyId(null);
        setEditFamilyName('');
        setEditFamilyDescription('');
      }
    } catch (err) {
      setEditFamilyError(err.response?.data?.message || 'Failed to edit family.');
      setEditFamilyLoading(false);
    }
  };

  const renderPoints = (points) => {
    if (!points) return '0';
    return points.toString();
  };

  const renderFamilyPoints = (family) => {
    if (!family) return '0';
    return `${family.total_points || 0} (${family.semester_points || 0})`;
  };

  // Add the CreateFamilyModal component
  const CreateFamilyModal = ({ isOpen, onClose, onSubmit, loading }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Family</h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                Family Name
              </label>
              <input
                type="text"
                id="familyName"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="familyCode" className="block text-sm font-medium text-gray-700">
                Family Code
              </label>
              <input
                type="text"
                id="familyCode"
                value={newFamilyCode}
                onChange={(e) => setNewFamilyCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Add the handleCreateFamily function
  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setCreateFamilyLoading(true);
    try {
      const res = await api.post('/api/families', {
        name: newFamilyName,
        code: newFamilyCode
      });
      setFamilies([...families, res.data]);
      setShowCreateFamilyModal(false);
      setNewFamilyName('');
      setNewFamilyCode('');
    } catch (err) {
      console.error('Error creating family:', err);
      setError('Failed to create family. Please try again.');
    } finally {
      setCreateFamilyLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-2xl text-[#b32a2a]">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-2xl text-red-600">{error}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-[#b32a2a]">Admin Dashboard</h1>
            <p className="mt-2 text-base text-gray-700">
              Manage users, families, announcements, and posts in the VSA community.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-[#b32a2a] text-[#b32a2a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('families')}
              className={`${
                activeTab === 'families'
                  ? 'border-[#b32a2a] text-[#b32a2a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Families
            </button>
            <button
              onClick={() => setActiveTab('allPosts')}
              className={`${
                activeTab === 'allPosts'
                  ? 'border-[#b32a2a] text-[#b32a2a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              All Posts
            </button>
          </nav>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="mt-8 flow-root">
            <div className="-my-2 overflow-x-auto">
              <div className="inline-block py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="divide-y divide-gray-300 table-fixed w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-1/4">
                          User
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/4">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Role
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Family
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6 w-[100px]">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.map((user, userIdx) => (
                        <tr key={user.id} className={userIdx % 2 === 0 ? undefined : 'bg-gray-50'}>
                          {editingUserId === user.id ? (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4 overflow-hidden text-ellipsis">
                                <input
                                  type="text"
                                  value={editUsername}
                                  onChange={(e) => setEditUsername(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/4 overflow-hidden text-ellipsis">
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-1/6 overflow-hidden text-ellipsis">
                                {user.families?.name || 'No family'}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[100px]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={handleEditUser}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    disabled={editLoading}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditUser}
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={editLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4 overflow-hidden text-ellipsis">
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-gray-500 text-xs">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/4 overflow-hidden text-ellipsis">
                                {user.email}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  user.role === 'admin' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role || 'member'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-1/6 overflow-hidden text-ellipsis">
                                {user.families?.name || 'No family'}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[100px]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => startEditUser(user)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Families Tab Content */}
        {activeTab === 'families' && (
          <div className="mt-8 flow-root">
            <div className="-my-2 overflow-x-auto">
              <div className="inline-block py-2 align-middle md:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Families</h2>
                    <p className="mt-2 text-sm text-gray-700">
                      Manage family information and view family points
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateFamilyModal(true)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                  >
                    Create Family
                  </button>
                </div>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="divide-y divide-gray-300 table-fixed w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[30%]">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-[15%]">
                          Code
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-[15%]">
                          Members
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-[20%]">
                          Points
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6 w-[20%]">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {families.map((family, familyIdx) => (
                        <tr key={family.id} className={familyIdx % 2 === 0 ? undefined : 'bg-gray-50'}>
                          {editingFamilyId === family.id ? (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-[30%]">
                                <input
                                  type="text"
                                  value={editFamilyName}
                                  onChange={(e) => setEditFamilyName(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editFamilyLoading}
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {family.code || 'No code'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                {family.members?.length || 0} members
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[20%]">
                                {renderFamilyPoints(family)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[20%]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={handleEditFamily}
                                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={editFamilyLoading}
                                  >
                                    {editFamilyLoading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditFamily}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={editFamilyLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-[30%]">
                                <div className="font-medium text-gray-900">{family.name || 'Unnamed Family'}</div>
                                <div className="text-gray-500 text-xs">Created {new Date(family.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {family.code || 'No code'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                {family.members?.length || 0} members
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[20%]">
                                {renderFamilyPoints(family)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[20%]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => startEditFamily(family)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFamily(family.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Posts Tab Content */}
        {activeTab === 'allPosts' && (
          <div className="mt-8 flow-root">
            <div className="-my-2 overflow-x-auto">
              <div className="inline-block py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="divide-y divide-gray-300 table-fixed w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-1/4">
                          Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Type
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Family
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Points
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">
                          Date
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6 w-[100px]">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {allPosts.map((post, postIdx) => (
                        <tr key={post.id} className={postIdx % 2 === 0 ? undefined : 'bg-gray-50'}>
                          {editingPostId === post.id ? (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4 overflow-hidden text-ellipsis">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  post.type === 'announcement' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : post.type === 'hangout'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {post.type}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {post.family?.name || 'No family'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {post.type === 'hangout' && (
                                  <input
                                    type="number"
                                    value={editPointValue}
                                    onChange={(e) => setEditPointValue(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                    disabled={editLoading}
                                    min="0"
                                  />
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {new Date(post.created_at).toLocaleDateString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[100px]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={handleEditPost}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    disabled={editLoading}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={editLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4 overflow-hidden text-ellipsis">
                                <div className="font-medium text-gray-900">{post.title}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  post.type === 'announcement' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : post.type === 'hangout'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {post.type}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {post.family?.name || 'No family'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {post.type === 'hangout' ? (post.point_value || 0) : '-'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                                {new Date(post.created_at).toLocaleDateString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[100px]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => startEdit(post)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post/Announcement Form - Conditionally rendered */}
        {editingPostId && (
           <div className="mt-8 p-6 bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Edit Post or Announcement</h2>
              {editError && <div className="text-red-600 mb-4 text-sm">{editError}</div>}
              <form onSubmit={(e) => handleEditPost(e, editingPostId)} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                     type="text"
                     id="editTitle"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                     value={editTitle}
                     onChange={e => setEditTitle(e.target.value)}
                     required
                     disabled={editLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editContent" className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    id="editContent"
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    required
                    disabled={editLoading}
                  ></textarea>
                </div>
                {allPosts.find(post => post.id === editingPostId)?.type === 'hangout' && (
                   <div>
                     <label htmlFor="editPointValue" className="block text-sm font-medium text-gray-700">Point Value</label>
                     <input
                       type="number"
                       id="editPointValue"
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                       value={editPointValue}
                       onChange={e => setEditPointValue(e.target.value)}
                       required
                       disabled={editLoading}
                       min="0"
                     />
                   </div>
                )}
                <div className="flex justify-end space-x-4">
                   <button
                     type="button"
                     onClick={cancelEdit}
                     className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={editLoading}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="rounded-md border border-transparent bg-[#b32a2a] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#8a1f1f] focus:outline-none focus:ring-2 focus:ring-[#b32a2a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={editLoading}
                   >
                     {editLoading ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </form>
           </div>
        )}

        {/* Add the CreateFamilyModal component */}
        <CreateFamilyModal
          isOpen={showCreateFamilyModal}
          onClose={() => setShowCreateFamilyModal(false)}
          onSubmit={handleCreateFamily}
          loading={createFamilyLoading}
        />
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;