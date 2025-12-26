const  { Router} = require("express");
const { primeRouterCreate, primeRouterRead, updatePrime, deletePrime, upload, toggleLike, addComment, toggleSave, addCommentReply, likecomment, likeComment } = require("../controller/prime.controller");
const { auth } = require("../middleware/user.middleware");
const primeRouter = Router();

primeRouter.post("/create",upload.fields([
    { name: 'image', maxCount:10},
    {name: 'video', maxCount:1}
]), primeRouterCreate);
// creation of prime post
primeRouter.get("/read", primeRouterRead); // reading the data information from prime post

// edit the prime post
primeRouter.put("/:id/update", updatePrime);
// delete the prime post 
primeRouter.delete("/:id/delete", deletePrime)
// like 
primeRouter.put("/:id/like",auth, toggleLike); //post id 
// add comment
primeRouter.post("/:id/addcomment", auth,addComment);// post id on comment
// save 
primeRouter.put("/:id/save",auth, toggleSave); // for save
// comment reply 
primeRouter.post("/:postId/comment/:commentId/reply", auth, addCommentReply);
// like comment 
primeRouter.put("/:postId/comment/:commentId/like", auth, likeComment);

module.exports = {primeRouter}