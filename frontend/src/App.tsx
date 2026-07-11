import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/generator" element={<Generator />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
