import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const auth = (req,res,next)=>
    {
        const token=req.cookies.token;
        if(!token)
        {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token' });
        }
        try{
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded; 
                next();
        }catch(error)
        {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }
    } 


    export default auth;