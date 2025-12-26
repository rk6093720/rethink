const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
  text: { type: String},
  replyto:{type:String, ref:'comment'},
  likes:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}]
  },
  { timestamps: true });
const primeSchema = new mongoose.Schema({
  description: { type: String },
  video: { type: String }, // video URL
  image: [{ type: String }],                 // ✅ image URL/path
  emoji:{type:String},
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const PrimeModal = mongoose.model('primeFeed', primeSchema);
module.exports = { PrimeModal };
