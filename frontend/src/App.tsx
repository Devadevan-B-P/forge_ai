import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import About from "./pages/About";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/generator"
          element={
            <ProtectedRoute>
              <Generator />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
