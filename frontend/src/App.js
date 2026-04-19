import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider, useGame } from "@/lib/gameContext";
import AppLayout from "@/components/AppLayout";
import Setup from "@/screens/Setup";
import HQ from "@/screens/HQ";
import Squad from "@/screens/Squad";
import Match from "@/screens/Match";
import League from "@/screens/League";
import Fixtures from "@/screens/Fixtures";
import Transfers from "@/screens/Transfers";
import Training from "@/screens/Training";
import Finance from "@/screens/Finance";
import Cup from "@/screens/Cup";

function ProtectedRoute({ children }) {
  const { state, loading } = useGame();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
        <div className="font-heading text-3xl">YÜKLƏNİR...</div>
      </div>
    );
  }
  if (!state) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const { state, loading } = useGame();
  if (loading) return null;
  if (state) return <Navigate to="/hq" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Setup /></PublicRoute>} />
      <Route path="/hq" element={<ProtectedRoute><HQ /></ProtectedRoute>} />
      <Route path="/squad" element={<ProtectedRoute><Squad /></ProtectedRoute>} />
      <Route path="/match" element={<ProtectedRoute><Match /></ProtectedRoute>} />
      <Route path="/league" element={<ProtectedRoute><League /></ProtectedRoute>} />
      <Route path="/fixtures" element={<ProtectedRoute><Fixtures /></ProtectedRoute>} />
      <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
      <Route path="/cup" element={<ProtectedRoute><Cup type="cup" /></ProtectedRoute>} />
      <Route path="/europe" element={<ProtectedRoute><Cup type="europe" /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <GameProvider>
          <AppRoutes />
        </GameProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
