import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  status: String,
  email: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  assignedTo: {
  type: String,
  default: '',
    },
});


export default mongoose.model('Task', taskSchema);
