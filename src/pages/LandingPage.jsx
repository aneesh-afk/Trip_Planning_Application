import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   Waypoint data for the animated SVG route
───────────────────────────────────────────── */
const WAYPOINTS = [
  { cx: 60,  cy: 170, label: "35.7N 139.7E", city: "Tokyo"     },
  { cx: 180, cy: 90,  label: "37.5N 126.9E", city: "Seoul"     },
  { cx: 320, cy: 130, label: "25.0N 121.5E", city: "Taipei"    },
  { cx: 460, cy: 80,  label: "22.3N 114.2E", city: "HK"        },
  { cx: 600, cy: 150, label: "13.8N 100.5E", city: "Bangkok"   },
  { cx: 740, cy: 110, label: "1.35N 103.8E", city: "Singapore" },
];

/* Smooth cubic bezier path through waypoints */
function buildPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].cx} ${pts[0].cy}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.cx + curr.cx) / 2;
    d += ` C ${cpx} ${prev.cy}, ${cpx} ${curr.cy}, ${curr.cx} ${curr.cy}`;
  }
  return d;
}

const ROUTE_PATH = buildPath(WAYPOINTS);
const PATH_LENGTH = 900; // approximate; we over-estimate so stroke always completes

/* ─────────────────────────────────────────────
   Feature blocks
───────────────────────────────────────────── */
const FEATURES = [
  {
    tag: "WP-01",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="20" cy="20" r="18" stroke="#C4622D" strokeWidth="1.5" />
        <path d="M12 28 Q20 10 28 28" stroke="#C4622D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="28" r="2.5" fill="#C4622D" />
        <circle cx="28" cy="28" r="2.5" fill="#C4622D" />
        <circle cx="20" cy="16" r="2.5" fill="#C4622D" />
      </svg>
    ),
    title: "Sketch the route",
    body: "Drop waypoints on a map, rough out dates, and let GlobeTrotter build a framework for your journey — no detail required yet.",
  },
  {
    tag: "WP-02",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="14" cy="14" r="7" stroke="#C4622D" strokeWidth="1.5" />
        <circle cx="27" cy="14" r="7" stroke="#C4622D" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M14 23 Q20 32 27 23" stroke="#C4622D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    title: "Invite collaborators",
    body: "Share a link with co-travellers. Everyone can suggest stops, vote on activities, and edit the plan in real time.",
  },
  {
    tag: "WP-03",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="8" y="10" width="24" height="22" rx="3" stroke="#C4622D" strokeWidth="1.5" />
        <path d="M14 10V7M26 10V7" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 17h24" stroke="#C4622D" strokeWidth="1.2" />
        <circle cx="15" cy="24" r="1.5" fill="#C4622D" />
        <circle cx="20" cy="24" r="1.5" fill="#C4622D" />
        <circle cx="25" cy="24" r="1.5" fill="#C4622D" />
      </svg>
    ),
    title: "Fill in the stops",
    body: "Add hotels, restaurants, and experiences to each day. Track budgets, attach bookings, and export the final itinerary.",
  },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function LandingPage() {
  const pathRef = useRef(null);
  const dotRefs = useRef([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      /* Skip animation — just show everything */
      if (pathRef.current) {
        pathRef.current.style.strokeDashoffset = "0";
      }
      dotRefs.current.forEach((el) => {
        if (el) el.style.opacity = "1";
      });
      return;
    }

    /* Trigger path draw */
    const path = pathRef.current;
    if (path) {
      path.style.transition = "none";
      path.style.strokeDashoffset = String(PATH_LENGTH);
      void path.getBoundingClientRect(); // force reflow
      path.style.transition = "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)";
      path.style.strokeDashoffset = "0";
    }

    /* Stagger dot fade-in after line is ~half drawn */
    dotRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "0";
      const delay = 1200 + i * 180;
      const t = setTimeout(() => {
        el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }, delay);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <>
      {/* ── Keyframes & Grid pattern ── */}
      <style>{`
        .gt-hero-grid {
          background-image:
            linear-gradient(rgba(31,42,36,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,42,36,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        @keyframes gt-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gt-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes gt-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }

        .gt-anim-hero { animation: gt-fade-up 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        .gt-anim-hero-d1 { animation-delay: 0.1s; }
        .gt-anim-hero-d2 { animation-delay: 0.25s; }
        .gt-anim-hero-d3 { animation-delay: 0.4s; }
        .gt-anim-hero-d4 { animation-delay: 0.55s; }

        .gt-pulse-ring {
          animation: gt-pulse-ring 2s ease-out infinite;
        }
        .gt-float {
          animation: gt-float 4s ease-in-out infinite;
        }

        .gt-cta-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
        .gt-cta-primary { transition: transform 0.25s ease, box-shadow 0.25s ease; }

        .gt-feature-card:hover { transform: translateY(-4px); border-color: var(--color-route); }
        .gt-feature-card { transition: transform 0.3s ease, border-color 0.3s ease; }

        @media (prefers-reduced-motion: reduce) {
          .gt-anim-hero,
          .gt-pulse-ring,
          .gt-float,
          .gt-cta-primary,
          .gt-feature-card {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-bg text-ink font-body">
        {/* ── Nav bar ── */}
        <nav
          className="flex items-center justify-between px-6 md:px-12 py-4 sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border"
          aria-label="Main navigation"
          role="navigation"
        >
          <span
            className="font-display text-h2 text-route"
            aria-label="GlobeTrotter home"
          >
            GlobeTrotter
          </span>
          <Link
            to="/login"
            id="nav-login-link"
            className="text-small text-horizon hover:underline font-medium"
          >
            Log in →
          </Link>
        </nav>

        {/* ═══════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════ */}
        <section
          className="gt-hero-grid relative overflow-hidden pt-16 pb-10 px-6 md:px-12 flex flex-col items-center text-center"
          aria-labelledby="hero-heading"
          id="hero"
        >
          {/* Radial glow behind hero */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-80px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "700px",
              height: "700px",
              background: "radial-gradient(circle, rgba(196,98,45,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Eyebrow label */}
          <div
            className="gt-anim-hero gt-anim-hero-d1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              fontFamily: "'IBM Plex Mono', Menlo, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              color: "#C4622D",
              border: "1px solid rgba(196,98,45,0.3)",
              backgroundColor: "rgba(196,98,45,0.06)",
              textTransform: "uppercase",
            }}
            aria-label="Product label"
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C4622D", display: "inline-block" }} aria-hidden="true" />
            Collaborative Travel Planning
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="gt-anim-hero gt-anim-hero-d2 max-w-3xl leading-tight mb-6"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              fontWeight: 600,
              color: "#1F2A24",
              lineHeight: 1.15,
            }}
          >
            Your journey,{" "}
            <span style={{ color: "#C4622D" }}>charted together.</span>
          </h1>

          {/* Subhead */}
          <p
            className="gt-anim-hero gt-anim-hero-d3 max-w-xl mb-8 text-body text-muted leading-relaxed"
          >
            GlobeTrotter turns scattered ideas into a shared itinerary — one waypoint at a time.
          </p>

          {/* CTAs */}
          <div className="gt-anim-hero gt-anim-hero-d4 flex flex-col sm:flex-row items-center gap-4 mb-4">
            <Link
              to="/login"
              id="hero-cta-primary"
              className="gt-cta-primary inline-flex items-center gap-2 rounded-[6px] px-5 py-3 font-medium shadow-card"
              style={{
                backgroundColor: "#C4622D",
                color: "#FFFFFF",
              }}
              aria-label="Start planning your trip"
            >
              Start planning
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              to="/login"
              id="hero-cta-secondary"
              className="text-small text-muted hover:text-horizon transition-colors duration-200 underline underline-offset-4 decoration-border"
              aria-label="Log in to your existing account"
            >
              Already have an account? Log in
            </Link>
          </div>

          {/* ── Animated Route SVG ── */}
          <div
            className="gt-anim-hero gt-float w-full max-w-3xl mt-16 mb-4"
            style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.7s" }}
            aria-label="Animated travel route connecting six Asian cities"
            role="img"
          >
            <svg
              viewBox="0 0 800 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              style={{ overflow: "visible" }}
            >
              {/* Subtle shadow beneath path */}
              <path
                d={ROUTE_PATH}
                    stroke="rgba(196,98,45,0.12)"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />

              {/* Animated route path */}
              <path
                ref={pathRef}
                d={ROUTE_PATH}
                stroke="#C4622D"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: PATH_LENGTH,
                  strokeDashoffset: PATH_LENGTH,
                }}
              />

              {/* Waypoint dots + labels */}
              {WAYPOINTS.map((wp, i) => (
                <g
                  key={wp.city}
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  style={{ opacity: 0, transform: "scale(0.6)", transformOrigin: `${wp.cx}px ${wp.cy}px` }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx={wp.cx}
                    cy={wp.cy}
                    r="10"
                    fill="none"
                    stroke="#C4622D"
                    strokeWidth="1"
                    className="gt-pulse-ring"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                  {/* Dot */}
                  <circle cx={wp.cx} cy={wp.cy} r="5" fill="#C4622D" />
                  <circle cx={wp.cx} cy={wp.cy} r="2.5" fill="#FBF7F0" />

                  {/* Coordinate label above */}
                  <text
                    x={wp.cx}
                    y={wp.cy - 18}
                    textAnchor="middle"
                    fill="rgba(31,42,36,0.55)"
                    fontSize="8"
                    fontFamily="'IBM Plex Mono', Menlo, monospace"
                  >
                    {wp.label}
                  </text>

                  {/* City name below */}
                  <text
                    x={wp.cx}
                    y={wp.cy + 22}
                    textAnchor="middle"
                    fill="rgba(31,42,36,0.8)"
                    fontSize="9"
                    fontFamily="'Inter', system-ui, sans-serif"
                    fontWeight="500"
                  >
                    {wp.city}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Small mono label beneath SVG */}
          <p
            style={{
              fontFamily: "'IBM Plex Mono', Menlo, monospace",
              fontSize: "0.7rem",
              color: "rgba(31,42,36,0.45)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
            aria-hidden="true"
          >
            Route · Southeast Asia · 6 stops
          </p>
        </section>

        {/* ═══════════════════════════════════════
            DIVIDER
        ═══════════════════════════════════════ */}
        <div
          aria-hidden="true"
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(31,42,36,0.12) 30%, rgba(196,98,45,0.25) 50%, rgba(31,42,36,0.12) 70%, transparent)",
            margin: "0 3rem",
          }}
        />

        {/* ═══════════════════════════════════════
            FEATURES SECTION
        ═══════════════════════════════════════ */}
        <section
          className="px-6 md:px-12 py-24 max-w-6xl mx-auto"
          aria-labelledby="features-heading"
          id="features"
        >
          {/* Section label */}
          <div className="flex items-center gap-3 mb-4" aria-hidden="true">
              <div style={{ width: "32px", height: "1px", backgroundColor: "#C4622D" }} />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', Menlo, monospace",
                fontSize: "0.72rem",
                color: "#C4622D",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              How it works
            </span>
          </div>

          <h2
            id="features-heading"
            className="mb-16 max-w-lg"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#1F2A24",
            }}
          >
            Three moves from idea to itinerary.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <article
                key={f.tag}
                className="gt-feature-card rounded-2xl p-8"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4DDD0",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {/* Waypoint tag */}
                <div className="mb-6 flex items-center gap-3">
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', Menlo, monospace",
                      fontSize: "0.68rem",
                      color: "#C4622D",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(196,98,45,0.35)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    {f.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-5">{f.icon}</div>

                {/* Content */}
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1F2A24",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {f.title}
                </h3>
                <p className="text-small text-muted" style={{ lineHeight: 1.7 }}>
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FOOTER CTA SECTION
        ═══════════════════════════════════════ */}
        <section
          className="px-6 md:px-12 py-24"
          aria-labelledby="footer-cta-heading"
          id="footer-cta"
          style={{ borderTop: "1px solid #E4DDD0" }}
        >
          <div className="max-w-2xl mx-auto text-center">
            {/* Subtle globe illustration */}
            <div className="mx-auto mb-8 w-16 h-16 flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                <circle cx="32" cy="32" r="28" stroke="#C4622D" strokeWidth="1.2" strokeDasharray="4 3" />
                <ellipse cx="32" cy="32" rx="14" ry="28" stroke="rgba(196,98,45,0.4)" strokeWidth="1" />
                <line x1="4" y1="32" x2="60" y2="32" stroke="rgba(196,98,45,0.3)" strokeWidth="1" />
                <line x1="12" y1="18" x2="52" y2="18" stroke="rgba(196,98,45,0.2)" strokeWidth="0.8" />
                <line x1="12" y1="46" x2="52" y2="46" stroke="rgba(196,98,45,0.2)" strokeWidth="0.8" />
              </svg>
            </div>

            <h2
              id="footer-cta-heading"
              className="mb-5"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#1F2A24",
                lineHeight: 1.15,
              }}
            >
              Ready to map your next adventure?
            </h2>

            <p
              className="mb-10"
              className="text-body text-muted"
              style={{ lineHeight: 1.7 }}
            >
              Join your crew and start plotting the route — no experience required.
            </p>

            <Link
              to="/login"
              id="footer-cta-button"
              className="gt-cta-primary inline-flex items-center gap-2 rounded-[6px] px-5 py-3 font-medium shadow-card"
              style={{
                backgroundColor: "#C4622D",
                color: "#FFFFFF",
              }}
              aria-label="Continue to log in page"
            >
              Continue to log in
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── Footer wordmark ── */}
        <footer
          className="text-center py-8 px-6"
          style={{ borderTop: "1px solid #E4DDD0" }}
          role="contentinfo"
        >
          <span
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: "rgba(196,98,45,0.7)",
              fontSize: "1.1rem",
              letterSpacing: "-0.01em",
            }}
            aria-label="GlobeTrotter"
          >
            GlobeTrotter
          </span>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', Menlo, monospace",
              fontSize: "0.68rem",
              color: "rgba(31,42,36,0.45)",
              letterSpacing: "0.08em",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            Plan together · Go further
          </p>
        </footer>
      </div>
    </>
  );
}
