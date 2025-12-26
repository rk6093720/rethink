const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
   text: { type: String}, 
    replyto:{type:String, ref:'comment'},
    likes:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  createdAt: { type: Date, default: Date.now }
});
const publicSchema = new mongoose.Schema({
  description: { type: String },
  video: { type: String }, // video URL
  image: { type: String },                 // ✅ image URL/path
  emoji:{type:String},
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  follow:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const publicModal = mongoose.model('publicFeed', publicSchema);
module.exports = { publicModal };
