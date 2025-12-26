const  { Router} = require("express");
const { auth } = require("../middleware/user.middleware");
const { publicRouterCreate, publicRouterRead, updatePublic, deletePuble, publictoggleLike, publicaddComment, publictoggleSave, upload, followingfunction, monetization } = require("../controller/public.controller");
const publicRouter = Router();

publicRouter.post("/create",upload.fields([
    { name: "image", maxCount: 10 },
    { name: "video", maxCount: 1 },

]), publicRouterCreate);
// creation of prime post
publicRouter.get("/read", publicRouterRead); // reading the data information from prime post

// edit the prime post
publicRouter.put("/:id/update", updatePublic);
// delete the prime post 
publicRouter.delete("/:id/delete", deletePuble)
// like 
publicRouter.put("/:id/like",auth, publictoggleLike);
// add comment
publicRouter.post("/:id/addcomment", auth,publicaddComment);
// save 
publicRouter.put("/:id/save",auth, publictoggleSave);

// follow and invite
publicRouter.post("/:id/following/:token",auth, followingfunction);
// monetization of public post

publicRouter.post("/monetization", monetization)
module.exports = {publicRouter}
