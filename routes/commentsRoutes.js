const router=require('express').Router()
const Comment = require('../models/commentsModel')

// route to create a new comment or reply to an existing comment
router.post('/comments', async(req,res)=>{
  try {
   
   const {blogId, comment, parentCommentId} = req.body

   const newComment = new Comment({
    blogId:blogId,
    comment:comment,
    userId:req.user._id,
    parentComment:parentCommentId || null
   })
  //  save the comment
   const savedComment= await newComment.save()

   if(parentCommentId){
    await Comment.findByIdAndUpdate(parentCommentId, {
      $push:{replies : savedComment._id}
    })
   }
    res.status(201).json(savedComment)
  } catch (error) {
    console.log('Error is : ', error)
    res.status(500).json({msg:"Internal server error"})

  }
}) 

// get the comments of specific blog including nested replies
router.get('/blogs/:blogId/comments', async (req, res) => {
  try {
      const blogId = req.params.blogId;

      // Fetch all root comments (parentComment is null)
      const comments = await Comment.find({ blogId: blogId, parentComment: null })
          .populate('userId', 'username profileImage')  // Populate user info for each comment
          .populate({
              path: 'replies',  // Populate replies
              populate: { path: 'userId', select: 'username profileImage' }  // Also populate user info in replies
          });

      if (comments.length === 0) {
          return res.status(404).json({ message: 'No comments found for this blog' });
      }

      res.status(200).json(comments);
  } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
  }
});


// updating own comments
router.patch('/comments/:_id',async(req,res)=>{
  try {
    const commentId=req.params._id
    const newComment=req.body.comment

    const comment = await Comment.findById(commentId)
    if(!comment){
      return res.status(404).json({msg:"Comment not found"})
    }

    // check loggedin user is the owner of comment
    if(comment.userId.toString() !== req.user._id.toString()){
      return res.status(403).json({error:"*User is Unauthorized"})

    }
    // updating comment directly using findbyIdandUpdate
     const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {comment:newComment},
      {new:true}

     )
     if (!updatedComment) {
      return res.status(404).json({ error: 'Comment could not be updated' });
  }
    
   res.status(200).json(updatedComment)

  } catch (error) {
    console.log("error is : ", error)
    res.status(500).json({ error: 'Failed to update comment' });
  }
})

// deleting comment
router.delete('/comments/:_id', async(req,res)=>{
  try {
    const commentId=req.params._id
    const comment=await Comment.findById(commentId)
    if(!comment){
      return res.status(404).json({msg:"Comment not found"})
    }
    if(comment.userId.toString() !== req.user._id.toString()){
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Comment.findByIdAndDelete(commentId)
    await Comment.deleteMany({parentComment:commentId})
    res.status(200).json({msg:"comment deleted"})
  } catch (error) {
    console.log("error is : ", error)
    res.status(500).json({ error: 'Failed to delete comment' });
  }
})



router
module.exports=router
