import express from 'express';
import protect from '../middleware/auth.js';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';

const router = express.Router();

const SEED_THREADS = [
  {
    title: 'Tata Nexon EV Max: Real world highway range test results',
    name: 'Rohan Mehta',
    tag: 'Range Test',
    text: 'Tested Nexon EV on Mumbai-Pune Expressway. Got an average consumption of 145 Wh/km with 80 km/h constant cruising and AC at 24C.',
    replies: 0,
    likes: 112,
    likesUserIds: [],
    comments: []
  },
  {
    title: 'New 240kW VoltGrid chargers active in Powai Hiranandani',
    name: 'Ananya Goel',
    tag: 'Grid Update',
    text: 'Checked out the new high speed DC guns. Clean layout, charging speeds peaked at 82 kW on my MG ZS EV.',
    replies: 0,
    likes: 64,
    likesUserIds: [],
    comments: []
  },
  {
    title: 'Tips to protect battery SoC health during summer heat waves',
    name: 'Priya Sharma',
    tag: 'Battery Health',
    text: 'Avoid DC charging immediately after long drives. Let the pack cool down for 15-20 minutes first.',
    replies: 0,
    likes: 95,
    likesUserIds: [],
    comments: []
  }
];

// @route   GET /api/community/feed
// @desc    Get discussion board threads
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    let posts = await CommunityPost.find({}).sort({ createdAt: -1 });

    // Seed dummy forum threads if none exist in collection
    if (posts.length === 0) {
      const systemUser = await User.findById(req.user.id);
      const postsToSeed = SEED_THREADS.map(t => ({
        ...t,
        userId: systemUser ? systemUser._id : req.user.id
      }));
      await CommunityPost.insertMany(postsToSeed);
      posts = await CommunityPost.find({}).sort({ createdAt: -1 });
    }

    res.json({ success: true, feed: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching community feed' });
  }
});

// @route   POST /api/community/post
// @desc    Publish a new EV experience
// @access  Private
router.post('/post', protect, async (req, res) => {
  const { title, text, tag } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Post title cannot be empty.' });
  }

  // SEC-016: Enforce max length on community post content.
  if (title.trim().length > 200) {
    return res.status(400).json({ success: false, message: 'Post title must be 200 characters or fewer.' });
  }

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: 'Post text cannot be empty.' });
  }

  if (text.trim().length > 5000) {
    return res.status(400).json({ success: false, message: 'Post text must be 5000 characters or fewer.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const post = await CommunityPost.create({
      title,
      text,
      tag: tag || 'General',
      userId: user._id,
      name: user.name,
      avatar: user.profileImage || '',
      replies: 0,
      likes: 0,
      likesUserIds: [],
      comments: []
    });

    // SEC-027: Give 10 carbon points bonus, but cap at 50 community points per day.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const communityPointsToday = await CommunityPost.countDocuments({
      userId: user._id,
      createdAt: { $gte: todayStart }
    }) * 10; // each post = 10 pts
    if (communityPointsToday < 50) {
      user.points = (user.points || 0) + 10;
      await user.save();
    }

    // Broadcast new post in realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('community:post', { post: post.toJSON() });
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating post' });
  }
});

// @route   POST /api/community/post/:id/like
// @desc    Toggle like state of a post
// @access  Private
router.post('/post/:id/like', protect, async (req, res) => {
  try {
    // SEC-013: Fixed req.id (always undefined) -> req.params.id.
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userIdStr = req.user.id.toString();
    const hasLiked = post.likesUserIds.includes(userIdStr);

    if (hasLiked) {
      post.likesUserIds = post.likesUserIds.filter(id => id !== userIdStr);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likesUserIds.push(userIdStr);
      post.likes += 1;
    }

    await post.save();

    // Broadcast updated likes in realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('community:like', {
        postId: post._id.toString(),
        likes: post.likes,
        likesUserIds: post.likesUserIds
      });
    }

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating post likes' });
  }
});

// @route   POST /api/community/post/:id/comment
// @desc    Add a comment to a discussion thread
// @access  Private
router.post('/post/:id/comment', protect, async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
  }

  try {
    // SEC-013: Fixed req.id (always undefined) -> req.params.id.
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Appending comment
    post.comments.push({
      userId: user._id,
      name: user.name,
      avatar: user.profileImage || '',
      text
    });

    // Update replies counter
    post.replies = post.comments.length;

    await post.save();

    // SEC-027: Give 5 carbon points for commenting, capped at 10 comments per day per user.
    const todayStart2 = new Date();
    todayStart2.setHours(0, 0, 0, 0);
    // Count how many comments this user already made today across all posts (simple heuristic on current post)
    const recentCommentCount = post.comments.filter(c =>
      c.userId && c.userId.toString() === user._id.toString() &&
      c.createdAt && new Date(c.createdAt) >= todayStart2
    ).length;
    if (recentCommentCount <= 10) {
      user.points = (user.points || 0) + 5;
      await user.save();
    }

    // Broadcast updated comments in realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('community:comment', {
        postId: post._id.toString(),
        comments: post.comments,
        replies: post.replies
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully! You earned +5 Carbon Coins.',
      comments: post.comments,
      replies: post.replies,
      userPoints: user.points
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
});

export default router;
