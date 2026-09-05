import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  Compass,
  Dumbbell,
  Flame,
  Info,
  LayoutDashboard,
  Layers3,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogOut,
  CreditCard,
  Menu,
  Moon,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  TrendingUp,
  Trophy,
  Sun,
  UploadCloud,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Study Atelier design reminder for this page:
 * Deep ink navy, paper-sand surfaces, Signal Coral actions, editorial hierarchy,
 * and a left-weighted study-desk composition. Progress should feel visible,
 * warm, and useful — never noisy or generic.
 */

type View =
  | "dashboard"
  | "practice"
  | "progress"
  | "profile"
  | "premium"
  | "exams"
  | "admin";
type PracticeStep = "setup" | "question" | "complete";

type NavItem = {
  label: string;
  view: View;
  icon: LucideIcon;
};

type Question = {
  id?: number;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: string;
  subject?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Practice", view: "practice", icon: Dumbbell },
  { label: "Progress", view: "progress", icon: TrendingUp },
  { label: "Profile", view: "profile", icon: UserRound },
];

const topics = [
  {
    name: "Quadratic equations",
    subject: "Mathematics",
    progress: 51,
    tone: "coral",
    meta: "Needs attention",
  },
  {
    name: "Trigonometry",
    subject: "Mathematics",
    progress: 63,
    tone: "gold",
    meta: "Keep building",
  },
  {
    name: "Organic chemistry",
    subject: "Chemistry",
    progress: 74,
    tone: "sage",
    meta: "On track",
  },
  {
    name: "Reading comprehension",
    subject: "English Language",
    progress: 82,
    tone: "navy",
    meta: "Strong area",
  },
];

