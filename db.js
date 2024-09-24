const mongoose=require('mongoose')
require('dotenv').config()
// const mongoURL = process.env.MONGO_URL_LOCAL
const mongoURL = process.env.MONGO_URL

mongoose.connect(mongoURL,({
    useNewUrlParser:true,
    useUnifiedTopology:true
}))

const db=mongoose.connection
db.on('connected',()=>{console.log('Db is connected Successfully')})
db.on('disconnected',()=>{console.log('Db disconnected ')})
db.on('error',(err)=>{console.log('Error is ', err)})