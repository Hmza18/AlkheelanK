import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { isOAuthCallback } from "../lib/authRedirect.js";
import { createQuiz, updateQuiz } from "../lib/db.js";
import Dashboard from "./Dashboard.jsx";
import QuizEditor from "./QuizEditor.jsx";
import HostGame from "./HostGame.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { clearHostSession, loadHostSession } from "../lib/hostSession.js";
import { connectSocket, emitWithAck, socket } from "../socket.js";

// Auth-gated host orchestrator. Switches between the dashboard, the quiz editor,
// and the live game without remounting the whole tree.
export default function Host() {
  const { user, loading, configured } = useAuth();
  const [params] = useSearchParams();
  const [guest] = useState(params.get("guest") === "1");
  const [editing, setEditing] = useState(null); // saved quiz being edited, or null
  const [launch, setLaunch] = useState(null);
  // A saved host session means a game may still be live — ask before resuming
  // instead of silently dropping the host back into it.
  const [view, setView] = useState(() => (loadHostSession() ? "resume-prompt" : "dashboard"));

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
    clearHostSession();
    setEditing(null);
    setLaunch(null);
    setView("dashboard");
  };

  const handleSave = async (quizData) => {
    if (!user) return { message: "Log in to save." };
    const res = editing?.id
      ? await updateQuiz(user.id, editing.id, quizData)
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
            clearHostSession();
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
      {view === "resume-prompt" && (
        <ConfirmModal
          title="Resume your game?"
          message="You have a game in progress from before. Pick it back up, or start fresh from the dashboard."
          confirmLabel="Resume game"
          cancelLabel="Start fresh"
          onConfirm={() => {
            setLaunch({ reconnect: true });
            setView("game");
          }}
          onCancel={async () => {
            const saved = loadHostSession();
            if (saved?.pin && saved?.hostToken) {
              try {
                await connectSocket();
                await emitWithAck(
                  "host:reconnect",
                  { pin: saved.pin, hostToken: saved.hostToken },
                  15_000,
                );
                socket.emit("host:end");
              } catch {
                // Game may already be gone — still clear local session.
              }
            }
            clearHostSession();
            setView("dashboard");
          }}
        />
      )}
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
          clearHostSession();
          setLaunch({ quiz: { title: quiz.title, questions: quiz.questions } });
          setView("game");
        }}
        onLaunchBuiltin={(quiz) => {
          clearHostSession();
          setLaunch({
            quizId: quiz.id,
            quizMeta: { title: quiz.title, questionCount: quiz.questionCount },
          });
          setView("game");
        }}
      />
    </div>
  );
}
