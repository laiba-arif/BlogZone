const passport = require('passport')
const LocalStrategy=require('passport-local').Strategy
const User = require('./models/userModel')

passport.use(new LocalStrategy(async(username,password,done)=>{
    try {
        const user=await User.findOne({username:username})
        if(!user){
            return done(null,false,{msg:"Invalid username"})
        }
        const isPasswordMatch = await user.comparePassword(password)
        if(isPasswordMatch){
            return done(null,user)
        }else{
        return done(null,false,{msg:'Invalid password'})
    }
    } catch (error) {
        return done(error)
    }
}))


// .serialization 
passport.serializeUser((user,done)=>{
 done(null,user._id)
});

// deserialization
passport.deserializeUser=(async(id,done)=>{
try {
    const user= await User.findById(id)
    done(null,user)
} catch (error) {
    done(error,null)
}
})
module.exports=passport