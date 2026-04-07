import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiSend,
  FiPaperclip,
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiEdit2,
  FiX,
  FiChevronLeft,
  FiUserPlus,
  FiUserMinus,
  FiArchive,
  FiLoader,
  FiImage,
  FiFile,
  FiDownload,
  FiClock,
  FiHash,
} from "react-icons/fi";
import {
  MdOutlineClass,
  MdOutlineGroups,
  MdAnnouncement,
  MdEventNote,
  MdSubject,
  MdPin,
} from "react-icons/md";

// ─── API BASE ─────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GROUP_TYPE_META = {
  class: { label: "Class", icon: MdOutlineClass, color: "#6366f1" },
  section: { label: "Section", icon: FiHash, color: "#8b5cf6" },
  subject: { label: "Subject", icon: MdSubject, color: "#0ea5e9" },
  teacher: { label: "Teacher", icon: FiUsers, color: "#10b981" },
  event: { label: "Event", icon: MdEventNote, color: "#f59e0b" },
  announcement: {
    label: "Announcement",
    icon: MdAnnouncement,
    color: "#ef4444",
  },
  custom: { label: "Custom", icon: MdOutlineGroups, color: "#64748b" },
};

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

function getAvatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name = "", size = 36, url, className = "" }) {
  const bg = getAvatarColor(name);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={`avatar-circle ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: url ? "transparent" : bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── TYPE BADGE ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const meta = GROUP_TYPE_META[type] || GROUP_TYPE_META.custom;
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        background: meta.color + "18",
        color: meta.color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      <Icon size={11} /> {meta.label}
    </span>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, radius = 6, style = {} }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "var(--skeleton)",
        animation: "shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ─── GROUP CARD ───────────────────────────────────────────────────────────────
function GroupCard({ group, isActive, onClick, userType }) {
  const meta = GROUP_TYPE_META[group.type] || GROUP_TYPE_META.custom;
  const Icon = meta.icon;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        cursor: "pointer",
        background: isActive ? "var(--accent-soft)" : "transparent",
        borderLeft: isActive
          ? `3px solid var(--accent)`
          : "3px solid transparent",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
      className="group-card-hover"
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: meta.color + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={meta.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {group.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          <TypeBadge type={group.type} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {group.members?.length || 0} members
          </span>
        </div>
      </div>
      {group.status === "Archived" && (
        <FiArchive size={14} color="var(--text-muted)" />
      )}
    </div>
  );
}

// ─── CREATE GROUP MODAL ───────────────────────────────────────────────────────
function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    type: "custom",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!form.name.trim()) return toast.error("Group name is required");
    setLoading(true);
    try {
      const { data } = await api.post("/groups", form);
      if (data.success) {
        toast.success("Group created!");
        onCreated(data.data);
        onClose();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "28px 28px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Create New Group
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <FiX size={20} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Group Name *">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Grade 10 - Mathematics"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Type">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={inputStyle}
            >
              {Object.entries(GROUP_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FormField>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 6,
            }}
          >
            <button onClick={onClose} style={secondaryBtnStyle}>
              Cancel
            </button>
            <button onClick={handle} disabled={loading} style={primaryBtnStyle}>
              {loading ? (
                <FiLoader size={14} className="spin" />
              ) : (
                <FiPlus size={14} />
              )}
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── ADD MEMBERS MODAL ────────────────────────────────────────────────────────
function AddMembersModal({ groupId, onClose, onAdded }) {
  const [userId, setUserId] = useState("");
  const [userType, setUserType] = useState("teacher");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!userId.trim()) return toast.error("User ID is required");
    setLoading(true);
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, {
        members: [{ userId, userType }],
      });
      if (data.success) {
        toast.success("Member added!");
        onAdded();
        onClose();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Add Members
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <FiX size={20} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="User ID *">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="MongoDB ObjectId"
              style={inputStyle}
            />
          </FormField>
          <FormField label="User Type">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              style={inputStyle}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </FormField>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 6,
            }}
          >
            <button onClick={onClose} style={secondaryBtnStyle}>
              Cancel
            </button>
            <button onClick={handle} disabled={loading} style={primaryBtnStyle}>
              {loading ? (
                <FiLoader size={14} className="spin" />
              ) : (
                <FiUserPlus size={14} />
              )}
              Add Member
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onLike, onPin, onDelete, onUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);

  const isOwner =
    post.postedBy?.userId?._id === currentUser?.id ||
    post.postedBy?.userId?.toString() === currentUser?.id;
  const isAdmin = currentUser?.role === "school_admin";
  const liked = post.likes?.some((l) => l?.toString() === currentUser?.id);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/posts/${post._id}`, {
        content: editContent,
      });
      if (data.success) {
        onUpdate(data.data);
        setEditing(false);
        toast.success("Post updated");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const posterName = post.postedBy?.userId?.name || "Unknown";

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
      className="post-card-hover"
    >
      {/* Pinned Banner */}
      {post.isPinned && (
        <div
          style={{
            background: "linear-gradient(90deg, #f59e0b15, #f59e0b08)",
            borderBottom: "1px solid #f59e0b30",
            padding: "6px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "#f59e0b",
            fontWeight: 600,
          }}
        >
          <MdPin size={11} /> Pinned Post
        </div>
      )}

      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              name={posterName}
              size={38}
              url={post.postedBy?.userId?.photo}
            />
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text-primary)",
                }}
              >
                {posterName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiClock size={10} /> {timeAgo(post.createdAt)}
                <span
                  style={{
                    marginLeft: 4,
                    padding: "1px 6px",
                    borderRadius: 8,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {post.postedBy?.userType}
                </span>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          {(isOwner || isAdmin) && (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <FiMoreVertical size={16} />
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 28,
                    zIndex: 100,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "4px 0",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    minWidth: 160,
                  }}
                >
                  {isOwner && (
                    <MenuItem
                      icon={<FiEdit2 size={13} />}
                      label="Edit Post"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    />
                  )}
                  {isAdmin && (
                    <MenuItem
                      icon={<FiPin size={13} />}
                      label={post.isPinned ? "Unpin Post" : "Pin Post"}
                      onClick={() => {
                        onPin(post._id);
                        setMenuOpen(false);
                      }}
                    />
                  )}
                  {(isOwner || isAdmin) && (
                    <MenuItem
                      icon={<FiTrash2 size={13} />}
                      label="Delete Post"
                      danger
                      onClick={() => {
                        onDelete(post._id);
                        setMenuOpen(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div style={{ marginBottom: 12 }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              style={{
                ...inputStyle,
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setEditing(false)}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={primaryBtnStyle}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {post.content}
            </p>
          )
        )}

        {/* Attachments */}
        {post.attachments?.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                post.attachments.length === 1 ? "1fr" : "repeat(2, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {post.attachments.map((att, i) => (
              <AttachmentPreview key={i} attachment={att} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => onLike(post._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: liked ? "#ef4444" : "var(--text-muted)",
              fontSize: 13,
              fontWeight: 500,
              padding: "4px 0",
              transition: "color 0.15s ease",
            }}
          >
            <FiHeart size={15} fill={liked ? "#ef4444" : "none"} />
            {post.likes?.length || 0}{" "}
            {post.likes?.length === 1 ? "Like" : "Likes"}
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            <FiMessageCircle size={15} />
            {post.comments?.length || 0} Comments
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ATTACHMENT PREVIEW ───────────────────────────────────────────────────────
function AttachmentPreview({ attachment }) {
  const isImage =
    attachment.fileType === "image" || attachment.type === "image";
  const isPdf = attachment.fileType === "pdf" || attachment.type === "pdf";

  if (isImage) {
    return (
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--hover)",
        }}
      >
        <img
          src={attachment.url}
          alt={attachment.name || "attachment"}
          style={{
            width: "100%",
            height: 180,
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--hover)",
        textDecoration: "none",
        color: "var(--text-primary)",
      }}
    >
      {isPdf ? (
        <FiFile size={18} color="#ef4444" />
      ) : (
        <FiFile size={18} color="var(--accent)" />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {attachment.name || "File"}
        </div>
        {attachment.size && (
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {(attachment.size / 1024).toFixed(1)} KB
          </div>
        )}
      </div>
      <FiDownload size={14} color="var(--text-muted)" />
    </a>
  );
}

// ─── CREATE POST ──────────────────────────────────────────────────────────────
function CreatePost({ groupId, currentUser, onPosted }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const submit = async () => {
    if (!content.trim() && files.length === 0) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("groupId", groupId);
      fd.append("content", content);
      files.forEach((f) => fd.append("attachments", f));

      const { data } = await api.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        setContent("");
        setFiles([]);
        onPosted(data.data);
        toast.success("Post created!");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={currentUser?.name || "You"} size={36} />
        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with this group..."
            rows={3}
            style={{
              ...inputStyle,
              width: "100%",
              boxSizing: "border-box",
              resize: "none",
              fontSize: 14,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />

          {/* File previews */}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {f.type.startsWith("image/") ? (
                    <FiImage size={11} />
                  ) : (
                    <FiFile size={11} />
                  )}
                  {f.name}
                  <button
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <FiX size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: 8,
                transition: "background 0.15s ease",
              }}
              className="attach-btn"
            >
              <FiPaperclip size={15} /> Attach
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) =>
                setFiles([...files, ...Array.from(e.target.files)])
              }
            />
            <button
              onClick={submit}
              disabled={loading || (!content.trim() && files.length === 0)}
              style={{
                ...primaryBtnStyle,
                opacity: !content.trim() && files.length === 0 ? 0.5 : 1,
              }}
            >
              {loading ? (
                <FiLoader size={14} className="spin" />
              ) : (
                <FiSend size={14} />
              )}
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GROUP DETAIL PANEL ───────────────────────────────────────────────────────
function GroupDetail({ group, currentUser, onGroupUpdated }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("posts");
  const [showAddMember, setShowAddMember] = useState(false);
  const isAdmin = currentUser?.role === "school_admin";

  const fetchPosts = useCallback(
    async (pg = 1) => {
      setLoading(true);
      try {
        const { data } = await api.get(`/posts/group/${group._id}`, {
          params: { page: pg, limit: 10 },
        });
        if (data.success) {
          setPosts(pg === 1 ? data.data : (prev) => [...prev, ...data.data]);
          setTotalPages(data.totalPages);
          setPage(pg);
        }
      } catch (e) {
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [group._id],
  );

  useEffect(() => {
    fetchPosts(1);
    setActiveTab("posts");
  }, [group._id, fetchPosts]);

  const handleLike = async (postId) => {
    try {
      const { data } = await api.patch(`/posts/${postId}/like`);
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id !== postId) return p;
            const userId = currentUser?.id;
            const alreadyLiked = p.likes?.some((l) => l?.toString() === userId);
            return {
              ...p,
              likes: alreadyLiked
                ? p.likes.filter((l) => l?.toString() !== userId)
                : [...(p.likes || []), userId],
            };
          }),
        );
      }
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const handlePin = async (postId) => {
    try {
      const { data } = await api.patch(`/posts/${postId}/pin`);
      if (data.success) {
        fetchPosts(1);
        toast.success(data.isPinned ? "Post pinned" : "Post unpinned");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      const { data } = await api.delete(`/posts/${postId}`);
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        toast.success("Post deleted");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Remove this member?")) return;
    try {
      const { data } = await api.delete(`/groups/${group._id}/members`, {
        data: { memberIds: [memberId] },
      });
      if (data.success) {
        onGroupUpdated(data.data);
        toast.success("Member removed");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove member");
    }
  };

  const meta = GROUP_TYPE_META[group.type] || GROUP_TYPE_META.custom;
  const Icon = meta.icon;

  // Separate pinned
  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const canPost = group.permissions?.canPost?.includes(
    currentUser?.role === "school_admin" ? "admin" : "teacher",
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Group Header */}
      <div
        style={{
          padding: "20px 24px 0",
          borderBottom: "1px solid var(--border)",
          background: "var(--card-bg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: meta.color + "20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={26} color={meta.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {group.name}
              </h2>
              <TypeBadge type={group.type} />
              {group.status === "Archived" && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "#64748b20",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Archived
                </span>
              )}
            </div>
            {group.description && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {group.description}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 6,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <span>
                <FiUsers size={12} style={{ marginRight: 4 }} />
                {group.members?.length || 0} members
              </span>
              {group.classId && (
                <span>
                  <MdOutlineClass size={12} style={{ marginRight: 4 }} />
                  {group.classId.name}
                </span>
              )}
              {group.sectionId && (
                <span>
                  <FiHash size={12} style={{ marginRight: 4 }} />
                  {group.sectionId.name}
                </span>
              )}
              {group.subjectId && (
                <span>
                  <MdSubject size={12} style={{ marginRight: 4 }} />
                  {group.subjectId.name}
                </span>
              )}
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowAddMember(true)}
                style={{
                  ...secondaryBtnStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                }}
              >
                <FiUserPlus size={13} /> Add
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {["posts", "members"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color:
                  activeTab === tab ? "var(--accent)" : "var(--text-muted)",
                borderBottom:
                  activeTab === tab
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {tab === "posts"
                ? `Posts (${posts.length})`
                : `Members (${group.members?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {activeTab === "posts" && (
          <div>
            {/* Create Post */}
            {canPost && (
              <CreatePost
                groupId={group._id}
                currentUser={currentUser}
                onPosted={(post) => setPosts((prev) => [post, ...prev])}
              />
            )}

            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FiPin size={11} /> Pinned
                </div>
                {pinnedPosts.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onUpdate={(updated) =>
                      setPosts((prev) =>
                        prev.map((x) => (x._id === updated._id ? updated : x)),
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Regular Posts */}
            {loading && posts.length === 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <Skeleton w={38} h={38} radius={19} />
                      <div style={{ flex: 1 }}>
                        <Skeleton h={14} style={{ marginBottom: 6 }} />
                        <Skeleton h={12} w="60%" />
                      </div>
                    </div>
                    <Skeleton h={14} style={{ marginBottom: 6 }} />
                    <Skeleton h={14} w="80%" />
                  </div>
                ))}
              </div>
            ) : regularPosts.length === 0 && pinnedPosts.length === 0 ? (
              <EmptyState
                icon={<FiMessageCircle size={36} />}
                title="No posts yet"
                subtitle={
                  canPost
                    ? "Be the first to share something!"
                    : "Nothing has been posted here yet."
                }
              />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {regularPosts.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onUpdate={(updated) =>
                      setPosts((prev) =>
                        prev.map((x) => (x._id === updated._id ? updated : x)),
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {page < totalPages && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => fetchPosts(page + 1)}
                  disabled={loading}
                  style={secondaryBtnStyle}
                >
                  {loading ? <FiLoader size={14} className="spin" /> : null}
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.members?.map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Avatar
                    name={
                      member.userId?.name || member.userId?.toString() || "?"
                    }
                    size={36}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      {member.userId?.name || member.userId?.toString()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: "1px 7px",
                          borderRadius: 10,
                          background: "var(--hover)",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        {member.userType}
                      </span>
                      {member.role && member.role !== "member" && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "1px 7px",
                            borderRadius: 10,
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        handleRemoveMember(
                          member.userId?.toString() || member.userId,
                        )
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: 6,
                        borderRadius: 6,
                        transition: "color 0.15s ease",
                      }}
                      title="Remove member"
                    >
                      <FiUserMinus size={15} />
                    </button>
                  )}
                </div>
              ))}
              {(!group.members || group.members.length === 0) && (
                <EmptyState
                  icon={<FiUsers size={36} />}
                  title="No members"
                  subtitle="Add members to this group"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {showAddMember && (
        <AddMembersModal
          groupId={group._id}
          onClose={() => setShowAddMember(false)}
          onAdded={async () => {
            const { data } = await api.get(`/groups/${group._id}`);
            if (data.success) onGroupUpdated(data.data);
          }}
        />
      )}
    </div>
  );
}

// ─── SHARED UI HELPERS ────────────────────────────────────────────────────────
function ModalOverlay({ onClose, children }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "modalIn 0.2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "9px 14px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        textAlign: "left",
        color: danger ? "#ef4444" : "var(--text-primary)",
        transition: "background 0.1s ease",
      }}
      className="menu-item-hover"
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13 }}>{subtitle}</div>
    </div>
  );
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s ease",
};

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "opacity 0.15s ease",
  fontFamily: "'DM Sans', sans-serif",
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  background: "var(--hover)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  transition: "background 0.15s ease",
  fontFamily: "'DM Sans', sans-serif",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("split"); // split | list
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");

  // Fetch current user
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (data.success) {
          setCurrentUser({
            ...data.user,
            id: data.user.school_id || data.user.teacher_id,
          });
        }
      })
      .catch(() => {});

    // detect OS theme
    // const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // setTheme(mq.matches ? "dark" : "light");
    // const handler = (e) => setTheme(e.matches ? "dark" : "light");
    // mq.addEventListener("change", handler);
    // return () => mq.removeEventListener("change", handler);
    setTheme("light");
  }, []);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        currentUser?.role === "school_admin"
          ? "/groups/school-groups"
          : "/groups/my-groups";
      const { data } = await api.get(endpoint, { params: { limit: 50 } });
      if (data.success) {
        setGroups(data.data || []);
        if (data.data?.length > 0 && !selectedGroup) {
          setSelectedGroup(data.data[0]);
        }
      }
    } catch (e) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser) fetchGroups();
  }, [currentUser, fetchGroups]);

  // Filtered groups
  const filteredGroups = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || g.type === filterType;
    return matchSearch && matchType;
  });

  const isDark = false;

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        :root {
          --accent: ${isDark ? "#6366f1" : "#4f46e5"};
          --accent-soft: ${isDark ? "#6366f115" : "#4f46e510"};
          --bg: ${isDark ? "#0f1117" : "#f8f9fc"};
          --card-bg: ${isDark ? "#161b27" : "#ffffff"};
          --border: ${isDark ? "#1e2738" : "#e8ebf0"};
          --text-primary: ${isDark ? "#e2e8f0" : "#1a202c"};
          --text-muted: ${isDark ? "#64748b" : "#8896a5"};
          --hover: ${isDark ? "#1e2535" : "#f1f5f9"};
          --input-bg: ${isDark ? "#1e2535" : "#f8fafc"};
          --skeleton: ${isDark ? "#1e2535" : "#f0f3f7"};
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes shimmer {
          0% { opacity: 1 } 50% { opacity: 0.5 } 100% { opacity: 1 }
        }
        @keyframes spin {
          from { transform: rotate(0deg) } to { transform: rotate(360deg) }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .spin { animation: spin 0.8s linear infinite; }
        .group-card-hover:hover { background: var(--hover) !important; }
        .post-card-hover:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .menu-item-hover:hover { background: var(--hover); }
        .attach-btn:hover { background: var(--hover); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        input:focus, textarea:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
      `}</style>

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "var(--bg)",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdOutlineGroups size={18} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text-primary)",
              }}
            >
              Groups
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontWeight: 600,
              }}
            >
              {groups.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{
                ...secondaryBtnStyle,
                padding: "6px 10px",
                fontSize: 16,
              }}
              title="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button> */}
            {(currentUser?.role === "school_admin" ||
              currentUser?.role === "teacher_admin") && (
              <button
                onClick={() => setShowCreate(true)}
                style={primaryBtnStyle}
              >
                <FiPlus size={14} /> New Group
              </button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            height: "calc(100vh - 57px)",
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: sidebarCollapsed ? 0 : 280,
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              background: "var(--card-bg)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "width 0.25s ease",
            }}
          >
            {!sidebarCollapsed && (
              <>
                {/* Search + Filter */}
                <div style={{ padding: "14px 14px 10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 8,
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      marginBottom: 10,
                    }}
                  >
                    <FiSearch size={14} color="var(--text-muted)" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search groups..."
                      style={{
                        background: "none",
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        color: "var(--text-primary)",
                        flex: 1,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 0,
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    )}
                  </div>

                  {/* Type filter chips */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <TypeChip
                      label="All"
                      value="all"
                      active={filterType === "all"}
                      onClick={() => setFilterType("all")}
                    />
                    {Object.entries(GROUP_TYPE_META).map(([k, v]) => (
                      <TypeChip
                        key={k}
                        label={v.label}
                        value={k}
                        active={filterType === k}
                        onClick={() => setFilterType(k)}
                        color={v.color}
                      />
                    ))}
                  </div>
                </div>

                {/* Group List */}
                <div
                  style={{ flex: 1, overflow: "auto", padding: "0 8px 12px" }}
                >
                  {loading ? (
                    <div
                      style={{
                        padding: "8px 6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 6px",
                          }}
                        >
                          <Skeleton w={42} h={42} radius={10} />
                          <div style={{ flex: 1 }}>
                            <Skeleton h={13} style={{ marginBottom: 6 }} />
                            <Skeleton h={11} w="60%" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px 16px",
                        color: "var(--text-muted)",
                        fontSize: 13,
                      }}
                    >
                      {search ? "No groups found" : "No groups yet"}
                    </div>
                  ) : (
                    filteredGroups.map((g) => (
                      <GroupCard
                        key={g._id}
                        group={g}
                        isActive={selectedGroup?._id === g._id}
                        onClick={() => setSelectedGroup(g)}
                        userType={currentUser?.role}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: "absolute",
              left: sidebarCollapsed ? 0 : 274,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 20,
              height: 44,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderLeft: sidebarCollapsed ? "1px solid var(--border)" : "none",
              borderRadius: sidebarCollapsed ? "0 6px 6px 0" : "0 6px 6px 0",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "left 0.25s ease",
              boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
            }}
          >
            <FiChevronLeft
              size={12}
              style={{
                transform: sidebarCollapsed ? "rotate(180deg)" : "none",
                transition: "transform 0.25s ease",
              }}
            />
          </button>

          {/* Detail Panel */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {selectedGroup ? (
              <GroupDetail
                key={selectedGroup._id}
                group={selectedGroup}
                currentUser={currentUser}
                onGroupUpdated={(updated) => {
                  setGroups((prev) =>
                    prev.map((g) => (g._id === updated._id ? updated : g)),
                  );
                  setSelectedGroup(updated);
                }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ opacity: 0.3 }}>
                  <MdOutlineGroups size={64} />
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: "var(--text-primary)",
                  }}
                >
                  Select a group
                </div>
                <div style={{ fontSize: 13 }}>
                  Choose a group from the sidebar to see posts and members
                </div>
                {(currentUser?.role === "school_admin" ||
                  currentUser?.role === "teacher_admin") && (
                  <button
                    onClick={() => setShowCreate(true)}
                    style={{ ...primaryBtnStyle, marginTop: 8 }}
                  >
                    <FiPlus size={14} /> Create your first group
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(group) => {
            setGroups((prev) => [group, ...prev]);
            setSelectedGroup(group);
          }}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme={isDark ? "dark" : "light"}
        toastStyle={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          borderRadius: 10,
        }}
      />
    </>
  );
}

// ─── TYPE CHIP ────────────────────────────────────────────────────────────────
function TypeChip({ label, value, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 9px",
        borderRadius: 20,
        background: active ? (color || "var(--accent)") + "20" : "transparent",
        border: `1px solid ${active ? (color || "var(--accent)") + "50" : "var(--border)"}`,
        color: active ? color || "var(--accent)" : "var(--text-muted)",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </button>
  );
}
