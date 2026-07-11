import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";

const NAV: { label: string; items?: { label: string; href: string }[] }[] = [
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
      { label: "About Forge AI", href: "/about" },
    ],
  },
];

/* ── Diamond SVG logo mark ─────────────────────────────────────────── */
function DiamondLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer diamond */}
      <path
        d="M14 2L26 14L14 26L2 14L14 2Z"
        fill="white"
        opacity="0.9"
      />
      {/* inner diamond rotated 45° */}
      <path
        d="M14 7L21 14L14 21L7 14L14 7Z"
        fill="#0b0d12"
        opacity="0.5"
      />
    </svg>
  );
}

export default function SiteNav() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="relative w-full px-5 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-5 z-50">
      <div className="flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <DiamondLogo />
          <span className="text-lg sm:text-xl font-medium tracking-tight text-white">
            forge<span className="text-white/60">ai</span>
          </span>
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
                {item.items && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {openDropdown === item.label && item.items && (
                <div className="!absolute top-full left-0 liquid-glass rounded-xl py-3 px-2 min-w-[190px] shadow-xl animate-dropdown z-50">
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

          {/* Desktop CTA */}
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={() => navigate("/generator")}
              className="liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium hover:bg-white/5 transition flex items-center gap-1.5"
            >
              Start Building
              <ArrowRight size={14} />
            </button>
          </div>
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
        className={`md:hidden absolute left-4 right-4 top-full z-50 overflow-hidden duration-400 transition-all ${
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
          <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-2">
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
