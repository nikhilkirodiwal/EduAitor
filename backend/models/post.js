import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      enum: ["teacher", "student", "admin", "staff"],
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: String,
    type: {
      type: String,
      enum: ["image", "pdf", "video", "document", "audio", "other"],
      default: "other",
    },
    name: String,
    size: Number,
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    postedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: {
        type: String,
        enum: ["teacher", "student", "admin", "staff"],
        required: true,
      },
    },

    content: {
      type: String,
      trim: true,
    },

    attachments: [attachmentSchema],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    comments: [commentSchema],

    // For pinned announcements
    isPinned: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

postSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);