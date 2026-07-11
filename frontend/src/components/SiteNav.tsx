import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";

const NAV: { label: string; href?: string; items?: { label: string; href: string }[] }[] = [
  {
    label: "Product",
    items: [
      { label: "Blueprint Generator", href: "/generator" },
      { label: "SQL Generator", href: "/generator" },
      { label: "Endpoint Generator", href: "/generator" },
    ],
  },
  {
    label: "About",
    items: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "What you get", href: "/#what-you-get" },
    ],
  },
];

export default function SiteNav() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="relative w-full px-5 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-lg sm:text-xl font-display font-semibold tracking-tight text-white">
          forge<span className="text-accent2">ai</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-white/90 hover:text-white text-sm font-medium transition">
                {item.label}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    openDropdown === item.label ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openDropdown === item.label && item.items && (
                <div className="!absolute top-full left-0 liquid-glass rounded-xl py-2 px-2 min-w-[190px] shadow-xl animate-dropdown z-50">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.label}
                      to={sub.href}
                      className="block px-3 py-2 text-white/80 hover:text-white text-sm rounded-lg hover:bg-white/5 transition"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => navigate("/generator")}
            className="ml-2 flex items-center gap-1.5 liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium hover:bg-white/5 transition"
          >
            Start Building
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden relative w-9 h-9 flex items-center justify-center text-white"
          aria-label="Toggle menu"
        >
          <Menu
            size={22}
            className={`absolute transition-all duration-300 ${
              mobileOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            size={22}
            className={`absolute transition-all duration-300 ${
              mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden absolute left-4 right-4 top-full z-50 overflow-hidden transition-all duration-400 ${
          mobileOpen ? "max-h-[28rem] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="bg-[#12151c]/95 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
          {NAV.map((item) => (
            <div key={item.label} className="mb-4 last:mb-0">
              <p className="text-white/90 text-sm font-medium mb-1.5">{item.label}</p>
              <div className="flex flex-col gap-1 pl-2">
                {item.items?.map((sub) => (
                  <Link
                    key={sub.label}
                    to={sub.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-white/60 hover:text-white text-sm py-1"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 mt-2 border-t border-white/10">
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("/generator");
              }}
              className="w-full flex items-center justify-center gap-1.5 liquid-glass rounded-full px-5 py-2.5 text-white text-sm font-medium"
            >
              Start Building
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
