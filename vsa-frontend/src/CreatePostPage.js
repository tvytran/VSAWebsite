import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

// Point groups for dropdown (updated per chart)
const POINT_GROUPS = [
  {
    points: 2,
    activities: [
      'Dining hall meal',
      'Dorm/apartment hangout',
      'Anh/Chị–Em coffee or hangout',
      'Lawns/Steps hangout',
      'Study Session',
      'Workout Together',
      'Cafe Hang-Out (On campus: Joes, Cafe East, Lizs, etc.)',
    ],
  },
  {
    points: 3,
    activities: [
      'Attend VSA Event together (GBM, mixers)',
      'Group study session',
      'Attend another Columbia org event',
      'Volunteer/tabling on campus',
      'Workshop/Performance',
      'Movie Night',
    ],
  },
  {
    points: 5,
    activities: [
      'Game night (Hex & Co)',
      'Movie Theaters / Outdoor Movie Theaters',
      'Arts & crafts night',
      'Farmers market / neighborhood stroll',
      'Grocery run together (with shared activity)',
      'Cafe Hang-Out (Off campus)',
    ],
  },
  {
    points: 7,
    activities: [
      'Dinner/dessert downtown (Chinatown, K-town, etc.)',
      'Museum visit (Met/MoMA/AMNH)',
      'Picnic (Central Park/Roosevelt/Riverside)',
      'Karaoke night (booked room)',
      'NYC festival or night market',
      'Neighborhood explore (SoHo, DUMBO, Flushing)',
      'Go to New Jersey',
    ],
  },
  {
    points: 10,
    activities: [
      'Cook or bake together ',
      'Attend WEAI/EALAC/Cô Chung events',
      'Vietnam Consulate Tết Party',
      'Perform/MC/organize a cultural show',
      'Charity/volunteering together',
      'Plan & host a VSA family event',
      'Host Vietnamese dinner/potluck',
    ],
  },
  {
    points: 13,
    activities: [
      'Upstate / Rockaway / Bear Mountain day trip',
      'Out-of-state trip (excl. NJ)',
      'Apple/pumpkin picking',
      'Beach day or amusement park',
      'Concert / festival / Broadway',
      'Overnight trip or retreat',
    ],
  },
];

// Optional bonus tags (+1 each; cap +3). Special rules below
const BONUS_TAGS = [
  'Birthday celebration',
  'Homemade food',
  'Cultural holiday (Tết/Mid-Autumn)',
  'Grad photos together',
  'Performance/competition',
  'Unique event (eclipse/art show)',
  'Viet-themed (+3)'
];

