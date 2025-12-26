const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const ffmpeg = require("fluent-ffmpeg");
const { publicModal } = require("../modals/public.modals");

// const constants = require("constants");
const compressVideo = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath =
      "uploads/compressed-" + path.basename(inputPath);

    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 28",
        "-preset veryfast",
        "-movflags +faststart",
        "-fs 25M", // ⭐ max 25MB
      ])
      .save(outputPath)
      .on("end", () => {
        fs.unlinkSync(inputPath); // original delete
        resolve(`/${outputPath}`);
      })
      .on("error", (err) => reject(err));
  });
};
const publicRouterCreate = async (req, res) => {
  try {
    const { description } = req.body;

    // ✅ image & video path
    const images = req.files?.image
      ? req.files.image.map((file) => `/uploads/${file.filename}`)
      : [];

    // ✅ SINGLE VIDEO
    // const video = req.files?.video
    //   ? `/uploads/${req.files.video[0].filename}`
    //   : null;

    let video = null; // ⭐ use let (not const)

    // ✅ video handling + compression
    if (req.files?.video) {
      const file = req.files.video[0];
      const originalPath = `/uploads/${file.filename}`;
      const mb = (file.size / (1024 * 1024)).toFixed(2);
         console.log(mb);
      // 🔥 compress only if > 25MB
      if (mb > 25 * 1024 * 1024) {
        video = await compressVideo(originalPath);
      } else {
        video = `/uploads/${file.filename}`;
      }
    }

    // ❌ schema requires video → so at least one media check
    if (!image && !video && !description) {
      return res.status(400).json({ message: "Post content required" });
    }

    const newPost = new publicModal({
      description,
      image,
      video,
      emoji: "",
      likes: [],
      shares: [],
      comments: [],
      saves: [],
    });

    await newPost.save();

    res.status(201).json({
      message: "Post created successfully",
      data: newPost,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



const publicRouterRead = async (req, res) => {
  try {
    const primedata = await publicModal.find();
    return res.status(200).json({
      status: "success",
      message: "data is completely save in db",
      data: primedata,
    });
  } catch (error) {
    console.log(error);
   return  res.status(500).json({
      status: "failed",
      message: "something went wrong in connection",
    });
  }
};

const updatePublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, emoji } = req.body;

    const post = await publicModal.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 📝 text update
    if (description !== undefined) {
      post.description = description.trim();
    }

    if (emoji !== undefined) {
      post.emoji = emoji;
    }

    // 📸 new images
    if (req.files?.image) {
      const newImages = req.files.image.map(
        file => `/uploads/${file.filename}`
      );
      post.image.push(...newImages);
    }

    // 🎥 new videos
    if (req.files?.video) {
      const newVideos = req.files.video.map(
        file => `/uploads/${file.filename}`
      );
      post.video.push(...newVideos);
    }

    // ❌ empty check
    if (
      !post.description &&
      post.image.length === 0 &&
      post.video.length === 0
    ) {
      return res.status(400).json({
        message: "Post cannot be empty"
      });
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



const deletePuble = async (req, res) => {
  const { id } = req.params;

  try {
    const apartment = await publicModal.findById(id);
    if (!apartment) {
      return res.status(404).json({ msg: "Apartment not found" });
    }

    const deleteFile = async (file) => {
      if (!file) return;

      // remove leading slash if exists
      const cleanPath = file.startsWith("/")
        ? file.slice(1)
        : file;

      const absolutePath = path.resolve(process.cwd(), cleanPath);

      console.log("Deleting file:", absolutePath); // 🔍 DEBUG

      try {
        await fs.unlink(absolutePath);
        console.log("Deleted:", absolutePath);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log("File not found:", absolutePath);
        } else {
          console.error(err);
        }
      }
    };

    await deleteFile(apartment.image);
    await deleteFile(apartment.video);

    await publicModal.findByIdAndDelete(id);

    res.status(200).json({ msg: "Deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // folder
  },
  filename: (req, file, cb) => {
    const uniqueName =  Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName );
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|mp4|mov|avi|webm/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only image or video files allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 300 }, // 100MB
  fileFilter,
});

//like 

const publictoggleLike = async (req, res) => {
  const {id} = req.params;
  // console.log("ud", id)
  try {
    const post = await publicModal.findById({_id: id});
    // console.log('POST',post)
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = post._id;

    const index = post.likes.findIndex(
      (id) => id.toString() === userId
    );

    let liked;

    if (index === -1) {
      post.likes.push(userId); // ❤️ Like
      liked = true;
    } else {
      post.likes.splice(index, 1); // 💔 Unlike
      liked = false;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      likesCount: post.likes.length,
      liked
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


const publicaddComment = async (req, res) => {
  const {id} = req.params;
  try {
    const { text } = req.body;

    if (!text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await publicModal.findById({_id:id});
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: post._id,
      text
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({
      success: true,
      comments: post.comments
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const publictoggleSave = async (req, res) => {
  const {id} = req.params;
  try {
    const post = await publicModal.findById({_id:id});
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = post._id;

    const index = post.saves.indexOf(userId);

    if (index === -1) {
      post.saves.push(userId); // 🔖 Save
    } else {
      post.saves.splice(index, 1); // ❌ Unsave
    }

    await post.save();
    res.json({
      success: true,
      saved: index === -1
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const followingfunction = async(req,res)=>{
  const {follow} = req.body;
  const {id,token}=req.params;
  try {
    
  } catch (error) {
    
  }
}

const monetization = async(req,res)=>{
  const {image, video, description}=req.body;
  try {
    if(image){
      
    }
  } catch (error) {
    return res.status(500).json({status:false, message:"something doing wrong in monetization"})
  }
}
module.exports = {
  publicRouterCreate,
  publicRouterRead,
  updatePublic,
  deletePuble,
  upload, 
  publictoggleLike,
  publictoggleSave,
  publicaddComment,
  followingfunction,
  monetization
};
