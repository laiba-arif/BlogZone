const jwt = require('jsonwebtoken');
const User=require('./models/userModel')

const jwtAuthMiddleware=async(req,res,next)=>{
const token = req.cookies.jwt
if(!token){return res.status(401).json({error:'Unauthorized'})}
try {
     
    const decoded = jwt.verify(token , process.env.JWT_SECRET)
    const user=await User.findById(decoded._id)
    if(!user){
        res.status(401).json({msg:"User not found, authorization denied"})

    }
    req.user=user
    next()
} catch (error) {
    res.status(401).json({error:"Invalid Token"})
}
}

const generateToken=(userData)=>{
return jwt.sign({_id:userData._id}, process.env.JWT_SECRET)
}

module.exports={jwtAuthMiddleware,generateToken}