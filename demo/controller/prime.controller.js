const multer = require("multer");
const fs = require("fs/promises"); // ✔ correct
const path = require("path");
const { PrimeModal } = require("../modals/prime.modals");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

// const constants = require("constants");

const primeRouterCreate = async (req, res) => {
  try {
    const { description } = req.body;

    // ✅ MULTIPLE IMAGES
    const uploadedImages = req.files?.image
      ? req.files.image.map(file =>
          `/${file.path.replace(/\\/g, "/")}`
        )
      : [];

    console.log("IMAGES:", uploadedImages); // ✅ CHECK HERE

    // ✅ SINGLE VIDEO
    let video = null;
    if (req.files?.video?.length) {
      const file = req.files.video[0];
      const sizeInMB = file.size / (1024 * 1024 * 300).toFixed(2);
       console.log("video size in Mb:",sizeInMB);
      video =
        sizeInMB > 25
          ? await compressVideo(file.path)
          : `/${file.path.replace(/\\/g, "/")}`;
    }

    // ❌ EMPTY CHECK
    if (!description && uploadedImages.length === 0 && !video) {
      return res.status(400).json({
        message: "Post must contain image, video, or description",
      });
    }

    // ✅ SAVE
    const newPost = new PrimeModal({
      description,
      image: uploadedImages, // ✅ ARRAY SAVED
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
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const compressVideo = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = "uploads/compressed-" + path.basename(inputPath);

    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 30",
        "-preset veryfast",
        "-movflags +faststart",
      ])
      .on("end", async () => {
        try {
          await fs.unlink(inputPath); // ✅ ASYNC DELETE
          resolve(`/${outputPath.replace(/\\/g, "/")}`);
        } catch (err) {
          console.error("File delete error:", err);
          resolve(`/${outputPath.replace(/\\/g, "/")}`);
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg Error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};


const primeRouterRead = async (req, res) => {
  try {
    const primedata = await PrimeModal.find()
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

const updatePrime = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, emoji } = req.body;

    const post = await PrimeModal.findById(id);
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



const deletePrime = async (req, res) => {
  const { id } = req.params;

  try {
    const apartment = await PrimeModal.findById(id);
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

    await PrimeModal.findByIdAndDelete(id);

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
  console.log("ext",ext,"mime",mime);
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

const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await PrimeModal.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    const updatedPost = await PrimeModal.findByIdAndUpdate(
      postId,
      isLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: updatedPost.likes.length,
    });

  } catch (error) {
    console.error("ToggleLike Error:", error);
    return res.status(500).json({ message: error.message });
  }
};



const addComment = async (req, res) => {
  const {id} = req.params;
  try {
    const { text } = req.body;

    if (!text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await PrimeModal.findById({_id:id});
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

const toggleSave = async (req, res) => {
  const {id} = req.params;
  try {
    const post = await PrimeModal.findById({_id:id});
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
const addCommentReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { replyto } = req.body;
    const userId = req.userId;

    if (!replyto || !replyto.trim()) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    // 1️⃣ Find post
    const post = await PrimeModal.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 2️⃣ Find parent comment
    const parentComment = post.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // 3️⃣ Create reply (also a comment)
    const replyComment = {
      user: userId,
      replyto,
      Like:[]
    };

    // 4️⃣ Push reply into comments array
    post.comments.push(replyComment);
    await post.save();

    return res.status(201).json({
      success: true,
      reply: replyComment,
    });

  } catch (error) {
    console.error("Reply Comment Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId; // from auth middleware

    const post = await PrimeModal.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes.pull(userId);      // 💔 Unlike
    } else {
      comment.likes.addToSet(userId);  // ❤️ Like
    }

    await post.save();

    return res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: comment.likes.length,
    });

  } catch (error) {
    console.error("Like Comment Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  primeRouterCreate,
  primeRouterRead,
  updatePrime,
  deletePrime,
  upload, 
  toggleLike,
  toggleSave,
  addComment,
  addCommentReply,
  likeComment
};
