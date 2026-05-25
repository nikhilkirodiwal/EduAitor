import Blog from "../models/Blog.js";
import cloudinary from "cloudinary";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

// ─── GET all blogs for this school ───────────────────────────────────────────
export const getBlogs = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const blogs = await Blog.find({ schoolId }).sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET public blogs by schoolId (no auth, for public feed) ─────────────────
export const getPublicBlogs = async (req, res) => {
  try {
    console.log("Fetching public blogs for schoolId");
    // const { schoolId } = req.params;
    const schoolId  = req.user.school_id;
    const blogs = await Blog.find({ schoolId, isPublic: true }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE blog ──────────────────────────────────────────────────────────────
export const createBlog = async (req, res) => {
  console.log("Creating blog with data:", req.body);
  try {
    const { title, content, category, isPublic } = req.body;
    const schoolId = req.user.school_id;

    // Upload images to Cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "blogs"))
      );
      images = uploads.map((u) => ({ url: u.url, public_id: u.public_id }));
    }

    const blog = await Blog.create({
      title,
      content,
      category: category || "General",
      isPublic: isPublic === "true" || isPublic === true,
      images,
      schoolId,
    });
console.log("Created blog:", blog);
    res.status(201).json({ success: true, data: blog });

  } catch (err) {
console.log("Error creating blog:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE blog ──────────────────────────────────────────────────────────────
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPublic } = req.body;
    const schoolId = req.user.school_id;

    // Ensure blog belongs to this school
    const blog = await Blog.findOne({ _id: id, schoolId });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // If new images uploaded → delete old ones from Cloudinary, upload new
    let images = blog.images;
    if (req.files && req.files.length > 0) {
      if (blog.images.length > 0) {
        await Promise.all(
          blog.images.map((img) => cloudinary.uploader.destroy(img.public_id))
        );
      }
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "blogs"))
      );
      images = uploads.map((u) => ({ url: u.url, public_id: u.public_id }));
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content,
        category,
        isPublic: isPublic === "true" || isPublic === true,
        images,
      },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE blog ──────────────────────────────────────────────────────────────
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;

    const blog = await Blog.findOne({ _id: id, schoolId });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // Delete images from Cloudinary
    if (blog.images.length > 0) {
      await Promise.all(
        blog.images.map((img) => cloudinary.uploader.destroy(img.public_id))
      );
    }

    await blog.deleteOne();
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── TOGGLE public / private ──────────────────────────────────────────────────
export const togglePublic = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;
    console
.log("Toggling public/private for blogId:", id, "schoolId:", schoolId);

    const blog = await Blog.findOne({ _id: id, schoolId });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    blog.isPublic = !blog.isPublic;
    await blog.save();

    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LIKE blog ────────────────────────────────────────────────────────────────
export const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    res.json({ success: true, likes: blog.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};