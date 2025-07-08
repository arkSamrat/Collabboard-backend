import express from 'express';
import cors from 'cors';
import userData from './database/user.data.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import auth from './middleware/auth.js';
import taskData from './database/task.data.js';
import http from 'http'
import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import logAction from './utils/logAction.js';
import isAdmin from './middleware/isAdmin.js';
import getUserWithLeastTasks from './utils/assignedUser.js';
import Log from './database/log.data.js'
import dotenv from 'dotenv'
dotenv.config();

const app = express()
const port = 3000

const server=http.createServer(app);


const allowedOrigins = [                      
  'https://collabboard-frontend-lr6i.vercel.app'
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('new-task', (task) => {
    socket.broadcast.emit('task-created', task);
  });
});


app.use(cors({credentials:true,origin: allowedOrigins}));
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URI)
  .then(()=>{console.log('connected')});


app.post('/login',async (req,res)=>
{
    const {email,password}=req.body;
    try{
        const prev_user=await userData.findOne({email});
        if(prev_user)
        {
            let res_compare=await bcrypt.compare(password,prev_user.password);
            if(res_compare)
            {
                 let token = jwt.sign({email},process.env.JWT_SECRET);
                 res.cookie('token', token, {
                     httpOnly: true,
                     secure: true, 
                        sameSite: 'none'
                    });

                return res.json({message:'User Found',success:true});
                
            }
            else res.json({success:false,message:'Username of password didn,t matched',count:1});
        }
        else res.json({success : false,message:'No record found!',count:2});
    }catch(error)
    {
        res.json({success:false,message:'Server Error!'});
    }
})
app.post('/register-api',async (req,res)=>
{
    const {name,email,password}=req.body;
try
{
    const prev_user=await userData.findOne({email});

    if(prev_user) return res.json({success:false,message:'Try to Login, User Exist'});
    
    let salt=await bcrypt.genSalt(10);
    let hashed_password=await bcrypt.hash(password,salt);
   // console.log(hashed_password);
    let new_user=await userData.create(
        {
            name,
            email,
            password:hashed_password
        }
    );
    
    let token = jwt.sign({email},process.env.JWT_SECRET);
    res.cookie('token', token, {
  httpOnly: true,
  secure: true, 
  sameSite: 'none'
    });


    return res.status(200).json({message:'Registration Successful',success:true});
 
} 
catch(error)
{
     return res.json({success:false,message : error.message});
}
});

app.get('/logout-api', (req, res) => {
  try {
    console.log('Hello!');
    res.clearCookie('token');

    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Problem in logging out' });
  }
});

app.get('/api/dashboard', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userData.findOne({ email: decoded.email }).then(user => {
      if (!user) return res.status(404).json({ message: 'User not found' });

      res.json({ email: user.email, role: user.role });
    });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
});


app.get('/task-api',async (req,res)=>
{
//    const email = req.query.email;
    const email = req.query.email;
    try{
         const tasks= await taskData.find({email : email});
        // console.log(tasks[0]);
        console.log(tasks);
         res.json({tasks});

    }
    catch(error)
    {
        return res.status(400).json({success:false,message:'No Data Found!'})
    }
   
    
});
app.post('/api/tasks', auth, async (req, res) => {
  const { title, description, priority, status } = req.body;

  try {
    const assignTo = await getUserWithLeastTasks();

    const task = await taskData.create({
      title,
      description,
      priority,
      status,
      email: req.user.email,
      assignedTo: assignTo,
    });

    await logAction(req.user.email, 'created', title);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Task creation failed' });
  }
});


app.put('/tasks/:id', auth, async (req, res) => {
  const clientTime = req.body.lastUpdated; 

  try {
    
    const existingTask = await taskData.findById(req.params.id);

    
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    
    const isConflict = new Date(clientTime).getTime() !== new Date(existingTask.lastUpdated).getTime();

    if (isConflict) {
      return res.status(409).json({
        success: false,
        message: 'Someone else already updated this task.',
        serverTask: existingTask, 
      });
    }

    
    const updatedTask = await taskData.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true }
    );

    
    io.emit('task-updated', updatedTask);

    
    await logAction(req.user.email, 'updated', updatedTask.title);

    
    res.json({ success: true, updated: updatedTask });

  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Could not update task',
    });
  }
});



app.get('/logs', isAdmin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(20);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load logs' });
  }
});

export { io };

server.listen(port, () => console.log(`The app listening on port ${port}!`))