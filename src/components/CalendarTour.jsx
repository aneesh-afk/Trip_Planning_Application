import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_STORAGE_KEY = "hasSeenCalendarTour";

const TOUR_STEPS = [
  {
    targetId: "calendar-search",
    title: "Search Bar",
    content: "Search across all your trips, cities, or activities in one place.",
    placement: "bottom",
  },
  {
    targetId: "calendar-sort",
    title: "Sort By",
    content: "Sort your itinerary by date, city, or trip name.",
    placement: "bottom",
  },
  {
    targetId: "calendar-filter-trip",
    title: "Filter & Group Trips",
    content: "Segregate your calendar by a single trip, or view everything at once.",
    placement: "bottom",
  },
  {
    targetId: "tour-calendar-card",
    title: "Calendar Grid & Colored Dots",
    content: "Each color represents a different trip. Tap any day to see what's planned.",
    placement: "bottom",
  },
  {
    targetId: "tour-trip-chips",
    title: "Trip Filter Chips",
    content: "Toggle a trip on or off to isolate it on the calendar.",
    placement: "top",
  },
  {
    targetId: "tour-timeline-section",
    title: "Full Itinerary Timeline",
    content: "Jump straight into a trip's full itinerary from here.",
    placement: "top",
  },
];

export default function CalendarTour({ isOpen, onClose, steps = TOUR_STEPS }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, transform: "none" });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingText, setIsAnimatingText] = useState(false);
  const animTimeoutRef = useRef(null);

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step) return;

    let el = document.getElementById(step.targetId);
    if (!el && step.targetSelector) {
      el = document.querySelector(step.targetSelector);
    }

    if (!el) {
      setRect(null);
      setTooltipPos({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const b = el.getBoundingClientRect();
    const pad = 6;
    const target = {
      top: Math.max(0, b.top - pad),
      left: Math.max(0, b.left - pad),
      width: b.width + pad * 2,
      height: b.height + pad * 2,
      bottom: b.bottom + pad,
      right: b.right + pad,
    };

    setRect(target);

    // Tooltip position calculation
    const tooltipWidth = 340;
    const tooltipMargin = 14;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let left = target.left + target.width / 2 - tooltipWidth / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > winW - 16) left = winW - tooltipWidth - 16;

    const spaceBelow = winH - target.bottom;
    const spaceAbove = target.top;

    let top = 0;
    let transform = "none";

    if (step.placement === "top" && spaceAbove > 200) {
      top = target.top - tooltipMargin;
      transform = "translateY(-100%)";
    } else if (spaceBelow > 200 || spaceBelow >= spaceAbove) {
      top = target.bottom + tooltipMargin;
      transform = "none";
    } else {
      top = Math.max(16, target.top - tooltipMargin);
      transform = "translateY(-100%)";
    }

    setTooltipPos({ top, left, transform });
  }, [step]);

  // Smooth scroll and position update
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      setCurrentStep(0);
      setRect(null);
      return;
    }

    // Fade in overlay smoothly
    const openTimer = setTimeout(() => setIsVisible(true), 20);

    // Smooth scroll target into view
    if (step) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }

    // Text transition
    setIsAnimatingText(true);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => setIsAnimatingText(false), 500);

    // Recalculate after scroll starts and settles
    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 220);
    const t3 = setTimeout(updateTargetRect, 400);

    const onResize = () => updateTargetRect();
    const onScroll = () => updateTargetRect();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      clearTimeout(openTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, currentStep, updateTargetRect, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  const handleClose = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // storage unavailable
    }
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden font-body pointer-events-auto transition-opacity duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* ── Spotlight Cutout with Gliding Transition ── */}
      {rect ? (
        <div
          style={{
            position: "fixed",
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow: "0 0 0 9999px rgba(31, 42, 36, 0.65), 0 0 24px rgba(196, 98, 45, 0.35)",
            transition: "top 700ms cubic-bezier(0.32, 0.72, 0, 1), left 700ms cubic-bezier(0.32, 0.72, 0, 1), width 700ms cubic-bezier(0.32, 0.72, 0, 1), height 700ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          className="rounded-lg border-2 border-route ring-4 ring-route/25 pointer-events-none z-40"
        />
      ) : (
        <div className="absolute inset-0 bg-ink/65 backdrop-blur-[1px] transition-opacity duration-300" />
      )}

      {/* ── Tooltip Card with Gliding Coordinates ── */}
      <div
        style={{
          position: "fixed",
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          transform: tooltipPos.transform,
          width: "340px",
          transition: "top 700ms cubic-bezier(0.32, 0.72, 0, 1), left 700ms cubic-bezier(0.32, 0.72, 0, 1), transform 700ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className="z-50 bg-surface border border-border rounded-md shadow-hover p-5"
      >
        {/* Step Badge & Close */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-label text-route font-semibold uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleClose}
            aria-label="Close tutorial"
            className="text-muted hover:text-ink w-6 h-6 flex items-center justify-center rounded text-sm hover:bg-border/30 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content with Smooth Fade between steps */}
        <div
          className={`transition-opacity duration-200 ease-out ${
            isAnimatingText ? "opacity-40 translate-y-0.5" : "opacity-100 translate-y-0"
          }`}
        >
          <h4 className="font-display text-h2 font-semibold text-ink mb-1.5 leading-snug">
            {step.title}
          </h4>

          <p className="font-body text-small text-muted mb-4 leading-relaxed min-h-[44px]">
            {step.content}
          </p>
        </div>

        {/* Progress dots & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep
                    ? "w-6 bg-route"
                    : "w-1.5 bg-border hover:bg-muted/50"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="font-body text-small font-medium text-muted hover:text-ink px-2.5 py-1.5 rounded-sm hover:bg-border/30 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-route text-white font-body text-small font-medium rounded-sm px-4 py-1.5 hover:bg-route/90 shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Skip Demo Button in Bottom-Right Corner ── */}
      <button
        onClick={handleClose}
        id="tour-skip-bottom-btn"
        className="fixed bottom-6 right-6 z-50 bg-surface/95 backdrop-blur border border-border px-4 py-2 rounded-full font-body text-small text-muted hover:text-ink hover:border-route hover:shadow-hover transition-all duration-200 flex items-center gap-2 shadow-card group cursor-pointer active:scale-95"
      >
        <span>Skip Demo</span>
        <span className="text-xs text-muted group-hover:text-route transition-colors">✕</span>
      </button>
    </div>
  );
}
