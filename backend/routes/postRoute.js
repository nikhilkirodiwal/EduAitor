import express from "express";
import {
  createPost,
  getGroupPosts,
  updatePost,
  deletePost,
  toggleLike,
  // addComment,
  // deleteComment,
  togglePin,
} from "../controllers/postController.js";

import upload from "../middlewares/upload.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.use(authMiddleware);

// ─── Post routes ──────────────────────────────────────────────────────────────

// Create post (teacher / admin)
router.post("/", upload.array("attachments", 5), createPost);

// Get posts in a group
router.get("/group/:groupId", getGroupPosts);

// Update post
router.put("/:id", upload.array("attachments", 5), updatePost);

// Delete post
router.delete("/:id", deletePost);

// Like / unlike
router.patch("/:id/like", toggleLike);

// Pin / unpin (admin)
router.patch("/:id/pin", togglePin);

// ─── Comment routes ───────────────────────────────────────────────────────────

// Add comment
// router.post("/:id/comment", addComment);

// Delete comment
// router.delete("/:id/comment/:commentId", deleteComment);

export default router;
