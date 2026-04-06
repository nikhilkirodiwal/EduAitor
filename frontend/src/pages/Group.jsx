import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || "";

const GROUP_TYPES = [
  { value: "all", label: "All", icon: "⊞" },
  { value: "class", label: "Class", icon: "⊙" },
  { value: "section", label: "Section", icon: "⊚" },
  { value: "subject", label: "Subject", icon: "⊛" },
  { value: "teacher", label: "Teachers", icon: "⊿" },
  { value: "event", label: "Event", icon: "◈" },
  { value: "announcement", label: "Notice", icon: "⊡" },
  { value: "custom", label: "Custom", icon: "⊕" },
];

const TYPE_PALETTE = {
  class: { light: "#EFF6FF", mid: "#BFDBFE", dark: "#1D4ED8", text: "#1E3A8A" },
  section: {
    light: "#F0FDF4",
    mid: "#BBF7D0",
    dark: "#16A34A",
    text: "#14532D",
  },
  subject: {
    light: "#FAF5FF",
    mid: "#DDD6FE",
    dark: "#7C3AED",
    text: "#4C1D95",
  },
  teacher: {
    light: "#FFFBEB",
    mid: "#FDE68A",
    dark: "#D97706",
    text: "#78350F",
  },
  event: { light: "#FFF1F2", mid: "#FECDD3", dark: "#E11D48", text: "#881337" },
  announcement: {
    light: "#FFF7ED",
    mid: "#FED7AA",
    dark: "#EA580C",
    text: "#7C2D12",
  },
  custom: {
    light: "#F8FAFC",
    mid: "#E2E8F0",
    dark: "#64748B",
    text: "#1E293B",
  },
};

