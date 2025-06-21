import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import MainLayout from './MainLayout';
import { useNavigate, Link } from 'react-router-dom';
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminDashboardActiveTab') || 'users');
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('token'));
  const scrollRestored = useRef(false);

  // State for editing posts/announcements
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editPointValue, setEditPointValue] = useState('');

  // State for editing users
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserFamily, setEditUserFamily] = useState('');
  const [editUserError, setEditUserError] = useState('');

  // State for editing families
  const [editingFamilyId, setEditingFamilyId] = useState(null);
  const [editFamilyName, setEditFamilyName] = useState('');
  const [editFamilyDescription, setEditFamilyDescription] = useState('');
  const [editFamilyError, setEditFamilyError] = useState('');
  const [editFamilyLoading, setEditFamilyLoading] = useState(false);
  const [selectedFamilyFile, setSelectedFamilyFile] = useState(null);
  const [deleteFamilyPhoto, setDeleteFamilyPhoto] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState(() => localStorage.getItem('adminDashboardUserSearch') || '');
  const [postSearchTerm, setPostSearchTerm] = useState(() => localStorage.getItem('adminDashboardPostSearch') || '');

  // Filtered users
  const filteredUsers = users.filter(user => {
    const term = userSearchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  // Filtered posts
  const filteredPosts = allPosts.filter(post => {
    const term = postSearchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      (post.author_name && post.author_name.toLowerCase().includes(term)) ||
      (post.family?.name && post.family.name.toLowerCase().includes(term))
    );
  });

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
    console.log('Starting edit for post:', post);
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
    setEditLoading(false);
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setEditError('No authentication token found');
      return;
    }
    try {
      setEditError('');
      setEditLoading(true);
      const postToEdit = allPosts.find(p => p.id === editingPostId);
      if (!postToEdit) throw new Error('Post not found');
      const updateData = {
        title: editTitle,
        content: editContent,
      };
      if (postToEdit.type === 'hangout') {
        const points = parseInt(editPointValue);
        if (isNaN(points) || points < 0) throw new Error('Points must be a non-negative number');
        updateData.pointValue = points;
      }
      const res = await api.put(`/api/posts/${editingPostId}`, updateData, {
        headers: { 'x-auth-token': token }
      });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to update post');
      }
      setAllPosts(prev => prev.map(post => post.id === editingPostId ? res.data.post : post));
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      setEditPointValue('');
      setEditError('');
      setEditLoading(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update post');
      setEditLoading(false);
    }
  };

  // Functions for editing users
  const startEditUser = (user) => {
    console.log('Starting edit for user:', user);
    setEditingUserId(user.id);
    setEditUserRole(user.role);
    setEditUserFamily(user.families?.id || '');
    setEditUserError('');
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserRole('');
    setEditUserFamily('');
    setEditUserError('');
    setEditLoading(false);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    console.log('Starting user edit with:', {
      userId: editingUserId,
      newRole: editUserRole,
      newFamily: editUserFamily,
      currentUser: users.find(u => u.id === editingUserId)
    });

    setEditUserError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // First update the role if it has changed
      const currentUser = users.find(u => u.id === editingUserId);
      if (editUserRole && editUserRole !== currentUser.role) {
        console.log('Updating role to:', editUserRole);
        try {
          const roleRes = await api.put(`/api/users/${editingUserId}/role`, {
            role: editUserRole
          }, {
            headers: { 'x-auth-token': token }
          });
          console.log('Role update response:', roleRes.data);
          if (!roleRes.data.success) {
            throw new Error(roleRes.data.message || 'Failed to update user role');
          }
        } catch (roleErr) {
          console.error('Role update error:', roleErr);
          throw new Error(`Role update failed: ${roleErr.message}`);
        }
      }

      // Then update the family if it has changed
      const currentFamilyId = currentUser.families?.id;
      if (editUserFamily !== currentFamilyId) {
        console.log('Updating family from:', currentFamilyId, 'to:', editUserFamily);
        try {
          let familyCode = null;
          if (editUserFamily) {
            const selectedFamily = families.find(f => f.id === editUserFamily);
            if (!selectedFamily) {
              throw new Error('Selected family not found');
            }
            familyCode = selectedFamily.code;
          }

          console.log('Sending family update with code:', familyCode);
          const familyRes = await api.put('/api/auth/user/family', {
            userId: editingUserId,
            familyCode: familyCode
          }, {
            headers: { 'x-auth-token': token }
          });
          console.log('Family update response:', familyRes.data);

          if (!familyRes.data.success) {
            throw new Error(familyRes.data.message || 'Failed to update user family');
          }
        } catch (familyErr) {
          console.error('Family update error:', familyErr);
          throw new Error(`Family update failed: ${familyErr.message}`);
        }
      }

      // Update the users list with the new data
      console.log('Updating local state with new user data');
      setUsers(users.map(user => {
        if (user.id === editingUserId) {
          const updatedFamily = editUserFamily ? families.find(f => f.id === editUserFamily) : null;
          const updatedUser = {
            ...user,
            role: editUserRole || user.role,
            families: updatedFamily
          };
          console.log('Updated user data:', updatedUser);
          return updatedUser;
        }
        return user;
      }));

      // Reset edit state
      console.log('Resetting edit state');
      setEditingUserId(null);
      setEditUserRole('');
      setEditUserFamily('');
      setEditUserError('');
    } catch (err) {
      console.error('Error in handleEditUser:', err);
      setEditUserError(err.response?.data?.message || err.message || 'Failed to update user. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Functions for editing families
  const startEditFamily = (family) => {
    setEditingFamilyId(family.id);
    setEditFamilyName(family.name);
    setEditFamilyDescription(family.description || '');
    setEditFamilyError('');
    setSelectedFamilyFile(null);
    setDeleteFamilyPhoto(false);
  };

  const cancelEditFamily = () => {
    setEditingFamilyId(null);
    setEditFamilyName('');
    setEditFamilyDescription('');
    setEditFamilyError('');
    setEditFamilyLoading(false);
    setSelectedFamilyFile(null);
    setDeleteFamilyPhoto(false);
  };

  const handleFamilyFileChange = (event) => {
    setSelectedFamilyFile(event.target.files[0]);
    setEditFamilyError('');
  };

  const handleEditFamily = async (e) => {
    e.preventDefault();
    setEditFamilyError('');
    setEditFamilyLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Updating family:', {
        id: editingFamilyId,
        name: editFamilyName,
        hasFile: !!selectedFamilyFile,
        currentFamily: families.find(f => f.id === editingFamilyId)
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', editFamilyName);
      if (editFamilyDescription) {
        formData.append('description', editFamilyDescription);
      }
      if (selectedFamilyFile) {
        formData.append('familyPicture', selectedFamilyFile);
      }
      if (deleteFamilyPhoto) {
        formData.append('deletePhoto', 'true');
      }

      const res = await api.put(`/api/families/${editingFamilyId}`, formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to update family');
      }

      // Update the families list with the new data
      setFamilies(families.map(family => {
        if (family.id === editingFamilyId) {
          return {
            ...family,
            name: editFamilyName,
            description: editFamilyDescription,
            family_picture: deleteFamilyPhoto ? null : (res.data.family.family_picture || family.family_picture)
          };
        }
        return family;
      }));

      // Reset edit state
      setEditingFamilyId(null);
      setEditFamilyName('');
      setEditFamilyDescription('');
      setSelectedFamilyFile(null);
      setDeleteFamilyPhoto(false);
      setEditFamilyError('');
    } catch (err) {
      console.error('Error updating family:', err);
      setEditFamilyError(err.response?.data?.message || err.message || 'Failed to update family. Please try again.');
    } finally {
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

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('adminDashboardActiveTab', activeTab);
  }, [activeTab]);

  // Save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem('adminDashboardScroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after data loads and tab is set
  useEffect(() => {
    if (!loading && !scrollRestored.current) {
      const savedScroll = localStorage.getItem('adminDashboardScroll');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
      scrollRestored.current = true;
    }
  }, [loading, activeTab]);

  // Save user search term
  useEffect(() => {
    localStorage.setItem('adminDashboardUserSearch', userSearchTerm);
  }, [userSearchTerm]);

  // Save post search term
  useEffect(() => {
    localStorage.setItem('adminDashboardPostSearch', postSearchTerm);
  }, [postSearchTerm]);

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
            <div className="mb-4 flex justify-start pl-4 sm:pl-6">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>
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
                      {filteredUsers.map((user, userIdx) => (
                        <tr key={user.id} className={userIdx % 2 === 0 ? undefined : 'bg-gray-50'}>
                          {editingUserId === user.id ? (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4">
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-gray-500 text-xs">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/4">
                                {user.email}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6">
                                <select
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6">
                                <select
                                  value={editUserFamily}
                                  onChange={(e) => setEditUserFamily(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                  disabled={editLoading}
                                >
                                  <option value="">No Family</option>
                                  {families.map(family => (
                                    <option key={family.id} value={family.id}>
                                      {family.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[100px]">
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={(e) => handleEditUser(e)}
                                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={editLoading}
                                  >
                                    {editLoading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditUser}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={editLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4">
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-gray-500 text-xs">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/4">
                                {user.email}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6">
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
                  <Link
                    to="/create-family"
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#b32a2a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#8a1f1f] focus:outline-none focus:ring-2 focus:ring-[#b32a2a] focus:ring-offset-2 sm:w-auto"
                  >
                    Create Family
                  </Link>
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
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editFamilyName}
                                    onChange={(e) => setEditFamilyName(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                    disabled={editFamilyLoading}
                                    placeholder="Family name"
                                  />
                                  <textarea
                                    value={editFamilyDescription}
                                    onChange={(e) => setEditFamilyDescription(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                    disabled={editFamilyLoading}
                                    placeholder="Family description (optional)"
                                    rows="2"
                                  />
                                  <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">
                                      Family Photo:
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*,.heic,.heif"
                                      onChange={handleFamilyFileChange}
                                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#b32a2a] file:text-white hover:file:bg-[#8a1f1f]"
                                      disabled={editFamilyLoading}
                                    />
                                    {selectedFamilyFile && (
                                      <div className="text-xs text-gray-600">
                                        Selected: {selectedFamilyFile.name}
                                      </div>
                                    )}
                                    {(family.family_picture || selectedFamilyFile) && (
                                      <div className="mt-2">
                                        <img
                                          src={selectedFamilyFile ? URL.createObjectURL(selectedFamilyFile) : family.family_picture}
                                          alt="Family preview"
                                          className="w-12 h-12 object-cover rounded border"
                                        />
                                      </div>
                                    )}
                                    {family.family_picture && !selectedFamilyFile && (
                                      <div className="mt-2 flex items-center space-x-2">
                                        <label className="flex items-center space-x-1 text-xs text-red-600">
                                          <input
                                            type="checkbox"
                                            checked={deleteFamilyPhoto}
                                            onChange={(e) => setDeleteFamilyPhoto(e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            disabled={editFamilyLoading}
                                          />
                                          <span>Delete current photo</span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {family.code || 'No code'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                {users.filter(user => user.families_id === family.id).length} members
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[20%]">
                                {renderFamilyPoints(family)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-[20%]">
                                <div className="flex flex-col items-end space-y-2">
                                  {editFamilyError && (
                                    <div className="text-red-600 text-xs text-right max-w-xs">
                                      {editFamilyError}
                                    </div>
                                  )}
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
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-[30%]">
                                <div className="flex items-center space-x-3">
                                  {family.family_picture ? (
                                    <img
                                      src={family.family_picture}
                                      alt={family.name}
                                      className="w-10 h-10 object-cover rounded-full border-2 border-[#b32a2a]"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#b32a2a] flex items-center justify-center text-white text-sm font-bold border-2 border-[#b32a2a]">
                                      {family.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{family.name || 'Unnamed Family'}</div>
                                    <div className="text-gray-500 text-xs">Created {new Date(family.created_at).toLocaleDateString()}</div>
                                    {family.description && (
                                      <div className="text-gray-500 text-xs mt-1">{family.description}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {family.code || 'No code'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm w-[15%]">
                                {users.filter(user => user.family_id === family.id).length} members
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
            <div className="mb-4 flex justify-start pl-4 sm:pl-6">
              <input
                type="text"
                placeholder="Search posts..."
                value={postSearchTerm}
                onChange={e => setPostSearchTerm(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>
            <div className="-my-2 overflow-x-auto">
              <div className="inline-block py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="divide-y divide-gray-300 table-fixed w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-1/4">Title</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">Type</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">Family</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">Points</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/6">Date</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6 w-[100px]">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>  
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredPosts.map((post, postIdx) => (
                        <tr key={post.id} className={postIdx % 2 === 0 ? undefined : 'bg-gray-50'}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-1/4 overflow-hidden text-ellipsis">
                            <Link
                              to={`/post/${post.id}`}
                              className="font-medium text-[#b32a2a] hover:underline hover:text-[#8a1f1f] transition-colors"
                            >
                              {post.title}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm w-1/6 overflow-hidden text-ellipsis">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${post.type === 'announcement' ? 'bg-blue-100 text-blue-800' : post.type === 'hangout' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}> 
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
                              <button onClick={() => startEdit(post)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                              <button onClick={() => handleDeletePost(post.id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </div>
                          </td>
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
            <form onSubmit={handleEditPost} className="flex flex-col gap-4">
              <div>
                <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="editTitle"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  disabled={editLoading}
                ></textarea>
              </div>
              {allPosts.find(post => post.id === editingPostId)?.type === 'hangout' && (
                <div>
                  <label htmlFor="editPoints" className="block text-sm font-medium text-gray-700">Point Value</label>
                  <input
                    type="number"
                    id="editPoints"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    value={editPointValue}
                    onChange={(e) => setEditPointValue(e.target.value)}
                    min="0"
                    max="13"
                    disabled={editLoading}
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
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;