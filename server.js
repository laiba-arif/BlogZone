const express=require('express')
const app=express()
const passport=require('./auth')
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser')
 
require('dotenv').config()
const PORT = process.env.PORT || 3000
const db = require('./db')

// middlewares
app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public'))

// passport initialization
app.use(passport.initialize())

// log requests
app.use((req,res,next)=>{
    console.log(`${new Date().toLocaleString()} Request made to: ${req.originalUrl}`)
    next()
})

// routes
const userRoutes=require('./routes/userRoutes')
const blogRoutes=require('./routes/blogRoutes');
const commentRoutes=require('./routes/commentsRoutes')
const { jwtAuthMiddleware } = require('./jwt');
app.use('/user',userRoutes)
app.use('/',jwtAuthMiddleware, blogRoutes)
app.use('/',jwtAuthMiddleware,commentRoutes)
app.get('/',(req,res)=>{res.send('Welcome to BlogZone')})


app.listen(PORT,()=>{console.log(`Listening to PORT ${PORT}`)})