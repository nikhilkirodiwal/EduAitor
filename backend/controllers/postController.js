import Post from "../models/post.js";
import Group from "../models/group.js";

// ─── Auth normalizer ──────────────────────────────────────────────────────────
// JWT payload shape: { role, school_id, teacher_id?, email, name? }

const normalizeUser = (jwtUser) => {
  const userType =
    jwtUser.role === "teacher_admin"
      ? "teacher"
      : jwtUser.role === "school_admin"
        ? "admin"
        : null;

  const userId = jwtUser.teacher_id || jwtUser.school_id;
  const schoolId = jwtUser.school_id;

  return { userId, userType, schoolId };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const verifyGroupAccess = async (groupId, schoolId, userId, userType) => {
  const group = await Group.findOne({
    _id: groupId,
    schoolId,
    status: "Active",
  });
  if (!group) return { error: "Group not found", status: 404 };

  const isMember = group.members.some(
    (m) => m.userId.toString() === userId.toString(),
  );
  if (!isMember && userType !== "admin") {
    return { error: "Not a member of this group", status: 403 };
  }

  return { group };
};

// ─── Post CRUD ────────────────────────────────────────────────────────────────

/**
 * POST /posts/create
 * Body: { groupId, content, attachments? }
 */
export const createPost = async (req, res) => {
  try {
    const { userId, userType, schoolId } = normalizeUser(req.user);

    if (!schoolId || !userType) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const { groupId, content } = req.body;

    const files = req.files || [];

    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post must have content or attachment",
      });
    }

    // Verify group access
    const { group, error, status } = await verifyGroupAccess(
      groupId,
      schoolId,
      userId,
      userType,
    );

    if (error) {
      return res.status(status).json({ success: false, message: error });
    }

    if (!group.permissions.canPost.includes(userType)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to post in this group",
      });
    }

    // Upload files to Cloudinary
    let attachments = [];

    if (files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file, "posts"),
      );

      attachments = await Promise.all(uploadPromises);
    }

    // Create Post
    const post = await Post.create({
      groupId,
      schoolId,
      postedBy: { userId, userType },
      content,
      attachments,
    });

    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /posts/group/:groupId
 * Query: page, limit, pinned
 */
export const getGroupPosts = async (req, res) => {
  try {
    const { userId, userType, schoolId } = normalizeUser(req.user);
    const { groupId } = req.params;

    let { page = 1, limit = 20, pinned } = req.query;

    // Convert to numbers safely
    page = Math.max(1, parseInt(page));
    limit = Math.min(50, parseInt(limit)); // prevent overload

    if (!schoolId || !userType) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    // Access check
    const { error, status } = await verifyGroupAccess(
      groupId,
      schoolId,
      userId,
      userType,
    );

    if (error) {
      return res.status(status).json({
        success: false,
        message: error,
      });
    }

    // Filter
    const filter = {
      groupId,
      status: "active",
    };

    if (pinned === "true") {
      filter.isPinned = true;
    }

    const skip = (page - 1) * limit;

    // Fetch posts
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "postedBy.userId",
          select: "name photo", // adjust based on your schema
        })
        .lean(),

      Post.countDocuments(filter),
    ]);

    // Format attachments
    const formattedPosts = posts.map((post) => ({
      ...post,
      attachments: post.attachments?.map((file) => ({
        ...file,
        fileType: file.type?.startsWith("image/")
          ? "image"
          : file.type?.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : "other",
      })),
    }));

    res.json({
      success: true,
      data: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get posts error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * PUT /posts/:id
 */
export const updatePost = async (req, res) => {
  try {
    const { userId } = normalizeUser(req.user);

    const post = await Post.findOne({
      _id: req.params.id,
      status: "active",
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ownership check
    if (post.postedBy.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not your post",
      });
    }

    const { content, removeAttachments = [] } = req.body;
    const files = req.files || [];

    // Update content
    if (content !== undefined) {
      post.content = content;
    }

    // Remove selected attachments
    if (removeAttachments.length > 0) {
      const toRemoveSet = new Set(removeAttachments);

      const remainingAttachments = [];
      const deletePromises = [];

      for (const file of post.attachments) {
        if (toRemoveSet.has(file.public_id)) {
          deletePromises.push(deleteFromCloudinary(file.public_id));
        } else {
          remainingAttachments.push(file);
        }
      }

      await Promise.all(deletePromises);
      post.attachments = remainingAttachments;
    }

    // Upload new attachments
    if (files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file, "posts"),
      );

      const newUploads = await Promise.all(uploadPromises);

      post.attachments.push(...newUploads);
    }

    // Prevent empty post
    if (
      (!post.content || post.content.trim() === "") &&
      post.attachments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Post cannot be empty",
      });
    }

    await post.save();

    res.json({
      success: true,
      data: post,
    });
  } catch (err) {
    console.error("Update post error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE /posts/:id  — soft delete
 */
export const deletePost = async (req, res) => {
  try {
    const { userId, userType } = normalizeUser(req.user);
    const { id } = req.params;

    // 🔒 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(id);

    if (!post || post.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Permission check
    const isOwner = post.postedBy.userId.toString() === userId.toString();

    if (!isOwner && userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    // Delete all attachments from Cloudinary
    if (post.attachments?.length > 0) {
      const deletePromises = post.attachments.map((file) =>
        deleteFromCloudinary(file.public_id),
      );

      await Promise.all(deletePromises);
    }

    // Soft delete
    post.status = "deleted";
    await post.save();

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Delete post error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /posts/:id/like  — toggle like
 */
export const toggleLike = async (req, res) => {
  try {
    const { userId } = normalizeUser(req.user);
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // Check if already liked
    const post = await Post.findOne(
      { _id: id, status: "active" },
      { likes: 1 },
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (l) => l.toString() === userId.toString(),
    );

    let updatedPost;

    if (alreadyLiked) {
      // Unlike
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true },
      );
    } else {
      // Like
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } }, // prevents duplicates
        { new: true },
      );
    }

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: updatedPost.likes.length,
    });
  } catch (err) {
    console.error("Toggle like error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /posts/:id/pin  — toggle pin (admin only)
 */
export const togglePin = async (req, res) => {
  try {
    const { userId, userType, schoolId } = normalizeUser(req.user);
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    if (userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    const post = await Post.findOne({
      _id: id,
      status: "active",
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // group access check
    const { error, status } = await verifyGroupAccess(
      post.groupId,
      schoolId,
      userId,
      userType,
    );

    if (error) {
      return res.status(status).json({
        success: false,
        message: error,
      });
    }

    // If pinning → unpin others in same group (ONLY ONE PIN)
    if (!post.isPinned) {
      await Post.updateMany(
        { groupId: post.groupId, isPinned: true },
        { $set: { isPinned: false } },
      );
    }

    // Toggle current post
    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      success: true,
      isPinned: post.isPinned,
    });
  } catch (err) {
    console.error("Toggle pin error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
