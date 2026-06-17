import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  tag: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  replies: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likesUserIds: { type: [String], default: [] },
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      avatar: { type: String, default: '' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// A virtual field to map `_id` to `id` for frontend consistency
communityPostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual field for friendly time representation
communityPostSchema.virtual('time').get(function() {
  const diffMs = Date.now() - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
});

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
