import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiArrowRight,
  FiBell,
  FiBook,
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiSettings,
  FiMessageSquare,
  FiTruck,
  FiFileText,
  FiCheckSquare,
  FiAlertCircle,
} from "react-icons/fi";
import {
  FaArrowLeft,
  FaUserGraduate,
  FaBus,
  FaClipboardList,
  FaBookOpen,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const settingsKey = "parentDashboardVisibility";
const defaultVisibility = {
  transport: true,
  fees: true,
  attendance: true,
  assignments: true,
  library: true,
  diary: true,
  notices: true,
  groups: true,
};

const formatShortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "—";

const badgeTones = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
};

const iconTones = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  red: "bg-red-50 text-red-600",
  sky: "bg-sky-50 text-sky-600",
};

const ParentDashboard = () => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibility, setVisibility] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  const [data, setData] = useState({
    transport: null,
    fees: null,
    attendance: [],
    assignments: [],
    myIssues: [],
    diary: [],
    notices: [],
    events: [],
    groups: [],
    attendanceMeta: null,
  });

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(visibility));
  }, [visibility]);

  const fetchDashboard = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);

      const [
        transportRes,
        feesRes,
        assignmentsRes,
        libraryRes,
        noticesRes,
        eventsRes,
        groupsRes,
        attendanceMetaRes,
      ] = await Promise.allSettled([
        axios.get(`${API}/transport/parent/my-route`, {
          withCredentials: true,
        }),
        axios.get(`${API}/fees/parent/student/me`, { withCredentials: true }),
        axios.get(`${API}/assignment/student/list`, { withCredentials: true }),
        axios.get(`${API}/library/issues/my`, { withCredentials: true }),
        axios.get(`${API}/notices`, { withCredentials: true }),
        axios.get(`${API}/events`, { withCredentials: true }),
        axios.get(`${API}/groups/my-groups`, { withCredentials: true }),
        axios.get(`${API}/attendance/parent/student-meta`, {
          withCredentials: true,
        }),
      ]);

      setData({
        transport:
          transportRes.status === "fulfilled" ? transportRes.value.data : null,
        fees: feesRes.status === "fulfilled" ? feesRes.value.data : null,
        assignments:
          assignmentsRes.status === "fulfilled"
            ? assignmentsRes.value.data?.data || []
            : [],
        myIssues:
          libraryRes.status === "fulfilled"
            ? libraryRes.value.data?.myIssues || []
            : [],
        notices:
          noticesRes.status === "fulfilled"
            ? noticesRes.value.data?.notices || []
            : [],
        events:
          eventsRes.status === "fulfilled"
            ? eventsRes.value.data?.events || []
            : [],
        groups:
          groupsRes.status === "fulfilled"
            ? groupsRes.value.data?.data || []
            : [],
        attendanceMeta:
          attendanceMetaRes.status === "fulfilled"
            ? attendanceMetaRes.value.data
            : null,
      });
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = useMemo(() => {
    const transportAssigned = data.transport?.assigned ?? false;
    const transportStatus = data.transport?.data?.route?.status || "—";

    const totalDue = data.fees?.totalDue ?? 0;
    const totalPaid = data.fees?.totalPaid ?? 0;
    const finalFee = data.fees?.finalFee ?? 0;

    const totalAssignments = data.assignments.length;
    const pendingAssignments = data.assignments.filter(
      (a) => a.status === "active" && !a.submitted,
    ).length;
    const submittedAssignments = data.assignments.filter(
      (a) => a.submitted,
    ).length;
    const overdueAssignments = data.assignments.filter(
      (a) => !a.submitted && new Date(a.dueDate) < new Date(),
    ).length;

    const activeBooks = data.myIssues.filter(
      (i) => i.status !== "Returned",
    ).length;
    const overdueBooks = data.myIssues.filter(
      (i) => i.status === "Overdue",
    ).length;
    const totalFine = data.myIssues.reduce(
      (s, i) => s + (i.outstandingFine || 0),
      0,
    );

    const upcomingEvents = data.events.filter(
      (e) => new Date(e.startDate) >= new Date(),
    ).length;

    const activeGroups = data.groups.filter(
      (g) => g.status === "Active",
    ).length;

    const studentName = data.attendanceMeta?.student?.name || "";
    const className = data.attendanceMeta?.student?.className || "";
    const sectionName = data.attendanceMeta?.student?.sectionName || "";

    return {
      transportAssigned,
      transportStatus,
      totalDue,
      totalPaid,
      finalFee,
      totalAssignments,
      pendingAssignments,
      submittedAssignments,
      overdueAssignments,
      activeBooks,
      overdueBooks,
      totalFine,
      upcomingEvents,
      activeGroups,
      studentName,
      className,
      sectionName,
    };
  }, [data]);

  const recentAssignments = useMemo(
    () =>
      [...data.assignments]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [data.assignments],
  );

  const recentIssues = useMemo(
    () =>
      [...data.myIssues]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [data.myIssues],
  );

  const latestNotices = data.notices.slice(0, 3);

  const upcomingEventsList = useMemo(
    () =>
      data.events
        .filter((e) => new Date(e.startDate) >= new Date())
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 3),
    [data.events],
  );

  const quickActions = [
    {
      label: "View Attendance",
      helper: "Check monthly attendance report",
      icon: <FiCheckSquare />,
      to: "/parent/attendance",
      tone: "blue",
    },
    {
      label: "My Assignments",
      helper: "Pending homework & quizzes",
      icon: <FaClipboardList />,
      to: "/parent/assignments",
      tone: "emerald",
    },
    {
      label: "Fee Details",
      helper: "Payment history & dues",
      icon: <FiFileText />,
      to: "/parent/fees",
      tone: "amber",
    },
    {
      label: "My Books",
      helper: "Issued library books",
      icon: <FaBookOpen />,
      to: "/parent/library",
      tone: "violet",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
          <p className="text-sm font-semibold text-slate-600">
            Loading parent dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {isMobile && (
        <div className="pt-4 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100 text-sm font-bold text-slate-600 active:scale-95 transition-transform mb-2.5"
          >
            <FaArrowLeft size={16} />
            Back
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Parent Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                {metrics.studentName
                  ? `Monitoring ${metrics.studentName} — ${metrics.className}${metrics.sectionName ? ` · ${metrics.sectionName}` : ""}`
                  : "Track your child's attendance, assignments, fees, transport and school updates."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiSettings />
                Dashboard Settings
              </button>
              <button
                onClick={() => fetchDashboard({ silent: true })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
          {settingsOpen && (
            <DashboardSettingsControl
              visibility={visibility}
              onToggle={(key) =>
                setVisibility((cur) => ({ ...cur, [key]: !cur[key] }))
              }
              onReset={() => setVisibility(defaultVisibility)}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Stats */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Fee Due"
            value={`₹${metrics.totalDue.toLocaleString()}`}
            note={`₹${metrics.totalPaid.toLocaleString()} paid of ₹${metrics.finalFee.toLocaleString()}`}
            icon={<FiFileText />}
            tone="amber"
          />
          <StatCard
            title="Assignments"
            value={metrics.totalAssignments}
            note={`${metrics.pendingAssignments} pending · ${metrics.submittedAssignments} submitted`}
            icon={<FaClipboardList />}
            tone="blue"
          />
          <StatCard
            title="Library Books"
            value={metrics.activeBooks}
            note={`${metrics.overdueBooks} overdue · ₹${metrics.totalFine} fine`}
            icon={<FaBookOpen />}
            tone="violet"
          />
          <StatCard
            title="Transport"
            value={metrics.transportAssigned ? "Assigned" : "Not Assigned"}
            note={
              metrics.transportAssigned
                ? `Route: ${metrics.transportStatus}`
                : "No route linked"
            }
            icon={<FaBus />}
            tone={metrics.transportAssigned ? "emerald" : "red"}
          />
        </section>

        {/* Command Banner + Alert Panel */}
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-sky-950 to-cyan-900 p-6 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Overview
            </p>
            <h2 className="mt-3 text-2xl font-black">
              {metrics.studentName
                ? `${metrics.studentName}'s school summary`
                : "Your child's school summary"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Track academic progress, pending dues, transport status, library
              books and group messages — all from one place.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HighlightCard
                label="Active Groups"
                value={metrics.activeGroups}
                subtext="Class & subject groups"
              />
              <HighlightCard
                label="Upcoming Events"
                value={metrics.upcomingEvents}
                subtext="On school calendar"
              />
              <HighlightCard
                label="Outstanding Fine"
                value={`₹${metrics.totalFine}`}
                subtext="Library dues"
              />
              <HighlightCard
                label="Overdue Assignments"
                value={metrics.overdueAssignments}
                subtext="Past due date"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <FiAlertCircle />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Attention Needed
                </h2>
                <p className="text-sm text-slate-500">
                  Items requiring your action
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <AlertRow
                label="Fee Due"
                value={`₹${metrics.totalDue.toLocaleString()}`}
                helper="Pending fee payment"
                tone={metrics.totalDue > 0 ? "red" : "emerald"}
              />
              <AlertRow
                label="Overdue Assignments"
                value={metrics.overdueAssignments}
                helper="Past submission deadline"
                tone={metrics.overdueAssignments > 0 ? "red" : "emerald"}
              />
              <AlertRow
                label="Overdue Books"
                value={metrics.overdueBooks}
                helper="Library books past due date"
                tone={metrics.overdueBooks > 0 ? "amber" : "emerald"}
              />
              <AlertRow
                label="Active Notices"
                value={data.notices.filter((n) => n.isActive).length}
                helper="School-wide announcements"
                tone="blue"
              />
            </div>
          </div>
        </section>

        {/* Transport Section */}
        {visibility.transport && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Transport</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bus route and driver details for your child
                </p>
              </div>
              <button
                onClick={() => navigate("/parent/transport")}
                className="shrink-0 text-sm font-bold text-slate-500 transition hover:text-slate-900"
              >
                View Details
              </button>
            </div>
            {!data.transport?.assigned ? (
              <EmptyState message="No transport route assigned yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <TransportCard
                  label="Route"
                  value={data.transport?.data?.route?.name || "—"}
                  sub={`Stops: ${data.transport?.data?.route?.stops ?? "—"}`}
                  icon={<FiTruck />}
                  tone="sky"
                />
                <TransportCard
                  label="Bus"
                  value={data.transport?.data?.bus?.busId || "—"}
                  sub={`Reg: ${data.transport?.data?.bus?.regNo || "—"}`}
                  icon={<FaBus />}
                  tone="blue"
                />
                <TransportCard
                  label="Driver"
                  value={data.transport?.data?.driver?.name || "—"}
                  sub={data.transport?.data?.driver?.phone || "—"}
                  icon={<FaUserGraduate />}
                  tone="emerald"
                />
              </div>
            )}
          </section>
        )}

        {/* Assignments + Library */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {visibility.assignments && (
            <SectionCard
              title="Assignments"
              subtitle="Latest assignments from your child's teachers"
              action={{ label: "View All", to: "/parent/assignments" }}
              onAction={() => navigate("/parent/assignments")}
            >
              {recentAssignments.length === 0 ? (
                <EmptyState message="No assignments found." />
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((a) => {
                    const isOverdue =
                      !a.submitted && new Date(a.dueDate) < new Date();
                    const badgeTone = a.submitted
                      ? "emerald"
                      : isOverdue
                        ? "red"
                        : "amber";
                    const badgeLabel = a.submitted
                      ? "Submitted"
                      : isOverdue
                        ? "Overdue"
                        : "Pending";
                    return (
                      <div
                        key={a._id}
                        onClick={() => navigate(`/parent/assignments/${a._id}`)}
                        className="group flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {a.title}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${badgeTones[badgeTone]}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{a.subjectId?.name || "—"}</span>
                            <span>·</span>
                            <span className="capitalize">{a.type}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs text-slate-400">
                            Due {formatShortDate(a.dueDate)}
                          </span>
                          <FiArrowRight className="text-slate-300 group-hover:text-slate-600 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {visibility.library && (
            <SectionCard
              title="Library Books"
              subtitle="Currently issued books and fine status"
              action={{ label: "View All", to: "/parent/library" }}
              onAction={() => navigate("/parent/library")}
            >
              {recentIssues.length === 0 ? (
                <EmptyState message="No books currently issued." />
              ) : (
                <div className="space-y-3">
                  {recentIssues.map((issue) => (
                    <LibraryRow key={issue._id} issue={issue} />
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniMetric
                  label="Issued"
                  value={metrics.activeBooks}
                  tone="blue"
                />
                <MiniMetric
                  label="Overdue"
                  value={metrics.overdueBooks}
                  tone="red"
                />
                <MiniMetric
                  label="Fine (₹)"
                  value={metrics.totalFine}
                  tone="amber"
                />
              </div>
            </SectionCard>
          )}
        </div>

        {/* Fees + Quick Actions */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {visibility.fees && (
            <SectionCard
              title="Fee Summary"
              subtitle="Payment status and dues breakdown"
              action={{ label: "Pay / View Details", to: "/parent/fees" }}
              onAction={() => navigate("/parent/fees")}
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      Total Fee
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{(data.fees?.finalFee ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          data.fees?.finalFee
                            ? Math.min(
                                100,
                                ((data.fees?.totalPaid ?? 0) /
                                  data.fees.finalFee) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>
                      Paid: ₹{(data.fees?.totalPaid ?? 0).toLocaleString()}
                    </span>
                    <span>
                      Due: ₹{(data.fees?.totalDue ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric
                    label="Paid"
                    value={`₹${(data.fees?.totalPaid ?? 0).toLocaleString()}`}
                    tone="emerald"
                  />
                  <MiniMetric
                    label="Due"
                    value={`₹${(data.fees?.totalDue ?? 0).toLocaleString()}`}
                    tone={metrics.totalDue > 0 ? "red" : "emerald"}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Quick Actions"
            subtitle="Fast entry points for everyday parent tasks"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex rounded-2xl p-3 text-lg ${iconTones[item.tone]}`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.helper}
                      </p>
                    </div>
                    <FiArrowRight className="mt-1 text-slate-300 transition group-hover:text-slate-700" />
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Groups + Notices/Events */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {visibility.groups && (
            <SectionCard
              title="My Groups"
              subtitle="Class, section, and subject communication groups"
              action={{ label: "Open Messages", to: "/parent/group" }}
              onAction={() => navigate("/parent/group")}
            >
              {data.groups.length === 0 ? (
                <EmptyState message="No groups yet." />
              ) : (
                <div className="space-y-3">
                  {data.groups.slice(0, 5).map((g) => (
                    <div
                      key={g._id}
                      onClick={() => navigate("/parent/group")}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:border-slate-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                          <FiMessageSquare size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {g.name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {g.type} · {g.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <FiArrowRight className="shrink-0 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {visibility.notices && (
            <SectionCard
              title="School Updates"
              subtitle="Latest notices and upcoming events from school"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <MiniPanel
                  title="Notices"
                  tone="blue"
                  actionLabel="Open"
                  onAction={() => navigate("/parent/notice")}
                  emptyMessage="No notices yet."
                >
                  {latestNotices.map((n) => (
                    <TimelineRow
                      key={n._id}
                      title={n.title}
                      meta={`${n.audience} · ${n.priority}`}
                      date={formatShortDate(n.publishDate)}
                    />
                  ))}
                </MiniPanel>
                <MiniPanel
                  title="Events"
                  tone="amber"
                  actionLabel="Open"
                  onAction={() => navigate("/parent/event")}
                  emptyMessage="No upcoming events."
                >
                  {upcomingEventsList.map((e) => (
                    <TimelineRow
                      key={e._id}
                      title={e.title}
                      meta={`${e.location || "Campus"}`}
                      date={formatShortDate(e.startDate)}
                    />
                  ))}
                </MiniPanel>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Diary */}
        {visibility.diary && (
          <SectionCard
            title="Class Diary"
            subtitle="Recent homework and classwork entries from teachers"
            action={{ label: "View All", to: "/parent/diary" }}
            onAction={() => navigate("/parent/diary")}
          >
            {data.diary?.length === 0 ? (
              <EmptyState message="No diary entries found." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(data.diary || []).slice(0, 6).map((d) => (
                  <DiaryRow key={d._id} diary={d} />
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const DashboardSettingsControl = ({ visibility, onToggle, onReset }) => {
  const controls = [
    ["transport", "Transport"],
    ["fees", "Fees"],
    ["attendance", "Attendance"],
    ["assignments", "Assignments"],
    ["library", "Library"],
    ["diary", "Diary"],
    ["notices", "Notices"],
    ["groups", "Groups"],
  ];
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900">
            Dashboard Content Control
          </h2>
          <p className="text-sm text-slate-500">
            Toggle which sections are visible.
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Reset Defaults
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {controls.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              visibility[key]
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span className="text-sm font-bold">{label}</span>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${
                visibility[key]
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {visibility[key] ? "On" : "Off"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SectionCard = ({ title, subtitle, children, action, onAction }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="shrink-0 text-sm font-bold text-slate-500 transition hover:text-slate-900 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
    {children}
  </section>
);

const StatCard = ({ title, value, note, icon, tone }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`rounded-2xl p-3 text-xl ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
};

const HighlightCard = ({ label, value, subtext }) => (
  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
      {label}
    </p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    <p className="mt-2 text-sm text-slate-300">{subtext}</p>
  </div>
);

const AlertRow = ({ label, value, helper, tone }) => {
  const tones = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}
      >
        {value}
      </span>
    </div>
  );
};

const TransportCard = ({ label, value, sub, icon, tone }) => (
  <div
    className={`rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center gap-4`}
  >
    <div className={`rounded-2xl p-3 text-xl ${iconTones[tone]}`}>{icon}</div>
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  </div>
);

const LibraryRow = ({ issue }) => {
  const statusColors = {
    Issued: "bg-blue-50 text-blue-700",
    Overdue: "bg-red-50 text-red-700",
    Returned: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">
          {issue.bookId?.title || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {issue.bookId?.author || "—"} · Due {formatShortDate(issue.dueDate)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColors[issue.status] || "bg-slate-100 text-slate-600"}`}
      >
        {issue.status}
      </span>
    </div>
  );
};

const DiaryRow = ({ diary }) => {
  const typeColors = {
    homework: "bg-blue-50 text-blue-700",
    classwork: "bg-emerald-50 text-emerald-700",
    remark: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">
          {diary.content?.slice(0, 60)}
          {diary.content?.length > 60 ? "..." : ""}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {diary.subjectId?.name || "—"} ·{" "}
          {formatShortDate(diary.date || diary.createdAt)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${typeColors[diary.type] || "bg-slate-100 text-slate-600"}`}
      >
        {diary.type}
      </span>
    </div>
  );
};

const MiniMetric = ({ label, value, tone }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-2xl p-3 text-center ${tones[tone]}`}>
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold">{label}</p>
    </div>
  );
};

const MiniPanel = ({
  title,
  tone,
  actionLabel,
  onAction,
  children,
  emptyMessage,
}) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : !!children;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2 ${tones[tone]}`}>
            {title.includes("Notice") ? (
              <FiBell size={14} />
            ) : (
              <FiCalendar size={14} />
            )}
          </div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onAction}
          className="text-xs font-bold text-slate-500 transition hover:text-slate-900"
        >
          {actionLabel}
        </button>
      </div>
      <div className="space-y-2">
        {hasChildren ? (
          children
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-medium text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineRow = ({ title, meta, date }) => (
  <div className="rounded-xl bg-white p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
        <FiClock size={10} />
        {date}
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
    {message}
  </div>
);

export default ParentDashboard;
