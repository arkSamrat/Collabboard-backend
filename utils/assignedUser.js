import taskData from '../database/task.data.js';
import userData from '../database/user.data.js';

const getUserWithLeastTasks = async () => {
  const users = await userData.find();

  if (!users.length) return null;

  let minTaskCount = Infinity;
  let selectedUser = null;

  for (const user of users) {
    const count = await taskData.countDocuments({ assignedTo: user.email });
    if (count < minTaskCount) {
      minTaskCount = count;
      selectedUser = user.email;
    }
  }

  return selectedUser;
};

export default getUserWithLeastTasks;
