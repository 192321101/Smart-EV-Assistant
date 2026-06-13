import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import { Users, Coins, MessageSquare, Heart, Leaf, Award, PenTool, X, ChevronDown, ChevronUp, Send, Loader } from 'lucide-react';

export default function Community() {
  const { user, token, updateUserPoints } = useAuth();
  const { socket } = useTelemetry();
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' or 'forum'
  
  // API base url
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_URL = `${BACKEND_URL}/api`;

  // Live states
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingLeader, setLoadingLeader] = useState(true);
  
  // Create post states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  // Comment states
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Fetch Feed
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await axios.get(`${API_URL}/community/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFeed(res.data.feed);
      }
    } catch (err) {
      console.warn('Community feed load error, falling back to mock threads.');
      setFeed([
        { id: 'mock-1', title: 'Tata Nexon EV Max: Real world highway range test results', name: 'Rohan Mehta', avatar: '', replies: 0, likes: 112, tag: 'Range Test', text: 'Tested Nexon EV on Mumbai-Pune Expressway. Got an average consumption of 145 Wh/km with 80 km/h constant cruising and AC at 24C.', time: '2 hours ago', likesUserIds: [], comments: [] },
        { id: 'mock-2', title: 'New 240kW VoltGrid chargers active in Powai Hiranandani', name: 'Ananya Goel', avatar: '', replies: 0, likes: 64, tag: 'Grid Update', text: 'Checked out the new high speed DC guns. Clean layout, charging speeds peaked at 82 kW on my MG ZS EV.', time: '5 hours ago', likesUserIds: [], comments: [] },
        { id: 'mock-3', title: 'Tips to protect battery SoC health during summer heat waves', name: 'Priya Sharma', avatar: '', replies: 0, likes: 95, tag: 'Battery Health', text: 'Avoid DC charging immediately after long drives. Let the pack cool down for 15-20 minutes first.', time: '1 day ago', likesUserIds: [], comments: [] }
      ]);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    setLoadingLeader(true);
    try {
      const res = await axios.get(`${API_URL}/rewards/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const mapped = res.data.leaderboard.map(item => ({
          rank: item.rank,
          name: item.name,
          points: item.points,
          badge: item.tier === 'gold' ? 'Eco Champion' : item.tier === 'silver' ? 'Grid Voyager' : 'Volt Explorer',
          location: item.tier === 'gold' ? 'Mumbai' : 'Pune'
        }));
        setLeaderboard(mapped);
      }
    } catch (err) {
      console.warn('Leaderboard load error, using default mock leaderboard.');
      setLeaderboard([
        { rank: 1, name: 'Priya Sharma', points: 1420, badge: 'Eco Champion', location: 'New Delhi' },
        { rank: 2, name: 'Rohan Mehta', points: 1250, badge: 'Grid Voyager', location: 'Mumbai' },
        { rank: 3, name: 'Ananya Goel', points: 1100, badge: 'Carbon Crusader', location: 'Bangalore' },
        { rank: 4, name: 'Vikram Singh', points: 950, badge: 'Volt Expert', location: 'Pune' },
      ]);
    } finally {
      setLoadingLeader(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeed();
      fetchLeaderboard();
    }
  }, [token]);

  // Socket.IO Real-time community listener subscriptions
  useEffect(() => {
    if (socket) {
      console.log('🔌 [Community Page] Subscribing to realtime feed socket events.');
      
      const handleNewPost = (data) => {
        setFeed(prev => {
          const pid = data.post.id || data.post._id;
          if (prev.some(p => (p.id || p._id) === pid)) return prev;
          return [data.post, ...prev];
        });
      };

      const handleLikeUpdate = (data) => {
        setFeed(prev => prev.map(p => {
          const pid = p.id || p._id;
          if (pid === data.postId) {
            return {
              ...p,
              likes: data.likes,
              likesUserIds: data.likesUserIds
            };
          }
          return p;
        }));
      };

      const handleCommentUpdate = (data) => {
        setFeed(prev => prev.map(p => {
          const pid = p.id || p._id;
          if (pid === data.postId) {
            return {
              ...p,
              comments: data.comments,
              replies: data.replies
            };
          }
          return p;
        }));
      };

      socket.on('community:post', handleNewPost);
      socket.on('community:like', handleLikeUpdate);
      socket.on('community:comment', handleCommentUpdate);

      return () => {
        socket.off('community:post', handleNewPost);
        socket.off('community:like', handleLikeUpdate);
        socket.off('community:comment', handleCommentUpdate);
      };
    }
  }, [socket]);

  // Rewards catalog items
  const rewardsList = [
    { id: 'rw_tree', title: 'Plant a Native Tree', cost: 200, icon: Leaf, desc: 'Pledge 200 Carbon Coins to plant a tree in the Western Ghats.', actionText: 'Plant Tree' },
    { id: 'rw_charger', title: '15% Off Charging Coupon', cost: 150, icon: Coins, desc: 'Get promo code green15 for 15% off next station billing.', actionText: 'Redeem Code' },
    { id: 'rw_vip', title: 'VIP Slot Reservation Pass', cost: 300, icon: Award, desc: 'Unlock early booking slots allocations at peak times.', actionText: 'Redeem Pass' }
  ];

  const handleRedeem = async (item) => {
    const points = user ? user.points : 0;
    if (points < item.cost) {
      alert(`Insufficient Carbon Coins! You need ${item.cost - points} more.`);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/rewards/redeem`, {
        pointsToRedeem: item.cost
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        updateUserPoints(-item.cost);
        alert(`Success! Redeemed: ${item.title}.\nPromo Code: ${res.data.couponCode}\n${res.data.message}`);
        fetchLeaderboard();
      }
    } catch (err) {
      console.warn('Backend redeem failed, falling back to mock points redemption.', err);
      updateUserPoints(-item.cost);
      alert(`Success! [Mock Mode Active] Redeemed: ${item.title}.\nYour coupon code is: VOLT-MOCK-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/community/post`, {
        title: newTitle,
        text: newContent,
        tag: newTag
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setNewTitle('');
        setNewContent('');
        setNewTag('General');
        setShowCreateForm(false);
        updateUserPoints(10);
        alert('Discussion posted successfully! You earned +10 Carbon Coins.');
        fetchLeaderboard();
      }
    } catch (err) {
      console.warn('Backend post creation failed, applying mock posting logic.');
      const newMockPost = {
        id: `mock-${Date.now()}`,
        title: newTitle,
        name: user?.name || 'Volt Driver',
        avatar: user?.profileImage || '',
        replies: 0,
        likes: 0,
        tag: newTag,
        text: newContent,
        time: 'Just now',
        likesUserIds: [],
        comments: []
      };
      setFeed(prev => [newMockPost, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewTag('General');
      setShowCreateForm(false);
      updateUserPoints(10);
      alert('Discussion posted! [Mock Mode Active] You earned +10 Carbon Coins.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await axios.post(`${API_URL}/community/post/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Socket event handles live feed state mutation
      }
    } catch (err) {
      console.warn('Backend like action failed, updating mock post likes in UI.');
      setFeed(prev => prev.map(p => {
        const pid = p.id || p._id;
        if (pid === postId) {
          const hasLiked = p.likesUserIds.includes('current-user');
          const nextLikes = hasLiked ? Math.max(0, p.likes - 1) : p.likes + 1;
          const nextUserIds = hasLiked ? p.likesUserIds.filter(id => id !== 'current-user') : [...p.likesUserIds, 'current-user'];
          return {
            ...p,
            likes: nextLikes,
            likesUserIds: nextUserIds
          };
        }
        return p;
      }));
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/community/post/${postId}/comment`, {
        text: commentText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCommentText('');
        updateUserPoints(5); // awarded points for commenting
        alert('Reply posted successfully! You earned +5 Carbon Coins.');
        fetchLeaderboard();
      }
    } catch (err) {
      console.warn('Backend comment post failed, writing mock comment in UI.');
      setFeed(prev => prev.map(p => {
        const pid = p.id || p._id;
        if (pid === postId) {
          const mockComment = {
            _id: `mock-c-${Date.now()}`,
            userId: user?._id || 'mock-user-123',
            name: user?.name || 'Volt Driver',
            avatar: user?.profileImage || '',
            text: commentText,
            createdAt: new Date().toISOString()
          };
          const updatedComments = p.comments ? [...p.comments, mockComment] : [mockComment];
          return {
            ...p,
            comments: updatedComments,
            replies: updatedComments.length
          };
        }
        return p;
      }));
      setCommentText('');
      updateUserPoints(5);
      alert('Reply posted! [Mock Mode Active] You earned +5 Carbon Coins.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            <span>Community</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Share EV logs, compete on leaderboard, and redeem carbon rewards
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rewards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Carbon Rewards
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'forum' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Discussion Forum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'rewards' ? (
            /* Tab: Carbon Rewards Catalogue */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-left">Redeemable Rewards Catalogue</h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                  <span>Your Coins: {user?.points || 0}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewardsList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="glass-panel p-5 rounded-3xl border border-slate-200/40 text-left flex flex-col justify-between min-h-[200px] bg-white/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                          <Icon className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-extrabold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 fill-amber-700" />
                          <span>{item.cost} Coins</span>
                        </span>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-base font-extrabold text-slate-800">{item.title}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRedeem(item)}
                        className="w-full mt-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                      >
                        {item.actionText}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab: Forum Discussions list */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-left">Active Discussion Boards</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    setExpandedPostId(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{showCreateForm ? 'Cancel' : 'New Post'}</span>
                </button>
              </div>

              {/* Create Post Dialog Panel */}
              {showCreateForm && (
                <form onSubmit={handleCreatePost} className="glass-panel p-5 rounded-3xl border border-indigo-200/50 text-left space-y-4 bg-white/70">
                  <h4 className="text-sm font-extrabold text-indigo-900 leading-none">Share an EV Experience</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic Title</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Tata Nexon Charging Speed Issue in Powai"
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tag Category</label>
                        <select
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                        >
                          <option value="General">General Discussion</option>
                          <option value="Range Test">Highway Range Test</option>
                          <option value="Grid Update">Grid & Chargers Update</option>
                          <option value="Battery Health">Battery & SoC Care</option>
                          <option value="Emergency">Emergency Alert</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discussion Context</label>
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Describe your range, charging experience, speeds, terrain, or warnings..."
                        rows={3}
                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all"
                  >
                    {submitting ? 'Posting...' : 'Publish Post (+10 Coins)'}
                  </button>
                </form>
              )}

              {loadingFeed ? (
                <div className="text-center py-12 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                  <Loader className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Loading discussion boards...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {feed.map((item) => {
                    const pid = item.id || item._id;
                    const hasLiked = item.likesUserIds?.includes(user?.id || user?._id || 'mock_driver_123') || item.likesUserIds?.includes('current-user');
                    const isExpanded = expandedPostId === pid;

                    return (
                      <div
                        key={pid}
                        onClick={(e) => {
                          if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
                          setExpandedPostId(isExpanded ? null : pid);
                        }}
                        className="glass-panel p-5 rounded-3xl border border-slate-200/40 text-left hover:border-indigo-400/50 hover:shadow-sm cursor-pointer transition-all bg-white/40"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {item.tag}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {item.time || 'Just now'}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-extrabold text-slate-800 mt-2.5 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {item.text}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-4">
                            {item.avatar || (item.userId === user?.id && user?.profileImage) ? (
                              <img
                                src={(item.userId === user?.id && user?.profileImage) ? `${BACKEND_URL}${user.profileImage}` : (item.avatar.startsWith('http') ? item.avatar : `${BACKEND_URL}${item.avatar}`)}
                                alt={item.name}
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-[9px]">
                                {item.name ? item.name.charAt(0) : 'E'}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Opened by {item.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/30">
                          <div className="flex gap-4">
                            <button
                              onClick={() => setExpandedPostId(isExpanded ? null : pid)}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              <span>{item.replies || 0} Replies</span>
                            </button>
                            
                            <button
                              onClick={() => handleLikePost(pid)}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <Heart className={`w-4 h-4 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                              <span>{item.likes} Likes</span>
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => setExpandedPostId(isExpanded ? null : pid)}
                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>{isExpanded ? 'Close Thread' : 'Join Discussion'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Expanded Realtime Thread Comments Block */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200/30 space-y-3 animate-fade-in text-xs">
                            <h5 className="font-bold text-slate-700">Comments ({item.comments?.length || 0})</h5>
                            
                            {/* Comments Listing */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {item.comments && item.comments.length > 0 ? (
                                item.comments.map((c, idx) => (
                                  <div key={c._id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                                    {c.avatar ? (
                                      <img
                                        src={c.avatar.startsWith('http') ? c.avatar : `${BACKEND_URL}${c.avatar}`}
                                        alt={c.name}
                                        className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0 text-[9px]">
                                        {c.name ? c.name.charAt(0) : 'D'}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                        <span>{c.name}</span>
                                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{c.text}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-slate-400 italic py-1">No comments yet. Start the conversation!</p>
                              )}
                            </div>

                            {/* Write Reply Form */}
                            <form onSubmit={(e) => handleAddComment(e, pid)} className="flex gap-2 pt-1.5">
                              <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a reply..."
                                required
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                              />
                              <button
                                type="submit"
                                disabled={commentSubmitting}
                                className="px-3 py-1.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 shadow hover:shadow-md transition-all shrink-0 text-xs"
                              >
                                {commentSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Leaderboard list */}
        <div className="space-y-4">
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 bg-white/70">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                <Award className="w-5 h-5 text-indigo-500 animate-bounce" />
                <span>Leaderboard Ranking</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                Top Carbon Savers this Month
              </p>
            </div>

            {loadingLeader ? (
              <div className="text-center py-6 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                <Loader className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading rankings...</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {leaderboard.map((item) => (
                  <div
                    key={item.rank}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
                      item.name === user?.name ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-200/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs select-none ${
                        item.rank === 1 ? 'bg-yellow-400 text-white shadow' :
                        item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        item.rank === 3 ? 'bg-orange-300 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.rank}
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">{item.name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">
                          {item.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-700 block">{item.points} pt</span>
                      <span className="text-[8px] font-bold text-emerald-600 block uppercase">{item.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
