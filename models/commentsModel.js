

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({

   comment:{
    type:String,
    required:true
  },
   
    profileImage: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"

    },
    userId: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User" ,
      required:true
    },

   blogId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog', 
    required: true
  },
   parentComment:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', 
    default:null
    
  },
   
  replies:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment', 

    }
  ]
},{ timestamps: true });


const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;