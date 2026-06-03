import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { isOAuthCallback } from "../lib/authRedirect.js";
import { createQuiz, updateQuiz } from "../lib/db.js";
import Dashboard from "./Dashboard.jsx";
import QuizEditor from "./QuizEditor.jsx";
import HostGame from "./HostGame.jsx";

// Auth-gated host orchestrator. Switches between the dashboard, the quiz editor,
// and the live game without remounting the whole tree.
export default function Host() {
  const { user, loading, configured } = useAuth();
  const [params] = useSearchParams();
  const [guest] = useState(params.get("guest") === "1");
  const [view, setView] = useState("dashboard"); // dashboard | editor | game
  const [editing, setEditing] = useState(null); // saved quiz being edited, or null
  const [launch, setLaunch] = useState(null); // { quiz } | { quizId }

  // Guests are allowed without an account; if Supabase isn't configured we
  // auto-fall into guest mode so the app still works end to end.
  const allowed = Boolean(user) || guest || !configured;

  const finishingOAuth = isOAuthCallback() && configured && !user;

  if (loading || finishingOAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="alkheelank-card px-6 py-4 text-center font-semibold text-muted">
          {finishingOAuth ? "Finishing sign-in…" : "Loading…"}
        </div>
      </div>
    );
  }
  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  const goDashboard = () => {
    setEditing(null);
    setLaunch(null);
    setView("dashboard");
  };

  const handleSave = async (quizData) => {
    if (!user) return { message: "Log in to save." };
    const res = editing?.id
      ? await updateQuiz(editing.id, quizData)
      : await createQuiz(user.id, quizData);
    if (res.error) return res.error;
    // Track the new id so subsequent saves update instead of duplicating.
    if (res.data) setEditing(res.data);
    return null;
  };

  if (view === "editor") {
    return (
      <div className="min-h-screen px-6 py-6">
        <QuizEditor
          initial={editing}
          canSave={Boolean(user)}
          userId={user?.id ?? null}
          onCancel={goDashboard}
          onSave={handleSave}
          onLaunch={(quiz) => {
            setLaunch({ quiz });
            setView("game");
          }}
        />
      </div>
    );
  }

  if (view === "game" && launch) {
    return <HostGame launch={launch} onExit={goDashboard} />;
  }

  return (
    <div className="min-h-screen px-6 py-6">
      <Dashboard
        guest={guest && !user}
        onNew={() => {
          setEditing(null);
          setView("editor");
        }}
        onEdit={(quiz) => {
          setEditing(quiz);
          setView("editor");
        }}
        onLaunchSaved={(quiz) => {
          setLaunch({ quiz: { title: quiz.title, questions: quiz.questions } });
          setView("game");
        }}
        onLaunchBuiltin={(quizId) => {
          setLaunch({ quizId });
          setView("game");
        }}
      />
    </div>
  );
}
