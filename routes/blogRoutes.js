
const router=require('express').Router()
const multer  = require('multer')
const Blog = require('../models/blogModel')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName=`${Date.now()}-${file.originalname}`
      cb(null,fileName)
    }
  })
  
  const upload = multer({ storage: storage })

router.post('/blog',upload.single('coverImage'),async(req,res)=>{
    try {
    const {title, body, category}=req.body
 
    if(!title || !body){
      return res.status(401).json({msg:"Title and body is required"})
    }
   
    // file is optional, check the file is uploaded
    const coverImageUrl=null
    if(req.file){
      coverImageUrl= `/uploads/${req.file.filename}`
    }
       // Ensure req.user is populated
       if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "User is not authenticated" });
    }
     // Log the category being used
     console.log('Category being used: ', category);
   
    const newBlog= new Blog({
      title,
      body,
      category,
      coverImageUrl,
      createdBy:req.user._id
     
    })
    await newBlog.save()

    res.status(201).json({msg:"Blog post created successfully", blog:newBlog})

    } catch (error) {
        console.log("Error is ", error)
        res.status(500).json({error:"internal server error"})
    }
})

// get blogs along with comments by sorting and filtering

router.get('/blogs', async (req, res) => {
  try {
    const filters = ["title", "createdBy", "createdAt", "category"];
    const query = {};

    // Loop through filters and add to query if present in request
    filters.forEach((filter) => {
      if (req.query[filter]) {
        if (filter === "title") {
          query[filter] = { $regex: req.query[filter], $options: "i" }; // Case-insensitive search for titles
        } else {
          query[filter] = req.query[filter];
        }
      }
    });

    // Handle sorting
    const sortBy = req.query.sortBy || "createdAt"; // Default sorting using createdAt
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Default descending order

    // Find blogs and populate both 'createdBy' and related 'comments'
    const data = await Blog.find(query)
      .populate('createdBy', 'username')  // Populate the 'createdBy' field with 'username'
      .populate({
        path: 'comments',  // Populate the related comments via the virtual field
        populate: { path: 'userId', select: 'username profileImage' }  // Also populate user info for each comment
      })
      .sort({ [sortBy]: sortOrder });

    // If no data is found, return 404
    if (!data || data.length === 0) {
      // console.log("no data found");
      return res.status(404).json({ msg: "data not found" });
    }

    // Return the data including blogs and their comments
    return res.status(200).json(data);
  } catch (error) {
    console.log("Error is ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// update blog 
router.patch('/blog/:_id',async(req,res)=>{
  const updatedBlog = req.body
  const {_id}=req.params
  const blog=await Blog.findById(_id)

 if(!blog){
  return res.status(404).json({msg:"No blog found"})
 }
 
if(!updatedBlog || Object.keys(updatedBlog).length === 0){
  return res.status(400).json({error:"content for updation is required "})

}
try {
  const updates=await Blog.findByIdAndUpdate(_id, updatedBlog,{new:true})
  return res.status(200).json({msg:"updatedBlog successfully", updates})
} catch (error) {
  console.log("Error is : ", error)
  return res.status(500).json({error:"Internal server error"})

}
})

// delete blog
router.delete('/blog/:_id', async(req,res)=>{
  const _id=req.params
  const blog=await Blog.findByIdAndDelete(_id)
  if(!blog){
    return res.status(404).json({msg:"blog not found"})
  }
  return res.status(200).json({msg:"blog deleted successfully"})

})


module.exports=router

