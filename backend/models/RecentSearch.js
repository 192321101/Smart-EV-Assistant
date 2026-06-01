import mongoose from 'mongoose';

const recentSearchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true }
}, {
  timestamps: true
});

const RecentSearch = mongoose.model('RecentSearch', recentSearchSchema);
export default RecentSearch;
