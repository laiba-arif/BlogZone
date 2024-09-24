const express = require('express')
const router=express.Router()
const User = require('../models/userModel')
const Blog=require('../models/blogModel')
const {jwtAuthMiddleware,generateToken}=require('../jwt')
const passport = require('../auth')
const crypto=require("crypto");
const nodemailer=require("nodemailer")
const multer=require("multer")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/public/uploads')
    },
    filename: function (req, file, cb) {
    const  filename = `${Date.now()}-${file.originalname}`
    cb(null,filename)
    }
  })
  
  const upload = multer({ storage: storage })

// signup route
router.post('/signup',upload.single('profileImage'), async(req,res)=>{
try {
    const user = req.body
    const profileImage=req.file? `/uploads/${req.file.filename}`: "/uploads/default.png" //default image
    const newUser=new User({ ...req.body , profileImage})
    const response = await newUser.save()
    const payload={
        _id:response._id,
        username:response.username
    }
    const token = generateToken(payload)
    res.cookie('jwt', token ,{
        httpOnly:true,
        secure: false,
        maxAge:24*60*60*1000
    })
    if(user)
    res.status(200).json({response:response, token:token})
} catch (error) {
    console.log('Error is', error)
    res.status(500).json({error:"Internal server error"})

}
})

// update profile image
router.patch('/updateProfileImage',jwtAuthMiddleware,upload.single('profileImage'),async(req,res)=>{
try {
    const {_id} = req.body
    const profileImage=req.file? `/uploads/${req.file.filename}`:  "/uploads/default.png" //default Image
    const user = await User.findByIdAndUpdate({_id, profileImage})
    if(!user){
        return res.status(404).json({msg:"user not found"})
    }
    return res.status(200).json({msg:"udated profileImage successfully"})
 
} catch (error) {
    console.log("Error is : ", error)
    res.status(500).json({msg:"Internal server error"})
}
})

// login route
router.post('/login', passport.authenticate('local', { session: false }),async(req,res)=>{
try {
    const {username,password}=req.body
    const user = await User.findOne({username})
    if(!user || (!await user.comparePassword(password))){
        return res.status(401).json({msg:"Invalid User Credentials"})
    }
    const payload={
        _id:user._id,
        username:user.username
    }
    const token = generateToken(payload)
    res.cookie('jwt', token ,{
        httpOnly:true,
        secure: false,
        maxAge:24*60*60*1000
    })
    res.status(200).json({token})
  } catch (error) {
    res.status(500).json({msg:"Internal Server Error"})

}  
})

// logout route
router.post('/logout', jwtAuthMiddleware,async(req,res)=>{
   try {
    res.clearCookie('jwt')
    res.status(200).json({msg:"Logout successfully"})
    
   } catch (error) {
    console.log("eror is", error)
    res.status(500).json({msg:"Internal server Error"})

   }
})

// change-password route
router.patch('/change-password', jwtAuthMiddleware,async(req,res)=>{
    try {
        const {currentPassword, newPassword} = req.body   
        const user=await User.findById(req.user._id)
        const isPasswordMatch=await user.comparePassword(currentPassword)
        if(!isPasswordMatch){
            return res.status(401).json({msg:"Password is incorrect "})
        }
        
        user.password=newPassword
        await user.save()
        // console.log("Password changed successfully")
        res.status(200).json({msg:"password changed and successfully saved"})
        
    } catch (error) {
        console.log("Error is :", error)
        res.status(500).json({error:"Internal server error"})
    }

})

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists with this email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ msg: "User not found" });
        }

        // Generate reset token
        const restToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(restToken).digest('hex');
        const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiration

        // Save hashed token and expiry to user
        user.passwordResetToken = resetTokenHash;
        user.passwordTokenExpires = tokenExpiry;
        await user.save();

        // Send plain token in email (not the hashed token)
        const resetUrl = `${req.protocol}://${req.get('host')}/user/reset-password/${restToken}`;

        // Nodemailer setup for Gmail
        const transport = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Set to true for SSL (port 465)
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address
                pass: process.env.EMAIL_PASSWORD, // Your Gmail password or app password
            },
        });

        // Compose email message
        const msg = {
            from: {
                name: "Web Wizard",
                address: process.env.EMAIL_USER,
            },
            to: user.email,
            subject: "Password Reset Request",
            text: `You are receiving this because you (or someone else) requested a password reset for your account.\n\n
            Please click the following link to reset your password:\n\n
            ${resetUrl}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        // Send email
        transport.sendMail(msg, (err, info) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error sending email" });
            }
        });

        // Return success response
        return res.status(200).json({ message: `Password reset link sent to ${email}` });

    } catch (error) {
        console.log("Error is:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Reset Password Route
router.post('/reset-password/:resetToken', async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        // Check if newPassword is provided
        if (!newPassword) {
            return res.status(400).json({ msg: "New password is required" });
        }

        // Hash the resetToken from the URL
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Find user by hashed token and ensure token hasn't expired
        const user = await User.findOne({
            passwordResetToken: resetTokenHash,
            passwordTokenExpires: { $gt: Date.now() }, // Ensure the token is still valid
        });

        if (!user) {
            return res.status(401).json({ msg: "Invalid or expired password reset token" });
        }

        // Update the user's password and clear the reset token and expiry fields
        user.password = newPassword;
        user.passwordResetToken = undefined; // Clear reset token
        user.passwordTokenExpires = undefined; // Clear token expiry

        // Save the updated user document
        await user.save();

        return res.status(200).json({ msg: "Password reset successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

// profile route
router.get('/profile/:username', jwtAuthMiddleware, async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        const blogs= await Blog.find({createdBy: user._id}).populate({path:"comments"})
        // console.log({blogs: blogs})

        return res.status(200).json({user,blogs});

    } catch (error) {
        console.log("Error is: ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



module.exports=router