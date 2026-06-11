import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth.jsx";
import Background from "./components/Background.jsx";
import OrientationTip from "./components/OrientationTip.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Host from "./pages/Host.jsx";
import Play from "./pages/PlayScreen.jsx";
import ShareImport from "./pages/ShareImport.jsx";
import QuestionPreview from "./pages/QuestionPreview.jsx";

export default function App() {
  return (
    <AuthProvider>
      <div className="relative min-h-full overflow-x-hidden font-body">
        <Background />
        <OrientationTip />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/host" element={<Host />} />
          <Route path="/play" element={<Play />} />
          <Route path="/join" element={<Play />} />
          <Route path="/share" element={<ShareImport />} />
          <Route path="/share/:code" element={<ShareImport />} />
          {import.meta.env.DEV && (
            <Route path="/dev/question-preview" element={<QuestionPreview />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
