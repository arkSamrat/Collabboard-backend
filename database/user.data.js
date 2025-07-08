import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
});



export default mongoose.model('UserData', userSchema);