function CreatePostPage() {
  const navigate = useNavigate();
  const { user: authUser, isLoggedIn } = useAuth();
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null); // For regular users' default family
  const [families, setFamilies] = useState([]); // For admin to select a family
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('hangout'); // Default to 'hangout'
  const [newPost, setNewPost] = useState('');
  const [pointValue, setPointValue] = useState('');
  const [image, setImage] = useState(null); // State to store the selected image file
  const [postError, setPostError] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false); // Add success state
  const [selectedFamilyId, setSelectedFamilyId] = useState(''); // State for admin's selected family
  const [membersPresent, setMembersPresent] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedBasePoints, setSelectedBasePoints] = useState(null);
  const [finalPoints, setFinalPoints] = useState(null);
  const [customActivity, setCustomActivity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPoints, setCustomPoints] = useState(1);
  const [selectedBonusTags, setSelectedBonusTags] = useState([]);
  const dropdownRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        // Fetch user profile
        const userRes = await api.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUser(userRes.data.user);

        // If user is admin, fetch all families for selection
        if (userRes.data.user.role === 'admin') {
          const familiesRes = await api.get('/api/families', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          setFamilies(familiesRes.data.families);
          if (familiesRes.data.families.length > 0) {
             setSelectedFamilyId(familiesRes.data.families[0].id);
          }
        } else if (userRes.data.user.family_id) {
          const familyRes = await api.get(`/api/families/${userRes.data.user.family_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setFamily(familyRes.data.family);
        } else {
          setError('You must be part of a family to create posts.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response?.data?.message || err.message);
        setError('Failed to load user or family info. Please log in again.');
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Refetch family/families on focus or family selection change to keep member count up to date
  useEffect(() => {
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      try {
        if (user?.role === 'admin' && selectedFamilyId) {
          // Refetch families for admin
          const familiesRes = await api.get('/api/families', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setFamilies(familiesRes.data.families);
        } else if (user?.family_id) {
          // Refetch family for regular user
          const familyRes = await api.get(`/api/families/${user.family_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setFamily(familyRes.data.family);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, selectedFamilyId]);

  // Refetch families when selectedFamilyId changes (for admin)
  useEffect(() => {
    const fetchSelectedFamily = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || user?.role !== 'admin' || !selectedFamilyId) return;
      try {
        const familiesRes = await api.get('/api/families', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFamilies(familiesRes.data.families);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchSelectedFamily();
  }, [selectedFamilyId, user]);

  // Debug: log family and families when relevant state changes
  useEffect(() => {
    console.log('FAMILY:', family);
    console.log('FAMILIES:', families);
  }, [family, families, membersPresent, selectedFamilyId]);

  // If membersPresent changes, clear activity selection and points
  useEffect(() => {
    setSelectedActivity('');
    setSelectedBasePoints(null);
    setFinalPoints(null);
    setPointValue('');
    setShowCustomInput(false);
    setCustomActivity('');
    setCustomPoints(1);
    setSelectedBonusTags([]);
  }, [membersPresent]);

  // Compute points including bonus tags (cap +3; Viet-themed is exclusive +3)
  const computePointsWithBonus = (basePoints, bonusOverride) => {
    const present = parseInt(membersPresent, 10) || 0;
    // Hard caps based on attendance and category
    if (present === 2) return 2; // absolute cap regardless of bonuses
    if (basePoints >= 3 && basePoints <= 7 && present < 3) return 2; // require >=3 members

    const base = calculatePoints(basePoints);
    const bonusList = Array.isArray(bonusOverride) ? bonusOverride : selectedBonusTags;
    if (!Array.isArray(bonusList) || bonusList.length === 0) return base;
    const VIET_TAG = 'Viet-themed (+3)';
    const hasViet = bonusList.includes(VIET_TAG);
    // Viet-themed is exclusive and always +3; others are +1 each up to +3
    const extraFromViet = hasViet ? 3 : 0;
    const otherCount = hasViet ? 0 : bonusList.length;
    const extraFromOthers = Math.min(3, otherCount);
    const totalExtra = Math.min(3, extraFromViet > 0 ? 3 : extraFromOthers);
    const total = base + totalExtra;

    // If category is 10–13 and exactly 3 members, cap total at 7
    if (basePoints >= 10 && basePoints <= 13 && present === 3) {
      return Math.min(total, 7);
    }
    // If category is 10–13 and <4 members (i.e., 1–3), enforce earlier rules
    if (basePoints >= 10 && basePoints <= 13 && present < 4) {
      // present === 2 handled above; present === 1 treat as 2 cap
      return present === 1 ? 2 : total;
    }

    return total;
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostLoading(true);

    // Validate image only for non-announcement posts
    if (newType !== 'announcement' && !image) {
      setPostError('Please select an image for your post.');
      setPostLoading(false);
      return;
    }

    const targetFamilyId = user?.role === 'admin' ? selectedFamilyId : family?.id;
    if (!targetFamilyId) {
      setPostError('Please select a family or join one to create a post.');
      setPostLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('type', newType);
    formData.append('content', newPost);
    formData.append('family_id', targetFamilyId);
    if (newType === 'hangout' && pointValue) {
        formData.append('pointValue', pointValue);
    }
    if (image) {
        formData.append('image', image);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setPostError('No authentication token.');
        setPostLoading(false);
        return;
      }
      await api.post('/api/posts', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      setNewTitle('');
      setNewType('hangout');
      setNewPost('');
      setPointValue('');
      setImage(null);
      setPostLoading(false);
      setPostSuccess(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Post creation error:', err.response?.data?.message || err.message);
      setPostError(err.response?.data?.message || 'Failed to create post.');
      setPostLoading(false);
    }
  };

  // Calculate points logic
  const calculatePoints = (basePoints) => {
    const present = parseInt(membersPresent, 10);
    const famSize = user?.role === 'admin' ? (families.find(f => f.id === selectedFamilyId)?.members?.length || 0) : (family?.members?.length || 0);
    if (present === 2) {
      if (basePoints >= 1 && basePoints <= 5) return 1;
      if (basePoints === 7) return 2;
      if (basePoints === 10) return 3;
      if (basePoints === 13) return 4;
      // For custom activities, if not matching above, just return 1
      return 1;
    }
    if (famSize && present < Math.ceil(famSize / 2)) return basePoints / 2;
    return basePoints;
  };

  // Handle selection
  const handleDropdownSelect = (group, activity) => {
    const basePoints = group.points;
    const points = computePointsWithBonus(basePoints);
    setSelectedActivity(`${group.points} - ${activity}`);
    setSelectedBasePoints(basePoints);
    setFinalPoints(points);
    setDropdownOpen(false);
    setOpenGroup(null);
    setPointValue(points); // For backend submission
  };

  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }

  // Render form only if user is not a regular user without a family
  // Admins can proceed even if they don't have a family assigned to their user object
  if (!user) {
       return <MainLayout><div>Error loading user data.</div></MainLayout>;
  }

   // If the user is a regular user and doesn't have a family
   if (user.role !== 'admin' && !family) {
      return <MainLayout><div className="text-red-600">You must be part of a family to create posts.</div></MainLayout>;
   }


  return (
    <MainLayout>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#b32a2a]">Create New Post</h2>
          <a href="/points-chart" className="text-sm text-[#b32a2a] underline hover:text-[#8a1f1f]">View points chart</a>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {postError && <div className="text-red-600 mb-4">{postError}</div>}

        {/* Conditional rendering based on postSuccess */}
        {postSuccess ? (
          <div className="text-center p-6 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
            <p className="text-lg font-semibold">Post created successfully!</p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                onClick={() => setPostSuccess(false)} // Reset to show the form again
              >
                Create Another Post
              </button>
               <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                onClick={() => navigate('/dashboard')} // Navigate to dashboard
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Original Form */
          <form onSubmit={handleCreatePost} className="flex flex-col gap-4">

            {/* Family Selection for Admin */}
            {user?.role === 'admin' && families.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familySelect">
                  Select Family:
                </label>
                <select
                  id="familySelect"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedFamilyId}
                  onChange={e => setSelectedFamilyId(e.target.value)}
                  required
                  disabled={postLoading}
                >
                  {families.map(fam => (
                    <option key={fam.id} value={fam.id}>{fam.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Display Family for Regular User */}
             {user?.role !== 'admin' && family && (
              <div className="mb-4">
                 <p className="block text-gray-700 text-sm font-bold mb-2">Posting to Family: {family.name}</p>
              </div>
            )}

            {/* Post Type Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postType">
                Post Type:
              </label>
              <select
                id="postType"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newType}
                onChange={e => setNewType(e.target.value)}
              >
                <option value="hangout">Hangout</option>
                {user?.role === 'admin' && <option value="announcement">Announcement</option>}
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title:
              </label>
              <input
                id="title"
                type="text"
                placeholder="Post Title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                Content:
              </label>
              <textarea
                id="content"
                placeholder="What's happening in your family?"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Member count and point dropdown for Hangout */}
            {newType === 'hangout' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">How many family members were present?</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={membersPresent}
                    onChange={e => setMembersPresent(e.target.value.replace(/[^0-9]/g, '').slice(0, 1))}
                    className="border rounded px-3 py-2 w-24"
                    placeholder="e.g. 4"
                  />
                </div>
                {membersPresent && parseInt(membersPresent, 10) > 0 && (
                  <>
                    <div className="mb-4 relative" ref={dropdownRef}>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Select activity and points:</label>
                      <button
                        type="button"
                        className="w-full border rounded px-4 py-3 bg-white text-left text-base"
                        onClick={() => setDropdownOpen(o => !o)}
                      >
                        {selectedActivity || 'Select activity and points'}
                      </button>
                      {dropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                          {POINT_GROUPS.map(group => (
                            <div key={group.points} className="relative">
                              <button
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-[#faecd8] font-semibold cursor-pointer text-base"
                                onClick={() => setOpenGroup(openGroup === group.points ? null : group.points)}
                              >
                                {group.points} point{group.points > 1 ? 's' : ''}
                              </button>
                              {openGroup === group.points && (
                                <div className="absolute left-0 top-full w-full bg-white border rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                                  {group.activities.map(activity => (
                                    <div
                                      key={activity}
                                      className="px-4 py-3 hover:bg-[#b32a2a] hover:text-white cursor-pointer text-base"
                                      onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomActivity('');
                                        handleDropdownSelect(group, activity);
                                      }}
                                    >
                                      {activity}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Custom activity option at the bottom */}
                          <div
                            className="px-4 py-3 hover:bg-[#b32a2a] hover:text-white cursor-pointer text-base font-semibold border-t border-gray-200"
                            onClick={() => {
                              setShowCustomInput(true);
                              setDropdownOpen(false);
                              setOpenGroup(null);
                              setSelectedActivity('');
                              setFinalPoints(null);
                            }}
                          >
                            Other (Custom activity)
                          </div>
                          {/* Close button for mobile */}
                          <button
                            type="button"
                            className="block w-full text-center py-2 text-[#b32a2a] font-bold sm:hidden"
                            onClick={() => { setDropdownOpen(false); setOpenGroup(null); }}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Custom activity input and points selection (always render if showCustomInput) */}
                    {showCustomInput && (
                      <div className="p-4 bg-gray-50 border rounded flex flex-col gap-2 mt-2">
                        <label className="font-semibold">Describe your activity:</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 text-base"
                          placeholder="Describe your activity"
                          value={customActivity}
                          onChange={e => setCustomActivity(e.target.value)}
                        />
                        <label className="font-semibold mt-2">Select points (1–13):</label>
                        <select
                          className="border rounded px-3 py-2 text-base"
                          value={customPoints}
                          onChange={e => setCustomPoints(Number(e.target.value))}
                        >
                          {[...Array(13)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="bg-[#b32a2a] text-white rounded px-4 py-2 font-bold hover:bg-[#8a1f1f] mt-2"
                          disabled={!customActivity.trim()}
                          onClick={() => {
                            setSelectedActivity(customActivity.trim());
                            setSelectedBasePoints(customPoints);
                            const pts = computePointsWithBonus(customPoints);
                            setFinalPoints(pts);
                            setShowCustomInput(false);
                            setPointValue(pts); // For backend submission
                          }}
                        >
                          Select
                        </button>
                      </div>
                    )}
                    {/* Bonus Tags */}
                    <div className="mt-4 p-4 bg-gray-50 border rounded">
                      <div className="font-semibold mb-2">Bonus tags (+1 each; cap +3)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {BONUS_TAGS.map(tag => {
                          const checked = selectedBonusTags.includes(tag);
                          const VIET_TAG = 'Viet-themed (+3)';
                          const vietSelected = selectedBonusTags.includes(VIET_TAG);
                          return (
                            <label key={tag} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  let next = selectedBonusTags;
                                  if (checked) {
                                    next = selectedBonusTags.filter(t => t !== tag);
                                  } else {
                                    if (tag === VIET_TAG) {
                                      // Viet-themed is exclusive; clear others
                                      next = [VIET_TAG];
                                    } else {
                                      if (vietSelected) {
                                        // ignore add when Viet-themed is selected
                                        next = selectedBonusTags;
                                      } else {
                                        next = [...selectedBonusTags, tag];
                                      }
                                    }
                                  }
                                  setSelectedBonusTags(next);
                                  // Recompute points using stored base points (supports custom)
                                  if (selectedBasePoints) {
                                    const pts = computePointsWithBonus(selectedBasePoints, next);
                                    setFinalPoints(pts);
                                    setPointValue(pts);
                                  }
                                }}
                              />
                              <span>{tag}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Bonuses apply to any hangout; total bonus is capped at +3. Viet-themed (+3) is exclusive and cannot be combined.</div>
                    </div>
                  </>
                )}
                {finalPoints !== null && (
                  <div className="mb-4 font-bold text-[#b32a2a]">
                    Points awarded for this hangout: {finalPoints}
                  </div>
                )}
              </>
            )}

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                Image {newType !== 'announcement' && <span className="text-red-500">*</span>}
                {newType === 'announcement' ? ' (Optional)' : ' (Required)'}
              </label>
              <input
                type="file"
                id="image"
                accept="image/*,.heic,.heif"
                onChange={(e) => setImage(e.target.files[0])}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required={newType !== 'announcement'}
                disabled={postLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                {newType === 'announcement' 
                  ? 'Optional: Upload an image for your announcement (JPG, PNG, GIF, or HEIC)'
                  : 'Please upload an image for your post (JPG, PNG, GIF, or HEIC)'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
              disabled={postLoading || (user?.role !== 'admin' && !family) || (user?.role === 'admin' && families.length === 0)} // Disable if loading, regular user without family, or admin with no families
            >
              {postLoading ? 'Creating...' : 'Create Post'}
            </button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}

export default CreatePostPage; 