const questions: Question[] = [
  {
    topic: "Quadratic equations",
    prompt: "If x² − 5x + 6 = 0, which pair gives the roots of the equation?",
    options: [
      "x = 1 or x = 6",
      "x = 2 or x = 3",
      "x = −2 or x = −3",
      "x = 0 or x = 5",
    ],
    answer: 1,
    explanation:
      "Factor the expression as (x − 2)(x − 3) = 0, so the roots are 2 and 3.",
    difficulty: "medium",
  },
  {
    topic: "Quadratic equations",
    prompt: "What is the value of the discriminant for 2x² + 3x − 2 = 0?",
    options: ["−7", "1", "25", "41"],
    answer: 2,
    explanation:
      "For ax² + bx + c, the discriminant is b² − 4ac = 3² − 4(2)(−2) = 25.",
    difficulty: "medium",
  },
  {
    topic: "Quadratic equations",
    prompt:
      "A quadratic graph crosses the x-axis twice when its discriminant is…",
    options: [
      "greater than zero",
      "equal to zero",
      "less than zero",
      "equal to one",
    ],
    answer: 0,
    explanation:
      "A positive discriminant means the equation has two distinct real roots, so the graph crosses the x-axis twice.",
    difficulty: "medium",
  },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-NG").format(value);

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const [hasExplicitSignIn, setHasExplicitSignIn] = useState(() => {
    try {
      return sessionStorage.getItem("studyforge-explicit-session") === "1";
    } catch {
      return false;
    }
  });
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.demoLogin.useMutation({
    onSuccess: async () => {
      setHasExplicitSignIn(true);
      try {
        sessionStorage.setItem("studyforge-explicit-session", "1");
      } catch {}
      await utils.auth.me.invalidate();
      toast("Signed in. Your study desk is ready.");
    },
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginError, setLoginError] = useState("");
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setHasExplicitSignIn(true);
      try {
        sessionStorage.setItem("studyforge-explicit-session", "1");
      } catch {}
      await utils.auth.me.invalidate();
      toast("Account created. Your study desk is ready.");
    },
  });
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [practiceStep, setPracticeStep] = useState<PracticeStep>("setup");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [activeTopic, setActiveTopic] = useState("Quadratic equations");
  const [practiceSessionId, setPracticeSessionId] = useState<number | null>(
    null
  );
  const [practiceMode, setPracticeMode] = useState<"practice" | "exam">(
    "practice"
  );
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<
    number | undefined
  >();
  const [selectedSubjectName, setSelectedSubjectName] =
    useState("All WAEC subjects");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard" | undefined
  >();
  const isSignedIn = Boolean(user && hasExplicitSignIn);
  const subjectInput = useMemo(() => ({ examCode: "WAEC" }), []);
  const subjectQuery = trpc.content.subjects.useQuery(subjectInput, {
    enabled: isSignedIn,
  });
  const questionInput = useMemo(
    () => ({
      limit: 20,
      examId: practiceMode === "exam" ? (activeExamId ?? undefined) : undefined,
      subjectId: practiceMode === "practice" ? selectedSubjectId : undefined,
      difficulty: practiceMode === "practice" ? selectedDifficulty : undefined,
    }),
    [practiceMode, activeExamId, selectedSubjectId, selectedDifficulty]
  );
  const questionQuery = trpc.content.questions.useQuery(questionInput, {
    enabled: isSignedIn,
  });
  const startSessionMutation = trpc.practice.start.useMutation();
  const submitAttemptMutation = trpc.practice.submit.useMutation();
  const completeSessionMutation = trpc.practice.complete.useMutation();
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const analyticsQuery = trpc.progress.analytics.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const history30Query = trpc.progress.history30.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const hasQuestionFilter = Boolean(selectedSubjectId || selectedDifficulty);
  const practiceQuestions: Question[] = questionQuery.data?.length
    ? questionQuery.data.map(item => ({
        id: item.id,
        topic: item.topic,
        subject: item.subject,
        prompt: item.prompt,
        options: item.options,
        answer: item.answerIndex,
        explanation: item.explanation ?? "",
        difficulty: item.difficulty,
      }))
    : hasQuestionFilter
      ? []
      : questions;

  const handleMockLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authMode === "register" && loginName.trim().length < 2) {
      setLoginError("Enter your name to create an account.");
      return;
    }
    if (!loginEmail.includes("@") || loginPassword.length < 6) {
      setLoginError(
        "Use a valid email and a password with at least 6 characters."
      );
      return;
    }
    setLoginError("");
    if (authMode === "register")
      registerMutation.mutate({
        name: loginName.trim(),
        email: loginEmail.trim(),
        password: loginPassword,
      });
    else
      loginMutation.mutate({
        email: loginEmail.trim(),
        password: loginPassword,
      });
  };

  const handleMockLogout = async () => {
    await logout();
    setHasExplicitSignIn(false);
    try {
      sessionStorage.removeItem("studyforge-explicit-session");
    } catch {}
    setActiveView("dashboard");
    toast("You have been signed out of the demo account.");
  };

  const currentQuestion =
    practiceQuestions[
      practiceQuestions.length ? questionIndex % practiceQuestions.length : 0
    ] ?? questions[0]!;
  const progressPercent = Math.round(
    (answeredCount / Math.max(practiceQuestions.length, 1)) * 100
  );
  const practiceAccuracy =
    answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const navigate = (view: View) => {
    setActiveView(view);
    setMobileNavOpen(false);
    if (view !== "practice") setPracticeStep("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (
      practiceMode !== "exam" ||
      practiceStep !== "question" ||
      timeRemaining <= 0
    )
      return;
    const timer = window.setInterval(
      () => setTimeRemaining(seconds => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [practiceMode, practiceStep, timeRemaining]);

  useEffect(() => {
    if (
      practiceMode === "exam" &&
      practiceStep === "question" &&
      timeRemaining === 0
    )
      setPracticeStep("complete");
  }, [practiceMode, practiceStep, timeRemaining]);

  const chooseSubject = (value: string) => {
    if (!value) {
      setSelectedSubjectId(undefined);
      setSelectedSubjectName("All WAEC subjects");
      setActiveTopic("Mixed WAEC practice");
      return;
    }
    const subject = subjectQuery.data?.find(item => String(item.id) === value);
    setSelectedSubjectId(subject?.id);
    setSelectedSubjectName(subject?.name ?? "All WAEC subjects");
    setActiveTopic(subject?.name ?? "Mixed WAEC practice");
    setQuestionIndex(0);
  };

  const startPractice = (topic = activeTopic) => {
    if (!practiceQuestions.length) {
      toast(
        "No questions match these filters yet. Try another subject or difficulty."
      );
      return;
    }
    setPracticeMode("practice");
    setTimeRemaining(0);
    setActiveTopic(topic);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnsweredCount(0);
    setCorrectCount(0);
    setPracticeSessionId(null);
    setActiveView("practice");
    setMobileNavOpen(false);
    startSessionMutation.mutate(
      { mode: "practice", topicId: null },
      {
        onSuccess: sessionId => {
          setPracticeSessionId(sessionId);
          setPracticeStep("question");
        },
        onError: () => {
          setPracticeStep("question");
          toast("Practice is in preview mode while the session syncs.");
        },
      }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startExam = (examId: number) => {
    setPracticeMode("exam");
    setActiveExamId(examId);
    setTimeRemaining(45 * 60);
    setActiveTopic("WAEC Complete Simulation");
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnsweredCount(0);
    setCorrectCount(0);
    setPracticeSessionId(null);
    setActiveView("practice");
    setMobileNavOpen(false);
    startSessionMutation.mutate(
      { mode: "exam", examCode: "WAEC_FULL", topicId: null },
      {
        onSuccess: sessionId => {
          setPracticeSessionId(sessionId);
          setPracticeStep("question");
        },
        onError: () => {
          setPracticeStep("question");
          toast("Exam mode is running in preview while the session syncs.");
        },
      }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setAnsweredCount(count => count + 1);
    const isCorrect = index === currentQuestion.answer;
    if (isCorrect) setCorrectCount(count => count + 1);
    if (practiceSessionId && currentQuestion.id)
      submitAttemptMutation.mutate({
        sessionId: practiceSessionId,
        questionId: currentQuestion.id,
        selectedIndex: index,
      });
  };

  const nextQuestion = () => {
    if (questionIndex === practiceQuestions.length - 1) {
      if (practiceSessionId)
        completeSessionMutation.mutate({
          sessionId: practiceSessionId,
          score: correctCount,
          total: answeredCount,
        });
      setPracticeStep("complete");
      return;
    }
    setQuestionIndex(index => index + 1);
    setSelectedAnswer(null);
  };

  const handlePlaceholder = (label: string) => {
    toast(`${label} is being prepared for the next StudyForge release.`);
  };

  if (loading)
    return (
      <LoginPage
        mode={authMode}
        setMode={setAuthMode}
        theme={theme}
        toggleTheme={toggleTheme}
        name={loginName}
        email={loginEmail}
        password={loginPassword}
        error={
          loginError ||
          (authMode === "register"
            ? registerMutation.error?.message
            : loginMutation.error?.message) ||
          ""
        }
        pending={loginMutation.isPending || registerMutation.isPending}
        setName={setLoginName}
        setEmail={setLoginEmail}
        setPassword={setLoginPassword}
        onSubmit={handleMockLogin}
      />
    );
  if (!user || !hasExplicitSignIn) {
    return (
      <LoginPage
        mode={authMode}
        setMode={setAuthMode}
        theme={theme}
        toggleTheme={toggleTheme}
        name={loginName}
        email={loginEmail}
        password={loginPassword}
        error={
          loginError ||
          (authMode === "register"
            ? registerMutation.error?.message
            : loginMutation.error?.message) ||
          ""
        }
        pending={loginMutation.isPending || registerMutation.isPending}
        setName={setLoginName}
        setEmail={setLoginEmail}
        setPassword={setLoginPassword}
        onSubmit={handleMockLogin}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-inner">
          <div className="brand-lockup">
            <div
              className="brand-mark brand-mark-image"
              style={{
                backgroundImage:
                  "url(/manus-storage/studyforge-mark_aa7cf0a5.png)",
              }}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <div className="brand-name">StudyForge</div>
              <div className="brand-caption">Your practice desk</div>
            </div>
            <button
              className="icon-button mobile-close"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rail-label">Workspace</div>
          <nav className="primary-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  className={`nav-item ${activeView === item.view ? "active" : ""}`}
                  onClick={() => navigate(item.view)}
                  aria-current={activeView === item.view ? "page" : undefined}
                >
                  <Icon
                    size={18}
                    strokeWidth={activeView === item.view ? 2.4 : 1.8}
                  />
                  {activeView === item.view && (
                    <span className="woven-nav-mark" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                  {item.view === "practice" && (
                    <span
                      className="nav-pulse"
                      aria-label="Recommended practice"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="rail-divider" />
          <div className="rail-label">Explore</div>
          <div className="secondary-nav">
            <button className="nav-item" onClick={() => navigate("exams")}>
              <Compass size={18} strokeWidth={1.8} />
              <span>Exam library</span>
              <LockKeyhole size={13} className="muted-icon" />
            </button>
            <button
              className="nav-item"
              onClick={() => handlePlaceholder("Saved questions")}
            >
              <BookOpen size={18} strokeWidth={1.8} />
              <span>Saved questions</span>
              <LockKeyhole size={13} className="muted-icon" />
            </button>
            {user.role === "admin" && (
              <button
                className={`nav-item ${activeView === "admin" ? "active" : ""}`}
                onClick={() => navigate("admin")}
                aria-current={activeView === "admin" ? "page" : undefined}
              >
                <Layers3
                  size={18}
                  strokeWidth={activeView === "admin" ? 2.4 : 1.8}
                />
                {activeView === "admin" && (
                  <span className="woven-nav-mark" aria-hidden="true" />
                )}
                <span>Content desk</span>
                <ShieldCheck size={13} className="muted-icon" />
              </button>
            )}
          </div>

          <div className="sidebar-spacer" />
          <div className="sidebar-note">
            <div className="note-kicker">
              <Sparkles size={13} /> Tiny reminder
            </div>
            <p>
              Consistency compounds. One focused session is enough for today.
            </p>
          </div>
          <button className="profile-chip" onClick={() => navigate("profile")}>
            <span className="avatar">
              {(user?.name || user?.email || "SF")
                .split(/\s+/)
                .map((part: string) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span className="profile-chip-copy">
              <strong>{user?.name || "StudyForge learner"}</strong>
              <small>
                {user?.role === "admin" ? "Content editor" : "Free learner"}
              </small>
            </span>
            <ChevronRight size={16} className="muted-icon" />
          </button>
          <button className="rail-logout" onClick={handleMockLogout}>
            <LogOut size={14} /> Sign out demo
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>StudyForge</span>
            <ChevronRight size={14} />
            <strong>
              {activeView === "exams"
                ? "Exam library"
                : activeView === "premium"
                  ? "StudyForge Plus"
                  : activeView === "admin"
                    ? "Content desk"
                    : navItems.find(item => item.view === activeView)?.label}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === "light" ? "Night" : "Day"}</span>
            </button>
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Search StudyForge"
                placeholder="Search topics, subjects…"
              />
              <kbd>⌘ K</kbd>
            </div>
            <div className="notification-wrap">
              <button
                className="icon-button"
                onClick={() => setShowNotifications(open => !open)}
                aria-label="Show notifications"
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>
              {showNotifications && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <strong>Desk notes</strong>
                    <span>
                      {notificationsQuery.data?.filter(item => !item.readAt)
                        .length ?? 0}{" "}
                      new
                    </span>
                  </div>
                  {notificationsQuery.data?.length ? (
                    notificationsQuery.data.slice(0, 3).map(note => (
                      <p key={note.id}>
                        <Flame size={14} /> {note.title}: {note.body}
                      </p>
                    ))
                  ) : (
                    <p>
                      <Target size={14} /> Complete a session to unlock your
                      first streak note.
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              className="topbar-avatar"
              onClick={() => navigate("profile")}
              aria-label="Open profile"
            >
              {(user.name || user.email || "SF")
                .split(/\s+/)
                .map((part: string) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </button>
          </div>
        </header>

        <div className="page-canvas">
          {activeView === "dashboard" && (
            <DashboardView
              greeting={greeting}
              learnerName={user.name || "StudyForge learner"}
              analytics={analyticsQuery.data}
              history30={history30Query.data ?? []}
              startPractice={startPractice}
              navigate={navigate}
              handlePlaceholder={handlePlaceholder}
            />
          )}
          {activeView === "practice" && (
            <PracticeView
              step={practiceStep}
              currentQuestion={currentQuestion}
              questionCount={practiceQuestions.length}
              mode={practiceMode}
              timeRemaining={timeRemaining}
              questionIndex={questionIndex}
              selectedAnswer={selectedAnswer}
              progressPercent={progressPercent}
              practiceAccuracy={practiceAccuracy}
              activeTopic={activeTopic}
              subjectOptions={subjectQuery.data ?? []}
              selectedSubjectName={selectedSubjectName}
              selectedSubjectId={selectedSubjectId}
              selectedDifficulty={selectedDifficulty}
              questionLoading={
                questionQuery.isLoading || questionQuery.isFetching
              }
              onSubjectChange={chooseSubject}
              onDifficultyChange={(value: "easy" | "medium" | "hard" | "") => {
                setSelectedDifficulty(value || undefined);
                setQuestionIndex(0);
              }}
              answeredCount={answeredCount}
              correctCount={correctCount}
              chooseAnswer={chooseAnswer}
              nextQuestion={nextQuestion}
              startPractice={startPractice}
              handlePlaceholder={handlePlaceholder}
            />
          )}
          {activeView === "progress" && (
            <ProgressView startPractice={startPractice} />
          )}
          {activeView === "profile" && (
            <ProfileView
              navigate={navigate}
              handlePlaceholder={handlePlaceholder}
            />
          )}
          {activeView === "premium" && <PremiumView />}
          {activeView === "exams" && (
            <ExamLibraryView navigate={navigate} startExam={startExam} />
          )}
          {activeView === "admin" && user.role === "admin" && <AdminView />}
          {activeView === "admin" && user.role !== "admin" && (
            <AccessDeniedView navigate={navigate} />
          )}
        </div>
      </main>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function DashboardView({
  greeting,
  learnerName,
  analytics,
  history30,
  startPractice,
  navigate,
  handlePlaceholder,
}: {
  greeting: string;
  learnerName: string;
  analytics?: {
    accuracy: number;
    attempts: number;
    activeDays: number;
    completedSessions: number;
    averageMinutes: number;
    subjects: Array<{ subject: string; attempts: number; accuracy: number }>;
  };
  history30: Array<{
    day: string;
    label: string;
    questions: number;
    score: number;
    active: boolean;
  }>;
  startPractice: (topic?: string) => void;
  navigate: (view: View) => void;
  handlePlaceholder: (label: string) => void;
}) {
  const hasStudyActivity = (analytics?.attempts ?? 0) > 0;
  return (
    <div className="view-stack animate-in">
      <section className="welcome-hero">
        <div className="hero-copy">
          <div className="eyebrow eyebrow-light">
            Monday, 18 August 2026 <span className="eyebrow-rule" />
          </div>
          <h1>
            {greeting}, {learnerName}.
          </h1>
          <p>
            Pick up where your thinking left off. A focused 20 minutes can move
            the whole week forward.
          </p>
          <div className="hero-actions">
            <button
              className="button button-coral"
              onClick={() => startPractice("Quadratic equations")}
            >
              <Play size={16} fill="currentColor" /> Continue practice
            </button>
            <button
              className="button button-quiet-light"
              onClick={() => navigate("progress")}
            >
              View your progress <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero-art-wrap">
          <img
            src="/manus-storage/studyforge-hero-editorial_388cc0e1.png"
            alt="Open exercise book and pencil arranged on a study desk"
            className="hero-art"
          />
          <div className="hero-stamp">
            <span>{analytics?.activeDays ?? 0}</span>
            <small>active days</small>
          </div>
        </div>
        <div className="hero-footnote">
          <span className="woven-mini" /> Your next best topic is waiting in
          Practice
        </div>
      </section>

      <section className="metrics-row" aria-label="Your study metrics">
        <MetricCard
          label="Overall score"
          value={`${analytics?.accuracy ?? 0}%`}
          detail={`${analytics?.completedSessions ?? 0} completed sessions`}
          tone="coral"
          icon={Target}
        />
        <MetricCard
          label="Questions answered"
          value={formatNumber(analytics?.attempts ?? 0)}
          detail={`${analytics?.averageMinutes ?? 0} min average session`}
          tone="navy"
          icon={ListChecks}
        />
        <MetricCard
          label="Accuracy"
          value={`${analytics?.accuracy ?? 0}%`}
          detail={`Across ${analytics?.subjects?.length ?? 0} subjects`}
          tone="sage"
          icon={CircleCheck}
        />
        <MetricCard
          label="Study streak"
          value={`${analytics?.activeDays ?? 0} days`}
          detail="Distinct active days"
          tone="gold"
          icon={Flame}
        />
      </section>

      <section className="panel streak-chart-panel">
        <div className="chart-header">
          <div>
            <div className="mini-label">Last 30 days</div>
            <h2>Your study rhythm, at a glance.</h2>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-score" /> Accuracy
            </span>
            <span>
              <i className="legend-questions" /> Questions
            </span>
          </div>
        </div>
        <div className="performance-chart streak-chart">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={history30}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="streakFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F26A5B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F26A5B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#ded4c5"
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="label"
                interval={4}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6f7f88", fontSize: 9 }}
              />
              <YAxis
                yAxisId="score"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6f7f88", fontSize: 9 }}
                tickFormatter={value => `${value}%`}
              />
              <YAxis
                yAxisId="questions"
                orientation="right"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6f7f88", fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#132A3A",
                  border: 0,
                  borderRadius: 5,
                  color: "#fffdf9",
                  fontSize: 10,
                }}
                formatter={(value, name) => [
                  name === "score" ? `${value}%` : value,
                  name === "score" ? "Accuracy" : "Questions",
                ]}
              />
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="score"
                stroke="#F26A5B"
                strokeWidth={3}
                fill="url(#streakFill)"
              />
              <Line
                yAxisId="questions"
                type="monotone"
                dataKey="questions"
                stroke="#78927F"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="streak-chart-summary">
          <span>
            <strong>{analytics?.activeDays ?? 0}</strong> active days
          </span>
          <span>
            <strong>{analytics?.attempts ?? 0}</strong> questions answered
          </span>
          <span>
            <strong>{analytics?.completedSessions ?? 0}</strong> sessions
            completed
          </span>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel continue-panel">
          <PanelHeader
            eyebrow="Continue learning"
            title="Your study desk"
            action={
              <button
                className="text-button"
                onClick={() => navigate("practice")}
              >
                Open practice <ChevronRight size={15} />
              </button>
            }
          />
          {hasStudyActivity ? (
            <>
              <div className="continue-card">
                <div className="subject-mark math-mark">∑</div>
                <div className="continue-copy">
                  <span className="mini-label">Mathematics · Algebra</span>
                  <h3>Quadratic equations</h3>
                  <p>
                    Recent study signal <span className="dot-separator" />{" "}
                    Continue your set
                  </p>
                </div>
                <div className="continue-progress">
                  <div className="progress-meta">
                    <span>From your attempts</span>
                    <strong>Keep building</strong>
                  </div>
                  <ProgressBar value={analytics?.accuracy ?? 0} tone="coral" />
                  <button
                    className="small-arrow"
                    onClick={() => startPractice("Quadratic equations")}
                    aria-label="Practice quadratic equations"
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>
              <div className="continue-card muted-card">
                <div className="subject-mark chem-mark">○</div>
                <div className="continue-copy">
                  <span className="mini-label">Choose another subject</span>
                  <h3>Explore the WAEC bank</h3>
                  <p>Browse all available subjects and difficulty levels</p>
                </div>
                <div className="continue-progress">
                  <div className="progress-meta">
                    <span>
                      {analytics?.subjects?.length ?? 0} subjects studied
                    </span>
                    <strong className="text-sage">Open practice</strong>
                  </div>
                  <ProgressBar
                    value={Math.min(
                      100,
                      (analytics?.subjects?.length ?? 0) * 10
                    )}
                    tone="sage"
                  />
                  <button
                    className="small-arrow"
                    onClick={() => navigate("practice")}
                    aria-label="Browse subjects"
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state dashboard-empty-state">
              <Target size={24} />
              <p>
                Your study desk is ready. Choose a WAEC subject and start your
                first question set to build your progress history.
              </p>
              <button
                className="button button-ink"
                onClick={() => navigate("practice")}
              >
                Choose a subject <ArrowUpRight size={15} />
              </button>
            </div>
          )}
        </section>

        <aside className="panel goal-panel desk-note-panel">
          <div className="desk-note-banner">
            <span className="woven-note" aria-hidden="true" />
            <span>Desk note #02</span>
            <i />
          </div>
          <PanelHeader eyebrow="One useful ritual" title="Make it count" />
          <div className="goal-orbit">
            <div className="orbit-track" />
            <div className="orbit-value">
              <strong>
                {hasStudyActivity ? Math.min(20, analytics?.attempts ?? 0) : 0}
              </strong>
              <span>of 20</span>
            </div>
            <div className="orbit-cap">questions</div>
          </div>
          <p className="goal-message">
            {hasStudyActivity
              ? "Keep the daily goal small and protect your rhythm."
              : "Your first 20-question goal starts when you choose a subject."}
          </p>
          <button
            className="button button-ink button-full"
            onClick={() => navigate("practice")}
          >
            {hasStudyActivity ? "Continue today’s goal" : "Choose a subject"}{" "}
            <ArrowUpRight size={16} />
          </button>
          <div className="goal-footer">
            <span>
              <Flame size={14} /> {analytics?.activeDays ?? 0} active days
            </span>
            <span className="gold-dot" /> <span>0 XP until you begin</span>
          </div>
        </aside>
      </div>

      <section className="insight-banner">
        <div className="insight-icon">
          <BrainCircuit size={22} />
        </div>
        <div className="insight-copy">
          <div className="mini-label">Your learning signal</div>
          <h3>
            {hasStudyActivity
              ? "Your next set will adapt to your attempts."
              : "Your first signal starts with one question."}
          </h3>
          <p>
            {hasStudyActivity
              ? "Keep practicing and StudyForge will surface the subjects and difficulty levels that deserve your attention."
              : "Choose any WAEC subject and difficulty in Practice. Your accuracy, active days, and streak history will begin at zero until you study."}
          </p>
        </div>
        <button
          className="button button-coral"
          onClick={() => navigate("practice")}
        >
          {hasStudyActivity ? "Tune your next set" : "Choose a subject"}{" "}
          <ArrowUpRight size={16} />
        </button>
      </section>

      <section className="lower-grid">
        <div className="panel recommendation-panel">
          <PanelHeader
            eyebrow="Recommended for you"
            title="A better next question"
            action={
              <button
                className="icon-button subtle"
                onClick={() => handlePlaceholder("Recommendation refresh")}
                aria-label="Refresh recommendation"
              >
                <RotateCcw size={16} />
              </button>
            }
          />
          <div className="recommendation-card">
            <div
              className="recommendation-art"
              aria-label="Layered study cards representing progress"
            >
              <div className="progress-illustration">
                <span className="progress-card progress-card-back" />
                <span className="progress-card progress-card-middle" />
                <span className="progress-card progress-card-front">
                  <i />
                  <b />
                  <em />
                </span>
                <span className="progress-pencil" />
              </div>
            </div>
            <div className="recommendation-copy">
              <span className="tag tag-coral">
                {hasStudyActivity ? "Next signal" : "Start here"}
              </span>
              <h3>
                {hasStudyActivity
                  ? "Tune your next set"
                  : "Choose your first subject"}
              </h3>
              <p>
                {hasStudyActivity
                  ? "Your next questions will respond to the attempts you have saved."
                  : "Select one of the 36 WAEC subjects, then choose a difficulty level to begin."}
              </p>
              <div className="recommendation-meta">
                <span>
                  <Clock3 size={14} /> 12 min
                </span>
                <span>
                  <Target size={14} />{" "}
                  {hasStudyActivity ? "Adaptive" : "Any level"}
                </span>
              </div>
              <button
                className="text-button coral-text"
                onClick={() => navigate("practice")}
              >
                {hasStudyActivity ? "Open next set" : "Browse subjects"}{" "}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="panel snapshot-panel">
          <PanelHeader
            eyebrow="Subject snapshot · desk index"
            title="Where you stand"
            action={
              <button
                className="text-button"
                onClick={() => navigate("progress")}
              >
                Full progress <ChevronRight size={15} />
              </button>
            }
          />
          <div className="snapshot-list">
            {analytics?.subjects?.length ? (
              analytics.subjects.slice(0, 4).map((subject, index) => (
                <div className="snapshot-row" key={subject.subject}>
                  <div
                    className={`topic-dot ${index % 2 ? "sage" : "coral"}`}
                  />
                  <div className="snapshot-name">
                    <strong>{subject.subject}</strong>
                    <span>{subject.attempts} attempts</span>
                  </div>
                  <div className="snapshot-bar">
                    <ProgressBar
                      value={subject.accuracy}
                      tone={index % 2 ? "sage" : "coral"}
                    />
                  </div>
                  <strong className="snapshot-score">
                    {subject.accuracy}%
                  </strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Target size={18} />
                <p>
                  No subject history yet. Your first completed set will appear
                  here.
                </p>
              </div>
            )}
          </div>
          <div className="snapshot-foot">
            <span>
              <span className="green-pulse" />{" "}
              {analytics?.subjects?.length ?? 0} subjects studied
            </span>
            <span>
              {analytics?.attempts ?? 0} attempts <ListChecks size={13} />
            </span>
          </div>
        </div>
      </section>

      <section className="exam-strip">
        <div
          className="exam-strip-art"
          aria-label="Exam timer and answer sheet illustration"
        >
          <div className="exam-illustration">
            <span className="exam-sheet" />
            <span className="exam-timer">
              <b>90</b>
              <small>MIN</small>
            </span>
            <span className="exam-pencil" />
          </div>
        </div>
        <div className="exam-strip-copy">
          <div className="mini-label">When you’re ready</div>
          <h2>Meet the real exam with a calmer mind.</h2>
          <p>
            Full WAEC simulations are coming soon — timed, focused, and built to
            show more than a final score.
          </p>
        </div>
        <button
          className="button button-outline-light"
          onClick={() => handlePlaceholder("Exam simulations")}
        >
          Explore exam mode <ArrowUpRight size={16} />
        </button>
      </section>
    </div>
  );
}

function PracticeView({
  step,
  currentQuestion,
  questionCount,
  mode,
  timeRemaining,
  questionIndex,
  selectedAnswer,
  progressPercent,
  practiceAccuracy,
  activeTopic,
  subjectOptions,
  selectedSubjectName,
  selectedSubjectId,
  selectedDifficulty,
  questionLoading,
  onSubjectChange,
  onDifficultyChange,
  answeredCount,
  correctCount,
  chooseAnswer,
  nextQuestion,
  startPractice,
  handlePlaceholder,
}: {
  step: PracticeStep;
  currentQuestion: Question;
  questionCount: number;
  mode: "practice" | "exam";
  timeRemaining: number;
  questionIndex: number;
  selectedAnswer: number | null;
  progressPercent: number;
  practiceAccuracy: number;
  activeTopic: string;
  subjectOptions: Array<{ id: number; name: string; slug: string }>;
  selectedSubjectName: string;
  selectedSubjectId?: number;
  selectedDifficulty?: "easy" | "medium" | "hard";
  questionLoading: boolean;
  onSubjectChange: (value: string) => void;
  onDifficultyChange: (value: "easy" | "medium" | "hard" | "") => void;
  answeredCount: number;
  correctCount: number;
  chooseAnswer: (index: number) => void;
  nextQuestion: () => void;
  startPractice: (topic?: string) => void;
  handlePlaceholder: (label: string) => void;
}) {
  if (step === "setup") {
    const selectedLabel = selectedSubjectId
      ? selectedSubjectName
      : "All WAEC subjects";
    return (
      <div className="view-stack animate-in">
        <PageIntro
          eyebrow="Practice room"
          title="Choose what to sharpen."
          description="Pick any WAEC subject, then tune the difficulty to match your confidence."
          action={
            <button
              className="button button-coral"
              onClick={() =>
                startPractice(
                  selectedSubjectId
                    ? selectedSubjectName
                    : "Mixed WAEC practice"
                )
              }
              disabled={questionLoading || !questionCount}
            >
              <Play size={16} fill="currentColor" />{" "}
              {questionLoading ? "Loading questions…" : "Start this set"}
            </button>
          }
        />
        <div className="practice-layout">
          <section className="panel practice-setup-panel">
            <div className="setup-heading">
              <div>
                <div className="mini-label">Your selection</div>
                <h2>{selectedLabel}</h2>
                <p>
                  {questionLoading
                    ? "Finding questions…"
                    : `${questionCount} questions available${selectedDifficulty ? ` · ${selectedDifficulty} difficulty` : " · all difficulty levels"}`}
                </p>
              </div>
              <span className="tag tag-coral">WAEC bank</span>
            </div>
            <div className="filter-grid">
              <label className="filter-field">
                <span>Subject</span>
                <select
                  value={selectedSubjectId ? String(selectedSubjectId) : ""}
                  onChange={event => onSubjectChange(event.target.value)}
                >
                  <option value="">All WAEC subjects</option>
                  {subjectOptions.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-field">
                <span>Difficulty</span>
                <select
                  value={selectedDifficulty ?? ""}
                  onChange={event =>
                    onDifficultyChange(
                      event.target.value as "easy" | "medium" | "hard" | ""
                    )
                  }
                >
                  <option value="">Any difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
            <div className="setup-signal">
              <div className="signal-ring">
                <Target size={22} />
              </div>
              <div>
                <strong>
                  {questionCount
                    ? `${questionCount} questions ready`
                    : "No matching questions yet"}
                </strong>
                <p>
                  {questionCount
                    ? "Your filters are ready for a focused session."
                    : "Try another subject or difficulty while the bank grows."}
                </p>
              </div>
            </div>
            <div className="setup-list">
              <div>
                <CheckCircle2 size={17} />
                <span>Immediate feedback after each answer</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>Short explanations, not just right or wrong</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>Progress added to your personal learning map</span>
              </div>
            </div>
            <button
              className="button button-ink"
              onClick={() =>
                startPractice(
                  selectedSubjectId
                    ? selectedSubjectName
                    : "Mixed WAEC practice"
                )
              }
              disabled={questionLoading || !questionCount}
            >
              {questionLoading
                ? "Loading question bank…"
                : "Begin focused practice"}{" "}
              <ArrowUpRight size={16} />
            </button>
          </section>
          <aside className="practice-topic-list">
            <div className="mini-label">Browse all subjects</div>
            {subjectOptions.length ? (
              subjectOptions.map(subject => (
                <button
                  key={subject.id}
                  className={`topic-select ${selectedSubjectId === subject.id ? "selected" : ""}`}
                  onClick={() => onSubjectChange(String(subject.id))}
                >
                  <span className="topic-dot coral" />
                  <span>
                    <strong>{subject.name}</strong>
                    <small>
                      {selectedSubjectId === subject.id
                        ? "Selected subject"
                        : "Choose this subject"}
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))
            ) : (
              <div className="empty-state">
                <Layers3 size={18} />
                <p>Loading the WAEC subject catalogue…</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="view-stack animate-in">
        <div className="completion-card">
          <div className="completion-knot">
            <Check size={32} />
          </div>
          <div className="eyebrow">Practice complete</div>
          <h1>That’s a useful session.</h1>
          <p>
            You worked through {activeTopic} with a {practiceAccuracy}%
            accuracy. The next round will use this signal to tune your practice.
          </p>
          <div className="completion-stats">
            <div>
              <strong>{practiceAccuracy}%</strong>
              <span>Accuracy</span>
            </div>
            <div>
              <strong>
                {correctCount}/{answeredCount}
              </strong>
              <span>Correct</span>
            </div>
            <div>
              <strong>+{correctCount * 10}</strong>
              <span>XP earned</span>
            </div>
          </div>
          <div className="completion-actions">
            <button
              className="button button-coral"
              onClick={() => startPractice(activeTopic)}
            >
              <RotateCcw size={16} /> Try another set
            </button>
            <button
              className="button button-ghost"
              onClick={() => handlePlaceholder("Detailed session review")}
            >
              Review answers <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAnswered = selectedAnswer !== null;
  const formattedTime = `${String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`;
  return (
    <div className="view-stack animate-in">
      <div className="practice-topline">
        <div>
          <div className="eyebrow">
            {mode === "exam" ? "Timed exam" : "Focused practice"}{" "}
            <span className="eyebrow-rule" />
          </div>
          <h1>{activeTopic}</h1>
          <p>One question at a time. Keep your thinking moving.</p>
        </div>
        {mode === "exam" && (
          <span className="exam-clock">
            <Timer size={16} /> {formattedTime}
          </span>
        )}
        <button
          className="button button-ghost"
          onClick={() => handlePlaceholder("Save question")}
        >
          <BookOpen size={16} /> Save question
        </button>
      </div>
      <div className="practice-progress-row">
        <span>
          Question {questionIndex + 1} of {questionCount}
        </span>
        <div className="practice-progress">
          <span
            style={{
              width: `${((questionIndex + (isAnswered ? 1 : 0)) / questionCount) * 100}%`,
            }}
          />
        </div>
        <span>
          {Math.round(
            ((questionIndex + (isAnswered ? 1 : 0)) / questionCount) * 100
          )}
          %
        </span>
      </div>
      <section className="question-layout">
        <div className="panel question-card">
          <div className="question-meta">
            <span className="tag tag-sand">{currentQuestion.topic}</span>
            <span>
              <SlidersHorizontal size={14} /> {currentQuestion.difficulty}
            </span>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-list">
            {currentQuestion.options.map((option, index) => {
              const status =
                selectedAnswer === null
                  ? ""
                  : index === currentQuestion.answer
                    ? "correct"
                    : index === selectedAnswer
                      ? "incorrect"
                      : "dimmed";
              return (
                <button
                  key={option}
                  className={`answer-option ${status}`}
                  onClick={() => chooseAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="answer-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {status === "correct" && <CheckCircle2 size={18} />}
                  {status === "incorrect" && <X size={18} />}
                </button>
              );
            })}
          </div>
          {isAnswered && (
            <div
              className={`feedback-box ${selectedAnswer === currentQuestion.answer ? "feedback-correct" : "feedback-incorrect"}`}
            >
              <div className="feedback-icon">
                {selectedAnswer === currentQuestion.answer ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Info size={18} />
                )}
              </div>
              <div>
                <strong>
                  {selectedAnswer === currentQuestion.answer
                    ? "Correct thinking."
                    : "Not quite this time."}
                </strong>
                <p>{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
          <div className="question-footer">
            <span>
              <Info size={14} /> Answers are saved automatically
            </span>
            {isAnswered && (
              <button className="button button-coral" onClick={nextQuestion}>
                {questionIndex === questionCount - 1
                  ? "See your result"
                  : "Next question"}{" "}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
        <aside className="panel practice-side-card">
          <div className="mini-label">Session signal</div>
          <div className="session-score">
            <strong>{practiceAccuracy}%</strong>
            <span>current accuracy</span>
          </div>
          <ProgressBar value={progressPercent} tone="coral" />
          <div className="session-detail">
            <span>
              <CheckCircle2 size={15} /> {correctCount} correct
            </span>
            <span>
              <ListChecks size={15} /> {answeredCount} answered
            </span>
          </div>
          <div className="side-rule" />
          <div className="mini-label">Keep in mind</div>
          <p className="side-quote">
            “The goal is not to remember every answer. It’s to notice the
            pattern behind it.”
          </p>
        </aside>
      </section>
    </div>
  );
}

function ProgressView({
  startPractice,
}: {
  startPractice: (topic?: string) => void;
}) {
  const history30Query = trpc.progress.history30.useQuery();
  const analytics = trpc.progress.analytics.useQuery();
  const summary = analytics.data;
  const history = history30Query.data ?? [];
  const hasActivity = (summary?.attempts ?? 0) > 0;
  const activityDays = useMemo(
    () =>
      new Set(history.filter(point => point.active).map(point => point.day)),
    [history]
  );
  return (
    <div className="view-stack animate-in">
      <PageIntro
        eyebrow="Your progress"
        title="See the shape of your learning."
        description="Strong areas, useful friction, and the next place to put your attention."
        action={
          <button
            className="button button-coral"
            onClick={() => startPractice("Mixed WAEC practice")}
          >
            <Dumbbell size={16} />{" "}
            {hasActivity ? "Practice a weak topic" : "Choose a subject"}
          </button>
        }
      />
      <section
        className="metrics-row progress-metrics"
        aria-label="Detailed progress metrics"
      >
        <MetricCard
          label="Completed sessions"
          value={formatNumber(summary?.completedSessions ?? 0)}
          detail="Finished study sessions"
          tone="coral"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Average session"
          value={`${summary?.averageMinutes ?? 0} min`}
          detail="Time spent per session"
          tone="navy"
          icon={Clock3}
        />
        <MetricCard
          label="Active days"
          value={formatNumber(summary?.activeDays ?? 0)}
          detail="Distinct study days"
          tone="gold"
          icon={Flame}
        />
      </section>
      <section className="progress-overview">
        <div className="panel progress-score-card">
          <div className="mini-label">Overall score</div>
          <div className="big-score">
            {summary?.accuracy ?? 0}
            <span>%</span>
          </div>
          <div className="score-delta">
            {hasActivity ? (
              <>
                <TrendingUp size={15} /> Live score from your saved attempts
              </>
            ) : (
              <>
                <Info size={15} /> Your score starts at zero
              </>
            )}
          </div>
          <div className="score-sparkline">
            {history.slice(-7).map(point => (
              <span
                key={point.day}
                style={{ height: `${Math.max(4, point.score)}%` }}
              />
            ))}
          </div>
          <div className="spark-labels">
            <span>{history[0]?.label ?? "30 days ago"}</span>
            <span>{history[history.length - 1]?.label ?? "Today"}</span>
          </div>
        </div>
        <div className="panel progress-surface">
          <PanelHeader eyebrow="Topic accuracy" title="Where to focus next" />
          <div className="large-topic-list">
            {summary?.subjects?.length ? (
              summary.subjects.map((subject, index) => (
                <div className="large-topic-row" key={subject.subject}>
                  <div className="large-topic-header">
                    <div>
                      <strong>{subject.subject}</strong>
                      <span>
                        {subject.attempts} attempts{" "}
                        <span className="dot-separator" />{" "}
                        {subject.accuracy >= 70
                          ? "On track"
                          : "Needs attention"}
                      </span>
                    </div>
                    <strong>{subject.accuracy}%</strong>
                  </div>
                  <ProgressBar
                    value={subject.accuracy}
                    tone={
                      index % 3 === 0
                        ? "coral"
                        : index % 3 === 1
                          ? "gold"
                          : "sage"
                    }
                  />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Target size={18} />
                <p>
                  Complete a practice set to see subject-level accuracy here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="panel performance-chart-panel">
        <div className="chart-header">
          <div>
            <div className="mini-label">Last 30 days</div>
            <h2>
              {hasActivity
                ? "Your practice rhythm is taking shape."
                : "Your practice rhythm starts here."}
            </h2>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-score" /> Score
            </span>
            <span>
              <i className="legend-questions" /> Questions
            </span>
          </div>
        </div>
        <div className="performance-chart">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={history}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F26A5B" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#F26A5B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#ded4c5"
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6f7f88", fontSize: 9 }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6f7f88", fontSize: 9 }}
                tickFormatter={value => `${value}%`}
              />
              <Tooltip
                cursor={{ stroke: "#F26A5B", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "#132A3A",
                  border: 0,
                  borderRadius: 5,
                  color: "#fffdf9",
                  fontSize: 10,
                }}
                formatter={(value, name) => [
                  name === "score" ? `${value}%` : value,
                  name === "score" ? "Score" : "Questions",
                ]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#F26A5B"
                strokeWidth={3}
                fill="url(#scoreFill)"
                activeDot={{
                  r: 5,
                  fill: "#F26A5B",
                  stroke: "#fffdf9",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="questions"
                stroke="#78927F"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="progress-bottom-grid">
        <div className="panel consistency-panel">
          <PanelHeader
            eyebrow="Study rhythm"
            title={
              hasActivity
                ? "Your study rhythm is taking shape."
                : "Your study rhythm starts here."
            }
          />
          <div
            className="heatmap"
            aria-label="Study activity over the last 30 days"
          >
            {Array.from({ length: 84 }, (_, index) => {
              const date = new Date(Date.now() - (83 - index) * 86400000);
              const day = date.toISOString().slice(0, 10);
              const active = activityDays.has(day);
              return (
                <span key={day} className={active ? "heat-3" : "heat-0"} />
              );
            })}
          </div>
          <div className="heatmap-key">
            <span>Less</span>
            <i className="heat-0" />
            <i className="heat-1" />
            <i className="heat-2" />
            <i className="heat-3" />
            <span>More</span>
          </div>
        </div>
        <div className="panel milestones-panel">
          <PanelHeader eyebrow="Milestones" title="Quiet wins add up." />
          <div className="milestone-list">
            <div className="milestone-item">
              <span className="milestone-icon coral-bg">
                <Flame size={16} />
              </span>
              <span>
                <strong>{summary?.activeDays ?? 0}-day activity</strong>
                <small>Distinct study days</small>
              </span>
              <CheckCircle2 size={17} className="check-green" />
            </div>
            <div className="milestone-item">
              <span className="milestone-icon gold-bg">
                <Trophy size={16} />
              </span>
              <span>
                <strong>{summary?.attempts ?? 0} questions</strong>
                <small>Answered in total</small>
              </span>
              <CheckCircle2 size={17} className="check-green" />
            </div>
            <div className="milestone-item locked">
              <span className="milestone-icon gray-bg">
                <Target size={16} />
              </span>
              <span>
                <strong>80% in every subject</strong>
                <small>Keep going — 2 to go</small>
              </span>
              <LockKeyhole size={16} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileView({
  navigate,
  handlePlaceholder,
}: {
  navigate: (view: View) => void;
  handlePlaceholder: (label: string) => void;
}) {
  const profile = trpc.profile.me.useQuery();
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast("Profile details saved.");
      setEditing(false);
      void profile.refetch();
    },
    onError: error => toast(error.message),
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (profile.data && !editing) {
      setName(profile.data.name ?? "");
      setEmail(profile.data.email ?? "");
    }
  }, [profile.data, editing]);
  const save = () => update.mutate({ name, email });
  return (
    <div className="view-stack animate-in">
      <PageIntro
        eyebrow="Your profile"
        title="Make the desk yours."
        description="A few details help StudyForge shape a more useful practice rhythm."
      />
      <section className="profile-layout">
        <div className="panel profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {(profile.data?.name || "SF").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="mini-label">
                {profile.data?.role === "admin"
                  ? "Content editor"
                  : "Free learner"}
              </div>
              <h2>{profile.data?.name || "StudyForge learner"}</h2>
              <p>{profile.data?.email || "Preview account"}</p>
            </div>
            <button
              className="icon-button subtle"
              onClick={() => setEditing(value => !value)}
              aria-label="Edit profile"
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
          <div className="profile-rule" />
          {editing && (
            <div className="profile-edit-form">
              <label>
                Name
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </label>
              <button
                className="button button-coral"
                onClick={save}
                disabled={update.isPending}
              >
                {update.isPending ? "Saving…" : "Save profile"}
              </button>
            </div>
          )}
          <div className="profile-fields">
            <div>
              <span className="mini-label">Current exam</span>
              <strong>WAEC</strong>
            </div>
            <div>
              <span className="mini-label">Focus subjects</span>
              <strong>Choose in Practice</strong>
            </div>
            <div>
              <span className="mini-label">Study goal</span>
              <strong>20 questions a day</strong>
            </div>
          </div>
          <button
            className="button button-ghost"
            onClick={() => handlePlaceholder("Profile settings")}
          >
            Manage profile settings <ArrowUpRight size={16} />
          </button>
        </div>
        <aside className="panel plan-card">
          <div className="mini-label">Your study plan</div>
          <h3>Steady progress, no cramming.</h3>
          <p>
            Keep the daily goal small and protect your streak. StudyForge will
            adjust your next set as your confidence changes.
          </p>
          <div className="plan-point">
            <span className="plan-number">01</span>
            <span>
              <strong>Practice</strong>
              <small>20 questions, 5 days a week</small>
            </span>
          </div>
          <div className="plan-point">
            <span className="plan-number">02</span>
            <span>
              <strong>Review</strong>
              <small>Revisit weak topics every Friday</small>
            </span>
          </div>
          <div className="plan-point">
            <span className="plan-number">03</span>
            <span>
              <strong>Simulate</strong>
              <small>Unlock full exam mode when ready</small>
            </span>
          </div>
          <button
            className="button button-ink button-full"
            onClick={() => navigate("practice")}
          >
            Go to today’s practice <ArrowUpRight size={16} />
          </button>
        </aside>
      </section>
      <section className="panel account-strip">
        <div>
          <div className="mini-label">Plan</div>
          <strong>StudyForge Free</strong>
          <p>
            Basic practice, progress snapshots, and a 20-question daily goal.
          </p>
        </div>
        <button
          className="button button-coral"
          onClick={() => navigate("premium")}
        >
          See what’s next <ArrowUpRight size={16} />
        </button>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: LucideIcon;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={17} />
      </div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className={`progress-bar ${tone}`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <div className="mini-label">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function LoginPage({
  mode,
  setMode,
  theme,
  toggleTheme,
  name,
  email,
  password,
  error,
  pending,
  setName,
  setEmail,
  setPassword,
  onSubmit,
}: {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  theme: "light" | "dark";
  toggleTheme?: () => void;
  name: string;
  email: string;
  password: string;
  error: string;
  pending: boolean;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isRegistering = mode === "register";
  return (
    <div className="login-shell">
      <div className="login-texture" />
      <button
        className="theme-toggle login-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        <span>{theme === "light" ? "Night mode" : "Day mode"}</span>
      </button>
      <section className="login-card">
        <div className="login-brand">
          <div
            className="brand-mark brand-mark-image"
            style={{
              backgroundImage:
                "url(/manus-storage/studyforge-mark_aa7cf0a5.png)",
            }}
          />
          <span>StudyForge</span>
        </div>
        <div className="eyebrow">
          {isRegistering ? "Join StudyForge" : "Welcome back"} <span className="eyebrow-rule" />
        </div>
        <h1>
          {isRegistering ? <>Build your<br />study rhythm.</> : <>Your next hour<br />starts here.</>}
        </h1>
        <p>
          {isRegistering ? "Create your free account and start building a calmer WAEC practice habit." : "Sign in to return to your study desk, pick up a weak topic, and keep your momentum warm."}
        </p>
        <form onSubmit={onSubmit} className="login-form">
          {isRegistering && (
            <label>
              Full name
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button
            className="button button-coral button-full"
            type="submit"
            disabled={pending}
          >
            {pending ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <ArrowUpRight size={16} />
            )}{" "}
            {pending ? (isRegistering ? "Creating account…" : "Opening your desk…") : (isRegistering ? "Create free account" : "Enter your practice desk")}
          </button>
        </form>
        <button
          className="button button-ghost button-full"
          type="button"
          onClick={() => setMode(isRegistering ? "login" : "register")}
          disabled={pending}
        >
          {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        <div className="login-demo-note">
          <Sparkles size={14} />
          <span>
            <strong>{isRegistering ? "Free account" : "Secure sign-in"}</strong> — your account and study progress are protected in Turso.
          </span>
        </div>
      </section>
      <aside className="login-aside">
        <div className="login-aside-kicker">StudyForge / WAEC prep</div>
        <h2>Practice with a little more intention.</h2>
        <div className="login-aside-rule" />
        <p>
          “The question after the question is always: what should I practice
          next?”
        </p>
        <div className="login-aside-footer">
          <span className="woven-mini" /> Built for focused learners in Nigeria
        </div>
      </aside>
    </div>
  );
}

function PremiumView() {
  const plansQuery = trpc.billing.plans.useQuery();
  const subscriptionQuery = trpc.billing.subscription.useQuery();
  const [selectedPlanCode, setSelectedPlanCode] = useState<
    "studyforge_plus_monthly" | "studyforge_plus_term"
  >("studyforge_plus_monthly");
  const [reference, setReference] = useState("");
  const submitPayment = trpc.billing.submitManualPayment.useMutation({
    onSuccess: async () => {
      setReference("");
      toast("Payment submitted. An admin will confirm it shortly.");
      await subscriptionQuery.refetch();
    },
    onError: error => toast(error.message),
  });
  const currentStatus = subscriptionQuery.data?.status ?? "free";
  const activePlanCode = subscriptionQuery.data?.planCode;
  return (
    <div className="view-stack animate-in">
      <PageIntro
        eyebrow="StudyForge Plus"
        title="Meet the real exam with a calmer mind."
        description="Unlock full WAEC simulations, saved questions, and a longer view of your learning."
        action={
          <span
            className={`subscription-pill ${currentStatus === "active" ? "subscription-active" : currentStatus === "pending" ? "subscription-test" : "subscription-free"}`}
          >
            <ShieldCheck size={14} />{" "}
            {currentStatus === "active"
              ? "Plus active"
              : currentStatus === "pending"
                ? "Payment pending"
                : "Free plan"}
          </span>
        }
      />
      {currentStatus === "pending" && (
        <div className="panel payment-return-banner">
          <div>
            <div className="mini-label">Manual payment submitted</div>
            <strong>Your PalmPay payment is awaiting confirmation.</strong>
            <p>
              We will activate your plan after an admin confirms the transfer.
            </p>
          </div>
        </div>
      )}
      <section className="premium-layout">
        <div className="premium-story panel">
          <div className="premium-stamp">
            <CreditCard size={18} />
          </div>
          <div className="mini-label">Built for the final stretch</div>
          <h2>Less panic. More pattern recognition.</h2>
          <p>
            Switch from scattered practice to timed, complete exam simulations
            that show where your thinking holds under pressure.
          </p>
          <div className="premium-benefits">
            <span>
              <CheckCircle2 size={15} /> Full WAEC exam mode
            </span>
            <span>
              <CheckCircle2 size={15} /> Saved questions across devices
            </span>
            <span>
              <CheckCircle2 size={15} /> Extended progress history
            </span>
          </div>
        </div>
        <div className="plan-grid">
          {plansQuery.data?.map(plan => (
            <div
              className={`plan-option panel ${activePlanCode === plan.code ? "plan-option-active" : ""}`}
              key={plan.code}
            >
              <div className="mini-label">{plan.cadence}</div>
              <h3>{plan.name}</h3>
              <div className="plan-price">
                {plan.price}
                <small>{plan.cadence}</small>
              </div>
              <p>{plan.description}</p>
              <button
                className="button button-coral button-full"
                onClick={() => setSelectedPlanCode(plan.code)}
                disabled={currentStatus !== "free"}
              >
                {currentStatus === "active"
                  ? "Already unlocked"
                  : currentStatus === "pending"
                    ? "Awaiting confirmation"
                    : selectedPlanCode === plan.code
                      ? "Selected plan"
                      : "Choose this plan"}{" "}
                <ArrowUpRight size={15} />
              </button>
              <small className="plan-payment-note">
                Manual PalmPay payment.
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="panel payment-test-banner">
        <strong>Pay manually with PalmPay</strong>
        <span>
          Send the exact plan amount to account 9055918630, account name MUIDI
          OGHENEVWEFE GODSWILL. Then enter your PalmPay transaction reference
          below.
        </span>
        <div className="profile-edit-form">
          <label>
            Selected plan
            <select
              value={selectedPlanCode}
              onChange={event =>
                setSelectedPlanCode(
                  event.target.value as typeof selectedPlanCode
                )
              }
              disabled={currentStatus !== "free"}
            >
              {plansQuery.data?.map(plan => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — {plan.price}
                </option>
              ))}
            </select>
          </label>
          <label>
            PalmPay transaction reference
            <input
              value={reference}
              onChange={event => setReference(event.target.value)}
              placeholder="Enter your transfer reference"
              disabled={currentStatus !== "free"}
            />
          </label>
          <button
            className="button button-coral"
            onClick={() =>
              submitPayment.mutate({ planCode: selectedPlanCode, reference })
            }
            disabled={
              submitPayment.isPending ||
              currentStatus !== "free" ||
              reference.trim().length < 4
            }
          >
            {submitPayment.isPending
              ? "Submitting…"
              : "Submit payment for review"}{" "}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
      <section className="panel exam-gate-panel">
        <div>
          <div className="mini-label">Exam library</div>
          <h2>Full simulations are one click away.</h2>
          <p>
            Premium exams stay clearly marked so you always know what is
            included in your plan.
          </p>
        </div>
        <button
          className="button button-ink"
          onClick={() =>
            toast(
              currentStatus === "active"
                ? "Exam mode is ready in the exam library."
                : "Choose a Plus plan to unlock exam mode."
            )
          }
        >
          {currentStatus === "active" ? "Open exam library" : "See the gate"}{" "}
          <LockKeyhole size={15} />
        </button>
      </section>
    </div>
  );
}

function ManualSubscriptionAdmin() {
  const pending = trpc.admin.pendingSubscriptions.useQuery();
  const approve = trpc.admin.approveSubscription.useMutation({
    onSuccess: async () => {
      toast("Subscription approved and activated.");
      await pending.refetch();
    },
    onError: error => toast(error.message),
  });
  return (
    <section className="panel payment-test-banner">
      <div className="mini-label">PalmPay approvals</div>
      <h2>Manual payment review</h2>
      {pending.data?.length ? (
        <div className="catalog-list">
          {pending.data.map(item => (
            <div className="catalog-row" key={item.userId}>
              <span>
                <strong>
                  {item.userName || item.userEmail || `User ${item.userId}`}
                </strong>
                <small>
                  {item.planCode} · {item.reference} · ₦
                  {(item.amountKobo / 100).toLocaleString("en-NG")}
                </small>
              </span>
              <button
                className="catalog-action"
                onClick={() => approve.mutate({ userId: item.userId })}
                disabled={approve.isPending}
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No PalmPay payments are waiting for review.</p>
      )}
    </section>
  );
}

function AdminView() {
  const [csv, setCsv] = useState(
    "examCode,examName,examTier,subjectName,subjectSlug,topicName,topicSlug,prompt,options,answerIndex,explanation,difficulty\nWAEC,West African Examinations Council,free,Mathematics,mathematics,Quadratic equations,quadratic-equations,If x² − 5x + 6 = 0 which pair gives the roots?,x = 1 or x = 6|x = 2 or x = 3|x = −2 or x = −3|x = 0 or x = 5,1,Factor as (x − 2)(x − 3) = 0.,medium"
  );
  const catalog = trpc.admin.catalog.useQuery();
  const importer = trpc.admin.importQuestions.useMutation({
    onSuccess: data => {
      toast(
        `${data.imported} row${data.imported === 1 ? "" : "s"} imported${data.skipped ? `, ${data.skipped} duplicate${data.skipped === 1 ? "" : "s"} skipped` : ""}.`
      );
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const updateQuestion = trpc.admin.updateQuestion.useMutation({
    onSuccess: () => {
      toast("Question updated.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const deleteQuestion = trpc.admin.deleteQuestion.useMutation({
    onSuccess: () => {
      toast("Question deleted.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const updateTopic = trpc.admin.updateTopic.useMutation({
    onSuccess: () => {
      toast("Topic updated.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const deleteTopic = trpc.admin.deleteTopic.useMutation({
    onSuccess: () => {
      toast("Topic deleted.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const updateSubject = trpc.admin.updateSubject.useMutation({
    onSuccess: () => {
      toast("Subject updated.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const deleteSubject = trpc.admin.deleteSubject.useMutation({
    onSuccess: () => {
      toast("Subject deleted.");
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const bulkUpdate = trpc.admin.bulkUpdate.useMutation({
    onSuccess: data => {
      toast(`${data.updated} catalog records updated.`);
      setSelectedRows([]);
      void catalog.refetch();
    },
    onError: error => toast(error.message),
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const managementRows = useMemo(() => {
    const result: Array<Record<string, any>> = [];
    const subjects = new Set<number>();
    const topics = new Set<number>();
    for (const row of catalog.data ?? []) {
      if (row.subjectId && !subjects.has(row.subjectId)) {
        subjects.add(row.subjectId);
        result.push({ ...row, kind: "subject" });
      }
      if (row.topicId && !topics.has(row.topicId)) {
        topics.add(row.topicId);
        result.push({ ...row, kind: "topic" });
      }
      if (row.questionId) result.push({ ...row, kind: "question" });
    }
    return result;
  }, [catalog.data]);
  const editRow = (row: Record<string, any>) => {
    const current =
      row.kind === "question"
        ? row.prompt
        : row.kind === "topic"
          ? row.topicName
          : row.subjectName;
    const next = window.prompt(
      `New ${row.kind === "question" ? "question prompt" : "name"}`,
      current ?? ""
    );
    if (!next || next === current) return;
    if (row.kind === "question")
      updateQuestion.mutate({ id: row.questionId, prompt: next });
    else if (row.kind === "topic")
      updateTopic.mutate({ id: row.topicId, name: next });
    else updateSubject.mutate({ id: row.subjectId, name: next });
  };
  const deleteRow = (row: Record<string, any>) => {
    if (
      !window.confirm(
        `Delete this ${row.kind}? Related records will be cleaned up.`
      )
    )
      return;
    if (row.kind === "question") deleteQuestion.mutate({ id: row.questionId });
    else if (row.kind === "topic") deleteTopic.mutate({ id: row.topicId });
    else deleteSubject.mutate({ id: row.subjectId });
  };
  const rowKey = (row: Record<string, any>) =>
    `${row.kind}:${row.kind === "question" ? row.questionId : row.kind === "topic" ? row.topicId : row.subjectId}`;
  const toggleRow = (row: Record<string, any>) =>
    setSelectedRows(current =>
      current.includes(rowKey(row))
        ? current.filter(key => key !== rowKey(row))
        : [...current, rowKey(row)]
    );
  const runBulkEdit = () => {
    const chosen = managementRows.filter(row =>
      selectedRows.includes(rowKey(row))
    );
    if (!chosen.length) return toast("Select at least one catalog record.");
    const value = window.prompt(
      `New shared ${chosen.length === 1 ? chosen[0]!.kind : "catalog"} name or prompt`,
      ""
    );
    if (!value?.trim()) return;
    bulkUpdate.mutate({
      rows: chosen.map(row => ({
        kind: row.kind,
        id:
          row.kind === "question"
            ? row.questionId
            : row.kind === "topic"
              ? row.topicId
              : row.subjectId,
        value: value.trim(),
      })),
    });
  };
  const parseCsv = (value: string) => {
    const records = parseCsvRecords(value);
    if (records.length < 2) return [];
    const headers = records[0]!.map(header => header.trim());
    return records.slice(1).map((values, index) => {
      if (values.length !== headers.length)
        throw new Error(
          `CSV row ${index + 2} has ${values.length} columns; expected ${headers.length}.`
        );
      const row = Object.fromEntries(
        headers.map((header, column) => [header, values[column]?.trim() ?? ""])
      );
      const answerIndex = Number(row.answerIndex);
      if (!row.prompt || !row.options || !Number.isInteger(answerIndex))
        throw new Error(
          `CSV row ${index + 2} is missing a prompt, options, or valid answerIndex.`
        );
      return {
        examCode: row.examCode,
        examName: row.examName,
        examTier:
          row.examTier === "premium" ? ("premium" as const) : ("free" as const),
        subjectName: row.subjectName,
        subjectSlug: row.subjectSlug,
        topicName: row.topicName,
        topicSlug: row.topicSlug,
        prompt: row.prompt,
        options: row.options
          .split("|")
          .map(item => item.trim())
          .filter(Boolean),
        answerIndex,
        explanation: row.explanation || undefined,
        difficulty: row.difficulty || "medium",
      };
    });
  };
  const onImport = () => {
    try {
      const rows = parseCsv(csv);
      if (!rows.length) {
        toast("Add at least one CSV data row.");
        return;
      }
      importer.mutate({ rows });
    } catch (error) {
      toast(error instanceof Error ? error.message : "CSV validation failed.");
    }
  };
  return (
    <div className="view-stack animate-in">
      <PageIntro
        eyebrow="Admin desk"
        title="Shape the question bank."
        description="Import WAEC subjects, topics, and questions with row validation and duplicate protection."
        action={
          <span className="subscription-pill subscription-active">
            <ShieldCheck size={14} /> Admin only
          </span>
        }
      />
      <ManualSubscriptionAdmin />
      <section className="admin-layout">
        <div className="panel import-panel">
          <div className="import-heading">
            <div>
              <div className="mini-label">Question import</div>
              <h2>Bring in a clean batch.</h2>
            </div>
            <UploadCloud size={24} />
          </div>
          <p>
            Use comma-separated columns. Separate answer options with a pipe
            character (<code>|</code>); answerIndex starts at 0.
          </p>
          <textarea
            value={csv}
            onChange={event => setCsv(event.target.value)}
            aria-label="Question import CSV"
            spellCheck={false}
          />
          <button
            className="button button-coral"
            onClick={onImport}
            disabled={importer.isPending}
          >
            {importer.isPending ? "Importing…" : "Validate & import questions"}{" "}
            <ArrowUpRight size={15} />
          </button>
        </div>
        <aside className="panel catalog-panel">
          <div className="mini-label">Current catalog</div>
          <h2>Desk index</h2>
          <div className="catalog-bulk-toolbar">
            <span>{selectedRows.length} selected</span>
            <button
              className="catalog-action"
              onClick={runBulkEdit}
              disabled={bulkUpdate.isPending}
            >
              Bulk edit
            </button>
            <button
              className="catalog-action"
              onClick={() => setSelectedRows(managementRows.map(rowKey))}
            >
              Select all
            </button>
          </div>
          <div className="catalog-list">
            {managementRows.length ? (
              managementRows.map((row, index) => (
                <div
                  className="catalog-row"
                  key={`${row.examCode}-${row.topicSlug}-${index}`}
                >
                  <input
                    className="catalog-check"
                    type="checkbox"
                    checked={selectedRows.includes(rowKey(row))}
                    onChange={() => toggleRow(row)}
                    aria-label={`Select ${row.kind}`}
                  />
                  <span className="catalog-dot" />
                  <span>
                    <strong>
                      {row.kind === "question"
                        ? row.prompt || "Question"
                        : row.kind === "topic"
                          ? row.topicName || "Topic"
                          : row.subjectName || "Subject"}
                    </strong>
                    <small>
                      {row.examName} · {row.subjectName || "Subject pending"}
                    </small>
                  </span>
                  <em>
                    {row.kind === "question"
                      ? "Question"
                      : row.kind === "topic"
                        ? "Topic"
                        : "Subject"}
                  </em>
                  <button
                    className="catalog-action"
                    onClick={() => editRow(row)}
                    aria-label="Edit catalog record"
                  >
                    Edit
                  </button>
                  <button
                    className="catalog-action catalog-action-danger"
                    onClick={() => deleteRow(row)}
                    aria-label="Delete catalog record"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Layers3 size={17} />
                <p>No catalog rows yet. Import your first clean batch.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

function AccessDeniedView({ navigate }: { navigate: (view: View) => void }) {
  return (
    <div className="view-stack animate-in">
      <section className="panel access-denied">
        <div className="premium-stamp">
          <ShieldCheck size={20} />
        </div>
        <div className="eyebrow">Admin access</div>
        <h1>This desk is kept for content editors.</h1>
        <p>
          Your current learner account can practice and review progress. Ask an
          owner to promote your account before opening WAEC content management.
        </p>
        <button
          className="button button-coral"
          onClick={() => navigate("dashboard")}
        >
          Back to dashboard <ArrowUpRight size={15} />
        </button>
      </section>
    </div>
  );
}

function ExamLibraryView({
  navigate,
  startExam,
}: {
  navigate: (view: View) => void;
  startExam: (examId: number) => void;
}) {
  const exams = trpc.content.exams.useQuery();
  return (
    <div className="view-stack animate-in">
      <PageIntro
        eyebrow="Exam library"
        title="Choose the room you’re ready for."
        description="Start with free topic practice or unlock a full timed simulation when you want the pressure to feel useful."
        action={
          <button
            className="button button-coral"
            onClick={() => navigate("premium")}
          >
            <CreditCard size={16} /> View Plus plans
          </button>
        }
      />
      <div className="exam-library-grid">
        {exams.data?.map(exam => (
          <ExamCard
            key={exam.code}
            exam={exam}
            navigate={navigate}
            startExam={startExam}
          />
        ))}
        {!exams.data?.length && (
          <div className="panel empty-state">
            <Compass size={20} />
            <p>
              The exam library is being indexed. Check back after the next
              content import.
            </p>
          </div>
        )}
      </div>
      <section className="panel exam-library-note">
        <div className="woven-mini" />
        <div>
          <div className="mini-label">A note from the desk</div>
          <h2>Use simulations as a mirror, not a verdict.</h2>
          <p>
            Timed practice is here to show the shape of your thinking. Review
            the misses, then return to the topic room that caused them.
          </p>
        </div>
      </section>
    </div>
  );
}

function ExamCard({
  exam,
  navigate,
  startExam,
}: {
  exam: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    tier: "free" | "premium";
  };
  navigate: (view: View) => void;
  startExam: (examId: number) => void;
}) {
  const access = trpc.exams.access.useQuery({ code: exam.code });
  const premium = exam.tier === "premium";
  const allowed = access.data?.allowed ?? !premium;
  return (
    <article
      className={`panel exam-library-card ${premium ? "exam-card-premium" : ""}`}
    >
      <div className="exam-card-topline">
        <span className={`tag ${premium ? "tag-coral" : "tag-sand"}`}>
          {premium ? <LockKeyhole size={12} /> : <CheckCircle2 size={12} />}{" "}
          {premium ? "Plus" : "Free"}
        </span>
        <span className="exam-code">{exam.code}</span>
      </div>
      <h2>{exam.name}</h2>
      <p>{exam.description || "A focused StudyForge preparation room."}</p>
      <div className="exam-card-meta">
        <span>
          <Timer size={14} /> Timed practice
        </span>
        <span>
          <ListChecks size={14} /> WAEC format
        </span>
      </div>
      <button
        className={`button ${allowed ? "button-ink" : "button-coral"} button-full`}
        onClick={() =>
          allowed
            ? premium
              ? startExam(exam.id)
              : toast(
                  `${exam.name} is ready. Start from a topic room to begin.`
                )
            : navigate("premium")
        }
      >
        {allowed ? "Open exam room" : "Unlock full simulation"}{" "}
        {allowed ? <ArrowUpRight size={15} /> : <LockKeyhole size={15} />}
      </button>
      {premium && (
        <small className="exam-gate-copy">
          {allowed
            ? "Included with your active Plus plan."
            : "Requires an active StudyForge Plus plan."}
        </small>
      )}
    </article>
  );
}

function parseCsvRecords(value: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '"' && quoted && value[index + 1] === '"') {
      cell += '"';
      index++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && value[index + 1] === "\n") index++;
      row.push(cell);
      cell = "";
      if (row.some(item => item.trim())) records.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(item => item.trim())) records.push(row);
  }
  return records;
}
