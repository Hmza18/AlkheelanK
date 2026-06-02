import { Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./lib/auth.jsx";
import Background from "./components/Background.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Host from "./pages/Host.jsx";
import Play from "./pages/PlayScreen.jsx";
import ShareImport from "./pages/ShareImport.jsx";

export default function App() {
  return (
    <AuthProvider>
      <div className="relative min-h-full font-body">
        <Background />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/host" element={<Host />} />
          <Route path="/play" element={<Play />} />
          <Route path="/join" element={<Play />} />
          <Route path="/share" element={<ShareImport />} />
          <Route path="/share/:code" element={<ShareImport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Analytics />
    </AuthProvider>
  );
}
