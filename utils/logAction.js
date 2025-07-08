import Log from '../database/log.data.js';

const logAction = async (email, action, taskTitle) => {
  try {
    await Log.create({ email, action, taskTitle });
  } catch (err) {
    console.error('Logging failed:', err.message);
  }
};

export default logAction;
