import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV Community Feed, Likes, Comments & Sockets Test Flow...');
  
  try {
    // 1. Authenticate test driver
    console.log('\n🔐 [Auth] Logging in driver (test1@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const { accessToken, user: initialUser } = authRes.data;
    console.log(`✅ [Auth] Logged in successfully. Points: ${initialUser.points}`);
    
    // 2. Connect Socket.IO client to listen to realtime community updates
    console.log('\n📡 [Socket] Connecting to live streaming service...');
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken }
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('🔌 [Socket] Handshake completed successfully!');
        resolve();
      });
      socket.on('connect_error', (err) => {
        reject(err);
      });
    });

    // Subscribing to Socket events
    const receivedEvents = {
      post: null,
      like: null,
      comment: null
    };

    socket.on('community:post', (data) => {
      console.log(`📊 [Live Socket Event] community:post -> Title: "${data.post.title}"`);
      receivedEvents.post = data;
    });

    socket.on('community:like', (data) => {
      console.log(`📊 [Live Socket Event] community:like -> Post ID: ${data.postId}, Likes: ${data.likes}`);
      receivedEvents.like = data;
    });

    socket.on('community:comment', (data) => {
      console.log(`📊 [Live Socket Event] community:comment -> Post ID: ${data.postId}, Replies: ${data.replies}`);
      receivedEvents.comment = data;
    });

    // 3. Retrieve feed
    console.log('\n📖 [Feed] Fetching community discussions feed...');
    const feedRes = await axios.get(`${API_URL}/community/feed`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Feed] Found ${feedRes.data.feed.length} threads in feed.`);

    // 4. Create new thread & Verify points reward (+10)
    console.log('\n✍️ [Thread] Creating a new EV discussion post...');
    const initialPoints = initialUser.points;

    const createPostRes = await axios.post(`${API_URL}/community/post`, {
      title: 'Real world Tata Nexon charging speeds at Powai Hub',
      text: 'Peak speeds hit 82 kW on DC guns. Clean layout, charging was smooth.',
      tag: 'Grid Update'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const newPost = createPostRes.data.post;
    console.log(`✅ [Thread] Created post "${newPost.title}" (ID: ${newPost._id})`);

    // Verify User points incremented by 10
    const profileRes = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const afterPostPoints = profileRes.data.user.points;
    console.log(`✅ [Carbon Coins] Points: ${initialPoints} -> ${afterPostPoints} (+${afterPostPoints - initialPoints})`);
    if (afterPostPoints !== initialPoints + 10) {
      throw new Error('Posting discussions should reward +10 Carbon Coins!');
    }

    // Give socket 1 second to receive event
    await new Promise(r => setTimeout(r, 1000));
    if (!receivedEvents.post || receivedEvents.post.post._id !== newPost._id) {
      throw new Error('Socket.IO did not receive the realtime community:post event!');
    }
    console.log('✅ [Realtime Sync] Post creation broadcast verified via Socket.IO');

    // 5. Like the thread & Verify Socket like broadcast
    console.log(`\n❤️ [Like] Toggling like status on post ID ${newPost._id}...`);
    const likeRes = await axios.post(`${API_URL}/community/post/${newPost._id}/like`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Like] Post likes updated to: ${likeRes.data.likes}`);
    if (likeRes.data.likes !== 1) {
      throw new Error('Likes count should be 1 after liking!');
    }

    await new Promise(r => setTimeout(r, 1000));
    if (!receivedEvents.like || receivedEvents.like.postId !== newPost._id.toString() || receivedEvents.like.likes !== 1) {
      throw new Error('Socket.IO did not receive the correct community:like event!');
    }
    console.log('✅ [Realtime Sync] Post like broadcast verified via Socket.IO');

    // 6. Comment on the thread & Verify points reward (+5)
    console.log(`\n💬 [Comment] Submitting reply comment to post ID ${newPost._id}...`);
    const commentRes = await axios.post(`${API_URL}/community/post/${newPost._id}/comment`, {
      text: 'Which slot number did you use? Slot s1 was acting slow yesterday.'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(`✅ [Comment] Comment added! Total replies: ${commentRes.data.replies}`);
    if (commentRes.data.replies !== 1) {
      throw new Error('Replies count should be 1 after commenting!');
    }

    const finalProfileRes = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const afterCommentPoints = finalProfileRes.data.user.points;
    console.log(`✅ [Carbon Coins] Points: ${afterPostPoints} -> ${afterCommentPoints} (+${afterCommentPoints - afterPostPoints})`);
    if (afterCommentPoints !== afterPostPoints + 5) {
      throw new Error('Commenting should reward +5 Carbon Coins!');
    }

    await new Promise(r => setTimeout(r, 1000));
    if (!receivedEvents.comment || receivedEvents.comment.postId !== newPost._id.toString() || receivedEvents.comment.replies !== 1) {
      throw new Error('Socket.IO did not receive the correct community:comment event!');
    }
    console.log('✅ [Realtime Sync] Post comment broadcast verified via Socket.IO');

    socket.disconnect();
    console.log('\n🎉 [Success] All Community discussions feed, likes, comments, Carbon Coins, and Socket.IO validation checks passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing Community checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
