
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true,
       
    },
   category: {
        type: String,
        enum:["news","technology","lifeStyle", "fashion","food",
             "sports", "entertainment", "education", "business", "personalDevelopment", "uncategorized"], 
       default:"uncategorized"
    },

    coverImageURL: {
        type: String,
        required: false,
       
    },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: true
  }
}, {
  toJSON: { virtuals: true },  // Ensure virtual fields are included when converting to JSON
  toObject: { virtuals: true }  // Ensure virtual fields are included when converting to objects
},{timestamps:true});

// Virtual field for comments (referencing the Comment model)
blogSchema.virtual('comments', {
  ref: 'Comment',              // The model to use
  localField: '_id',           // Find comments where `localField` (blog _id) matches `foreignField` (blogId in Comment model)
  foreignField: 'blogId',      // The field in the Comment model that references the blog
  justOne: false               // Return an array of comments
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;