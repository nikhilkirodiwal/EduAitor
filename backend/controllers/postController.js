import Post from "../models/post.js";
import Group from "../models/group.js";

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
    const { schoolId, userId, userType } = req.user;
    const { groupId, content, attachments = [] } = req.body;

    if (!content && attachments.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Post must have content or attachment",
        });
    }

    const { group, error, status } = await verifyGroupAccess(
      groupId,
      schoolId,
      userId,
      userType,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    // Check post permission
    if (!group.permissions.canPost.includes(userType)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not allowed to post in this group",
        });
    }

    const post = await Post.create({
      groupId,
      schoolId,
      postedBy: { userId, userType },
      content,
      attachments,
    });

    // Bump group updatedAt for "last activity" sorting
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /posts/group/:groupId
 * Query: page, limit, pinned
 */
export const getGroupPosts = async (req, res) => {
  try {
    const { schoolId, userId, userType } = req.user;
    const { groupId } = req.params;
    const { page = 1, limit = 20, pinned } = req.query;

    const { error, status } = await verifyGroupAccess(
      groupId,
      schoolId,
      userId,
      userType,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    const filter = { groupId, status: "active" };
    if (pinned === "true") filter.isPinned = true;

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: posts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /posts/:id  — edit post content
 */
export const updatePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const post = await Post.findOne({ _id: req.params.id, status: "active" });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (post.postedBy.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not your post" });
    }

    if (req.body.content !== undefined) post.content = req.body.content;
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /posts/:id  — soft delete
 */
export const deletePost = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const post = await Post.findOne({ _id: req.params.id });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const isOwner = post.postedBy.userId.toString() === userId.toString();
    if (!isOwner && userType !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    post.status = "deleted";
    await post.save();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /posts/:id/like  — toggle like
 */
export const toggleLike = async (req, res) => {
  try {
    const { userId } = req.user;
    const post = await Post.findOne({ _id: req.params.id, status: "active" });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const idx = post.likes.findIndex((l) => l.toString() === userId.toString());
    if (idx === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(idx, 1);
    }

    await post.save();
    res.json({
      success: true,
      liked: idx === -1,
      likesCount: post.likes.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /posts/:id/comment
 * Body: { text }
 */
export const addComment = async (req, res) => {
  try {
    const { schoolId, userId, userType } = req.user;
    const { text } = req.body;

    const post = await Post.findOne({ _id: req.params.id, status: "active" });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    // Verify commenter is group member + has comment permission
    const { group, error, status } = await verifyGroupAccess(
      post.groupId,
      schoolId,
      userId,
      userType,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    if (!group.permissions.canComment.includes(userType)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Comments not allowed for your role",
        });
    }

    post.comments.push({ userId, userType, text });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /posts/:id/comment/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const post = await Post.findOne({ _id: req.params.id, status: "active" });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const isOwner = comment.userId.toString() === userId.toString();
    if (!isOwner && userType !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    comment.deleteOne();
    await post.save();
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /posts/:id/pin  — toggle pin (admin/group admin only)
 */
export const togglePin = async (req, res) => {
  try {
    const { userType } = req.user;
    if (userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const post = await Post.findOne({ _id: req.params.id, status: "active" });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
