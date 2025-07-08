import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  email: String,
  action: String, 
  taskTitle: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Log', logSchema);
