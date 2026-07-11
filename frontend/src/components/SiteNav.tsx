import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GooeyNav from "./vendor/GooeyNav";

export default function SiteNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "#contact" },
  ];

  // Determine active index for the gooey transition effect based on current pathname
  const activeIndex = location.pathname === "/about" ? 1 : 0;

  return (
    <header className="fixed top-6 left-0 right-0 w-full z-50 flex justify-center px-4">
      <nav className="w-fit glass rounded-full px-6 py-2 flex items-center gap-8 border border-white/10 backdrop-blur-md shadow-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-white/80 transition">
            Forge <span className="text-glow font-sans font-semibold text-xs tracking-widest uppercase bg-gradient-to-r from-[#4F9DFF] to-[#7CEEFF] bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        {/* Desktop Links (Gooey Nav) */}
        <div className="hidden md:block">
          <GooeyNav items={links} initialActiveIndex={activeIndex} />
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block shrink-0">
          <button
            onClick={() => navigate("/generator")}
            className="px-5 py-2 rounded-full border border-white/20 text-white font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-[#050505] hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            Launch App
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-white"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 bg-[#050505]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-4 shadow-3xl md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-sans font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("/generator");
              }}
              className="mt-2 w-full py-3 rounded-full border border-white/20 text-white text-xs font-semibold uppercase tracking-wider text-center transition-all hover:bg-white hover:text-black"
            >
              Launch App
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
