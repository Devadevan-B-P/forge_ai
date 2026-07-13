import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SiteNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  // Determine active index based on pathName
  const activeIndex =
    location.pathname === "/about" ? 1 :
    location.pathname === "/contact" ? 2 : 0;

  return (
    <header className="fixed top-6 left-0 right-0 w-full z-50 flex justify-center px-4">
      <nav className="w-fit glass rounded-full px-5 py-2 flex items-center gap-6 border border-white/10 backdrop-blur-md shadow-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0 pr-2">
          <span className="font-serif text-lg font-medium tracking-tight text-white group-hover:text-white/80 transition">
            Forge <span className="text-glow font-sans font-semibold text-xs tracking-widest uppercase bg-gradient-to-r from-[#4F9DFF] to-[#7CEEFF] bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        {/* Desktop Links (Spring sliding pill background nav) */}
        <div className="hidden md:flex items-center gap-1 relative">
          {links.map((link, i) => {
            const isActive = activeIndex === i;
            const isHash = link.href.startsWith("#");

            return (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Active Indicator (background slider) */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/5"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Hover Indicator (background slider) */}
                {hoveredIndex === i && !isActive && (
                  <motion.div
                    layoutId="hoverNavIndicator"
                    className="absolute inset-0 bg-white/5 rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}

                {isHash ? (
                  <a
                    href={link.href}
                    className={`relative z-10 px-4 py-1.5 block text-xs font-medium font-sans tracking-wide transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    className={`relative z-10 px-4 py-1.5 block text-xs font-medium font-sans tracking-wide transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block shrink-0 pl-2">
          <button
            onClick={() => navigate("/generator")}
            className="px-5 py-2 rounded-full border border-white/20 text-white font-sans text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-[#050505] hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
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