const ROLE_PALETTE = {
  school_admin: { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3" },
  teacher_admin: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  student: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  admin: { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3" },
  teacher: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── Tiny reusable atoms ──────────────────────────────────────────────────────

function Avatar({ initials, size = 36, palette }) {
  const p = palette || { bg: "#EFF6FF", text: "#1E3A8A" };
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: p.bg || p.light,
        color: p.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.36),
        fontWeight: 600,
        letterSpacing: "-0.5px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

function TypeBadge({ type }) {
  const p = TYPE_PALETTE[type] || TYPE_PALETTE.custom;
  const t = GROUP_TYPES.find((g) => g.value === type);
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.4px",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 20,
        background: p.light,
        color: p.text,
        border: `1px solid ${p.mid}`,
      }}
    >
      {t?.label || type}
    </span>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid #E2E8F0",
          borderTopColor: "#3B82F6",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

// ─── Sidebar group card ───────────────────────────────────────────────────────

function GroupCard({ group, active, onClick }) {
  const p = TYPE_PALETTE[group.type] || TYPE_PALETTE.custom;
  const t = GROUP_TYPES.find((g) => g.value === group.type);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: active ? p.light : "transparent",
        border: "none",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "background 0.15s",
        marginBottom: 2,
        outline: active ? `1.5px solid ${p.mid}` : "none",
      }}
      onMouseEnter={(e) =>
        !active && (e.currentTarget.style.background = "#F8FAFC")
      }
      onMouseLeave={(e) =>
        !active && (e.currentTarget.style.background = "transparent")
      }
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: p.light,
            border: `1px solid ${p.mid}`,
            color: p.dark,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {t?.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#0F172A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {group.name}
            </span>
            <TypeBadge type={group.type} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: "#64748B" }}>
              {group.members?.length || 0} members
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              {new Date(group.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, onLike, onComment, onDelete, onPin }) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const liked = post.likes?.includes(currentUser?.userId || currentUser?._id);
  const isOwner =
    post.postedBy?.userId === (currentUser?.userId || currentUser?._id);
  const canDelete = isOwner || currentUser?.role === "school_admin";
  const canPin = currentUser?.role === "school_admin";

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await onComment(post._id, commentText);
    setCommentText("");
    setSubmitting(false);
    setShowCommentBox(false);
  };

  const authorInitials = (post.authorName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const rp = ROLE_PALETTE[post.postedBy?.userType] || ROLE_PALETTE.teacher;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        padding: "16px 18px",
        marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {post.isPinned && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "#92400E",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            padding: "3px 9px",
            borderRadius: 6,
            marginBottom: 12,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          ↑ Pinned
        </div>
      )}

      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Avatar
          initials={authorInitials}
          size={38}
          palette={{ bg: rp.bg, text: rp.text }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#0F172A",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {post.authorName || "Unknown"}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 20,
                background: rp.bg,
                color: rp.text,
                border: `1px solid ${rp.border}`,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              {post.postedBy?.userType?.replace("_admin", "") || "teacher"}
            </span>
            <span
              style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}
            >
              {new Date(post.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p
            style={{
              margin: "9px 0 0",
              fontSize: 14,
              color: "#1E293B",
              lineHeight: 1.65,
            }}
          >
            {post.content}
          </p>

          {post.attachments?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              {post.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "#3B82F6",
                    background: "#EFF6FF",
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #BFDBFE",
                    textDecoration: "none",
                  }}
                >
                  {att.type === "pdf"
                    ? "📄"
                    : att.type === "image"
                      ? "🖼"
                      : "📎"}{" "}
                  {att.name || "Attachment"}
                </a>
              ))}
            </div>
          )}

          {/* Actions bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <button
              onClick={() => onLike(post._id)}
              style={{
                background: liked ? "#EFF6FF" : "transparent",
                border: `1px solid ${liked ? "#BFDBFE" : "#E2E8F0"}`,
                borderRadius: 7,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
                color: liked ? "#1D4ED8" : "#64748B",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: liked ? 600 : 400,
              }}
            >
              {liked ? "♥" : "♡"} {post.likes?.length || 0}
            </button>
            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              style={{
                background: "transparent",
                border: "1px solid #E2E8F0",
                borderRadius: 7,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ◎ {post.comments?.length || 0}
            </button>
            {canPin && (
              <button
                onClick={() => onPin(post._id)}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "1px solid #E2E8F0",
                  borderRadius: 7,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "#94A3B8",
                }}
              >
                {post.isPinned ? "Unpin" : "Pin"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(post._id)}
                style={{
                  background: "transparent",
                  border: "1px solid #FEE2E2",
                  borderRadius: 7,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "#EF4444",
                  marginLeft: canPin ? 4 : "auto",
                }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Comments */}
          {post.comments?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {post.comments.slice(-3).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    marginBottom: 6,
                    paddingLeft: 4,
                  }}
                >
                  <Avatar
                    initials={(c.authorName || "U")[0]}
                    size={26}
                    palette={{ bg: "#F8FAFC", text: "#475569" }}
                  />
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 8,
                      padding: "6px 10px",
                      flex: 1,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {c.authorName || "User"}{" "}
                    </span>
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      {c.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCommentBox && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <Avatar
                initials={(currentUser?.name || "Y")[0]}
                size={28}
                palette={{ bg: "#EFF6FF", text: "#1D4ED8" }}
              />
              <input
                autoFocus
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleComment()
                }
                placeholder="Write a comment..."
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "7px 12px",
                  borderRadius: 20,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  outline: "none",
                  color: "#0F172A",
                }}
              />
              <button
                onClick={handleComment}
                disabled={submitting || !commentText.trim()}
                style={{
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: commentText.trim() ? 1 : 0.5,
                }}
              >
                {submitting ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated, currentUser }) {
  const [form, setForm] = useState({
    name: "",
    type: "class",
    description: "",
    permissions: {
      canPost: ["teacher", "admin"],
      canComment: ["teacher", "admin", "student"],
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) return setError("Group name is required");
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/groups/create", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onCreated(data.data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "24px 28px",
          width: 480,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          border: "1px solid #E2E8F0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#0F172A",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Create new group
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 16,
              color: "#64748B",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 14,
              fontSize: 13,
              color: "#BE123C",
            }}
          >
            {error}
          </div>
        )}

        <label style={labelStyle}>Group name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Class 10-A Group"
          style={inputStyle}
        />

        <label style={labelStyle}>Group type</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {GROUP_TYPES.filter((t) => t.value !== "all").map((t) => {
            const p = TYPE_PALETTE[t.value];
            const active = form.type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                style={{
                  padding: "9px 4px",
                  borderRadius: 9,
                  cursor: "pointer",
                  border: `${active ? "1.5px" : "1px"} solid ${active ? p.dark : "#E2E8F0"}`,
                  background: active ? p.light : "#FAFAFA",
                  color: active ? p.text : "#64748B",
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Optional — what is this group for?"
          rows={2}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />

        <label style={labelStyle}>Who can post?</label>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {["teacher", "admin", "student", "staff"].map((role) => {
            const active = form.permissions.canPost.includes(role);
            return (
              <button
                key={role}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    permissions: {
                      ...f.permissions,
                      canPost: active
                        ? f.permissions.canPost.filter((r) => r !== role)
                        : [...f.permissions.canPost, role],
                    },
                  }))
                }
                style={{
                  padding: "5px 13px",
                  borderRadius: 20,
                  cursor: "pointer",
                  border: `1px solid ${active ? "#3B82F6" : "#E2E8F0"}`,
                  background: active ? "#EFF6FF" : "#FAFAFA",
                  color: active ? "#1D4ED8" : "#64748B",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {role}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: "#3B82F6",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: 13,
  marginBottom: 14,
  outline: "none",
};

// ─── Add Members Modal ────────────────────────────────────────────────────────

function AddMembersModal({ groupId, onClose, onAdded }) {
  const [members, setMembers] = useState([{ userId: "", userType: "student" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const valid = members.filter((m) => m.userId.trim());
    if (!valid.length) return setError("Add at least one member ID");
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/groups/${groupId}/add-members`, {
        method: "POST",
        body: JSON.stringify({ members: valid }),
      });
      onAdded();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: 16,
          padding: "24px 28px",
          width: 440,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "#0F172A",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Add members
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 16,
              color: "#64748B",
            }}
          >
            ×
          </button>
        </div>
        {error && (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 12,
              fontSize: 13,
              color: "#BE123C",
            }}
          >
            {error}
          </div>
        )}
        {members.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <input
              value={m.userId}
              placeholder="User ID (MongoDB ObjectId)"
              onChange={(e) =>
                setMembers((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, userId: e.target.value } : x,
                  ),
                )
              }
              style={{ ...inputStyle, flex: 2, margin: 0 }}
            />
            <select
              value={m.userType}
              onChange={(e) =>
                setMembers((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, userType: e.target.value } : x,
                  ),
                )
              }
              style={{ ...inputStyle, flex: 1, margin: 0 }}
            >
              {["teacher", "student", "admin", "staff"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {members.length > 1 && (
              <button
                onClick={() =>
                  setMembers((prev) => prev.filter((_, j) => j !== i))
                }
                style={{
                  background: "#FFF1F2",
                  border: "1px solid #FECDD3",
                  borderRadius: 8,
                  padding: "7px 10px",
                  cursor: "pointer",
                  color: "#EF4444",
                  fontSize: 14,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() =>
            setMembers((prev) => [...prev, { userId: "", userType: "student" }])
          }
          style={{
            background: "transparent",
            border: "1px dashed #CBD5E1",
            borderRadius: 8,
            padding: "7px 14px",
            cursor: "pointer",
            color: "#64748B",
            fontSize: 12,
            marginBottom: 18,
            width: "100%",
          }}
        >
          + Add another
        </button>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: "#3B82F6",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {loading ? "Adding..." : "Add members"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Groups page ─────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const [showCreate, setShowCreate] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // ── Auth check ───────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((d) => {
        // Normalise the user object so we always have userId
        const u = d.user;
        setUser({
          ...u,
          userId: u.teacher_id || u.school_id || "super",
          name: u.name || u.email,
          userType:
            u.role === "teacher_admin"
              ? "teacher"
              : u.role === "school_admin"
                ? "admin"
                : "admin",
        });
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Fetch groups ─────────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setGroupsLoading(true);
    try {
      const endpoint =
        user.role === "school_admin"
          ? "/api/groups/school-groups"
          : "/api/groups/my-groups";
      const data = await apiFetch(endpoint);
      setGroups(data.data || []);
      if (!selectedGroup && data.data?.length) setSelectedGroup(data.data[0]);
    } catch (_) {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (!selectedGroup) return;
    setPostsLoading(true);
    try {
      const data = await apiFetch(`/api/posts/group/${selectedGroup._id}`);
      setPosts(data.data || []);
    } catch (_) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Post actions ─────────────────────────────────────────────────────────────
  const submitPost = async () => {
    if (!newPost.trim()) return;
    setPostLoading(true);
    try {
      await apiFetch("/api/posts/create", {
        method: "POST",
        body: JSON.stringify({ groupId: selectedGroup._id, content: newPost }),
      });
      setNewPost("");
      fetchPosts();
    } catch (_) {
    } finally {
      setPostLoading(false);
    }
  };

  const handleLike = async (postId) => {
    await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
    fetchPosts();
  };

  const handleComment = async (postId, text) => {
    await apiFetch(`/api/posts/${postId}/comment`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    fetchPosts();
  };

  const handleDelete = async (postId) => {
    await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
    fetchPosts();
  };

  const handlePin = async (postId) => {
    await apiFetch(`/api/posts/${postId}/pin`, { method: "POST" });
    fetchPosts();
  };

  // ── Filtered groups ──────────────────────────────────────────────────────────
  const filtered = groups.filter((g) => {
    const mt = activeFilter === "all" || g.type === activeFilter;
    const ms = g.name.toLowerCase().includes(search.toLowerCase());
    return mt && ms;
  });

  const selP = TYPE_PALETTE[selectedGroup?.type] || TYPE_PALETTE.custom;
  const selIcon = GROUP_TYPES.find(
    (t) => t.value === selectedGroup?.type,
  )?.icon;

  const canPost =
    selectedGroup?.permissions?.canPost?.includes(user?.userType) ||
    user?.role === "school_admin";

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (authLoading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#F8FAFC",
        }}
      >
        <Spinner />
      </div>
    );

  if (!user)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#F8FAFC",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#64748B" }}>
            Please log in to access groups.
          </div>
        </div>
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F1F5F9; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        input:focus, textarea:focus { border-color: #93C5FD !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      `}</style>

      {showCreate && (
        <CreateGroupModal
          currentUser={user}
          onClose={() => setShowCreate(false)}
          onCreated={(g) => {
            setGroups((prev) => [g, ...prev]);
            setSelectedGroup(g);
          }}
        />
      )}
      {showAddMembers && selectedGroup && (
        <AddMembersModal
          groupId={selectedGroup._id}
          onClose={() => setShowAddMembers(false)}
          onAdded={() => fetchGroups()}
        />
      )}

      <div style={{ display: "flex", height: "100vh", background: "#F1F5F9" }}>
        {/* ── Left Sidebar ── */}
        <div
          style={{
            width: 288,
            flexShrink: 0,
            background: "#FFFFFF",
            borderRight: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              padding: "16px 14px 10px",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                Groups
              </span>
              {(user.role === "school_admin" ||
                user.role === "teacher_admin") && (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    background: "#3B82F6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  + New
                </button>
              )}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups..."
              style={{
                width: "100%",
                padding: "8px 11px",
                borderRadius: 9,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontSize: 13,
                color: "#0F172A",
                outline: "none",
              }}
            />
          </div>

          {/* Type filters */}
          <div
            style={{
              padding: "8px 12px 6px",
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            {GROUP_TYPES.map((t) => {
              const p = TYPE_PALETTE[t.value];
              const active = activeFilter === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setActiveFilter(t.value)}
                  style={{
                    padding: "3px 9px",
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: active ? 700 : 400,
                    border: `1px solid ${active && p ? p.mid : "#E2E8F0"}`,
                    background: active && p ? p.light : "transparent",
                    color: active && p ? p.text : "#64748B",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Group list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            {groupsLoading ? (
              <Spinner />
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                No groups found
              </div>
            ) : (
              filtered.map((g) => (
                <GroupCard
                  key={g._id}
                  group={g}
                  active={selectedGroup?._id === g._id}
                  onClick={() => {
                    setSelectedGroup(g);
                    setActiveTab("posts");
                  }}
                />
              ))
            )}
          </div>

          {/* User info strip */}
          <div
            style={{
              borderTop: "1px solid #F1F5F9",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Avatar
              initials={(user.name || "U")[0].toUpperCase()}
              size={32}
              palette={
                ROLE_PALETTE[user.role] || { bg: "#EFF6FF", text: "#1E3A8A" }
              }
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0F172A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                {user.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main panel ── */}
        {selectedGroup ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Group header */}
            <div
              style={{
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "14px 24px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: selP.light,
                    border: `1px solid ${selP.mid}`,
                    color: selP.dark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {selIcon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      {selectedGroup.name}
                    </h2>
                    <TypeBadge type={selectedGroup.type} />
                    {selectedGroup.status === "Archived" && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: "#FEF2F2",
                          color: "#B91C1C",
                          border: "1px solid #FECACA",
                          fontWeight: 600,
                        }}
                      >
                        Archived
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      color: "#64748B",
                    }}
                  >
                    {selectedGroup.members?.length || 0} members ·{" "}
                    {posts.length} posts
                    {selectedGroup.description
                      ? ` · ${selectedGroup.description}`
                      : ""}
                  </p>
                </div>
                {user.role === "school_admin" && (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 9,
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    + Members
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0 }}>
                {["posts", "members", "about"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "7px 16px",
                      fontSize: 13,
                      color: activeTab === tab ? selP.text : "#64748B",
                      fontWeight: activeTab === tab ? 700 : 500,
                      borderBottom:
                        activeTab === tab
                          ? `2px solid ${selP.dark}`
                          : "2px solid transparent",
                      textTransform: "capitalize",
                      transition: "color 0.1s",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Posts tab */}
              {activeTab === "posts" && (
                <div style={{ maxWidth: 720 }}>
                  {/* Compose box */}
                  {canPost && (
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        padding: "14px 16px",
                        marginBottom: 16,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <Avatar
                          initials={(user.name || "Y")[0].toUpperCase()}
                          size={36}
                          palette={
                            ROLE_PALETTE[user.role] || {
                              bg: "#EFF6FF",
                              text: "#1E3A8A",
                            }
                          }
                        />
                        <textarea
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          placeholder={`Share something with ${selectedGroup.name}...`}
                          rows={2}
                          style={{
                            flex: 1,
                            resize: "none",
                            border: "1px solid #E2E8F0",
                            borderRadius: 9,
                            padding: "9px 12px",
                            fontSize: 13,
                            background: "#F8FAFC",
                            color: "#0F172A",
                            outline: "none",
                            fontFamily: "inherit",
                            lineHeight: 1.5,
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = "#93C5FD")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "#E2E8F0")
                          }
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 10,
                        }}
                      >
                        <button
                          onClick={submitPost}
                          disabled={!newPost.trim() || postLoading}
                          style={{
                            background: newPost.trim() ? "#3B82F6" : "#E2E8F0",
                            color: newPost.trim() ? "#fff" : "#94A3B8",
                            border: "none",
                            borderRadius: 9,
                            padding: "8px 18px",
                            cursor: newPost.trim() ? "pointer" : "default",
                            fontSize: 13,
                            fontWeight: 700,
                            transition: "all 0.15s",
                          }}
                        >
                          {postLoading ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Posts feed */}
                  {postsLoading ? (
                    <Spinner />
                  ) : posts.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "60px 0",
                        color: "#94A3B8",
                        animation: "fadeIn 0.3s ease",
                      }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 10 }}>◎</div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#64748B",
                        }}
                      >
                        No posts yet
                      </p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>
                        Be the first to post in this group
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div
                        key={post._id}
                        style={{ animation: "fadeIn 0.2s ease" }}
                      >
                        <PostCard
                          post={post}
                          currentUser={user}
                          onLike={handleLike}
                          onComment={handleComment}
                          onDelete={handleDelete}
                          onPin={handlePin}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Members tab */}
              {activeTab === "members" && (
                <div style={{ maxWidth: 640 }}>
                  <div
                    style={{
                      background: "#FFF",
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        padding: "13px 18px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        {selectedGroup.members?.length || 0} members
                      </span>
                    </div>
                    {(selectedGroup.members || []).map((m, i) => {
                      const rp = ROLE_PALETTE[m.userType] || {
                        bg: "#F8FAFC",
                        text: "#374151",
                        border: "#E2E8F0",
                      };
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "11px 18px",
                            borderBottom:
                              i < selectedGroup.members.length - 1
                                ? "1px solid #F8FAFC"
                                : "none",
                          }}
                        >
                          <Avatar
                            initials={(m.userId?.toString() ||
                              "U")[0].toUpperCase()}
                            size={36}
                            palette={{ bg: rp.bg, text: rp.text }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0F172A",
                              }}
                            >
                              {m.userId?.toString()}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748B",
                                marginTop: 1,
                              }}
                            >
                              {m.userType}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: rp.bg,
                              color: rp.text,
                              border: `1px solid ${rp.border}`,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {m.role || "member"}
                          </span>
                          {user.role === "school_admin" && (
                            <button
                              style={{
                                background: "transparent",
                                border: "1px solid #FEE2E2",
                                borderRadius: 7,
                                padding: "3px 9px",
                                cursor: "pointer",
                                fontSize: 11,
                                color: "#EF4444",
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* About tab */}
              {activeTab === "about" && (
                <div style={{ maxWidth: 560 }}>
                  <div
                    style={{
                      background: "#FFF",
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      padding: "20px 22px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ marginBottom: 20 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 6,
                        }}
                      >
                        Description
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          lineHeight: 1.7,
                        }}
                      >
                        {selectedGroup.description || "No description added."}
                      </p>
                    </div>
                    <div
                      style={{
                        paddingTop: 18,
                        borderTop: "1px solid #F1F5F9",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                      }}
                    >
                      {[
                        { label: "Type", value: selectedGroup.type },
                        {
                          label: "Status",
                          value: selectedGroup.status || "Active",
                        },
                        {
                          label: "Auto-created",
                          value: selectedGroup.isAutoCreated ? "Yes" : "No",
                        },
                        {
                          label: "Created",
                          value: new Date(
                            selectedGroup.createdAt,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }),
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#94A3B8",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: 4,
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#0F172A",
                            }}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        paddingTop: 18,
                        marginTop: 18,
                        borderTop: "1px solid #F1F5F9",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 10,
                        }}
                      >
                        Permissions
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        {[
                          {
                            label: "Can post",
                            roles: selectedGroup.permissions?.canPost || [],
                          },
                          {
                            label: "Can comment",
                            roles: selectedGroup.permissions?.canComment || [],
                          },
                        ].map((perm) => (
                          <div
                            key={perm.label}
                            style={{
                              background: "#F8FAFC",
                              borderRadius: 9,
                              padding: "10px 13px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 11,
                                color: "#64748B",
                                fontWeight: 600,
                                marginBottom: 7,
                              }}
                            >
                              {perm.label}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              {perm.roles.map((r) => (
                                <span
                                  key={r}
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    background:
                                      ROLE_PALETTE[r]?.bg || "#F1F5F9",
                                    color: ROLE_PALETTE[r]?.text || "#374151",
                                    border: `1px solid ${ROLE_PALETTE[r]?.border || "#E2E8F0"}`,
                                    fontWeight: 600,
                                  }}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.4 }}>
                ⊞
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#64748B" }}>
                Select a group
              </p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Choose from the sidebar to view posts and members
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
