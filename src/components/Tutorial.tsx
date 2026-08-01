import { useEffect, useState } from "react";

interface TutorialStep {
  title: string;
  body: string[];
}

const STEPS: TutorialStep[] = [
  {
    title: "Welcome to Forge",
    body: [
      "Forge lets you configure a simple product concept, apply a real-world load, and see whether it's likely to be strong enough, stiff enough, and affordable — before you ever build a physical prototype.",
      "This short walkthrough covers the four parts of the screen. It takes about a minute — skip it anytime.",
    ],
  },
  {
    title: "1 · Configure your part (left panel)",
    body: [
      "Pick an object type — mounting bracket, box enclosure, or cylinder/shaft.",
      "Set its size with a preset or the sliders, then choose a material (aluminum, steel, or PETG) and an applied force.",
    ],
  },
  {
    title: "2 · Watch it update in 3D (center)",
    body: [
      "The model updates live as you change shape, dimensions, or force.",
      "Its color reflects the verdict — green (pass), amber (warning), or red (fail). Drag to rotate, scroll to zoom.",
    ],
  },
  {
    title: "3 · Read the results (right panel)",
    body: [
      "See estimated mass, material cost, peak bending stress, deflection, and safety factor, plus a clear pass/warning/fail verdict with the reasoning behind it.",
      "Hover any \"?\" icon for a plain-language explanation of that number.",
    ],
  },
  {
    title: "4 · Compare an alternative",
    body: [
      "The \"Compare with an alternative\" box lets you try a different material or force side by side.",
      "It's fully independent — changing it never touches your current design or the 3D model above.",
    ],
  },
  {
    title: "You're ready",
    body: [
      "Try it now: the default bracket fails on stiffness even though it's strong enough. Switch its material to steel, or increase the thickness, and watch the verdict change.",
      "Reopen this walkthrough anytime with the \"? Tour\" button in the header.",
    ],
  },
];

const STORAGE_KEY = "forge-tutorial-seen";

export function shouldShowTutorialOnLoad(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-fatal, tutorial just reappears next visit.
  }
}

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  function close() {
    markTutorialSeen();
    onClose();
  }

  function next() {
    if (isLast) {
      close();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="tutorial-backdrop" role="presentation" onClick={close}>
      <div
        className="tutorial-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="tutorial-close" aria-label="Close walkthrough" onClick={close} type="button">
          ×
        </button>
        <p className="tutorial-step-count">
          {isFirst ? "Welcome" : `Step ${stepIndex} of ${STEPS.length - 1}`}
        </p>
        <h2 id="tutorial-title">{step.title}</h2>
        {step.body.map((paragraph, i) => (
          <p key={i} className="tutorial-body">
            {paragraph}
          </p>
        ))}
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tutorial-dot ${i === stepIndex ? "active" : ""}`} />
          ))}
        </div>
        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={close} type="button">
            Skip
          </button>
          <div className="tutorial-nav">
            {!isFirst && (
              <button className="tutorial-back" onClick={back} type="button">
                Back
              </button>
            )}
            <button className="tutorial-next" onClick={next} type="button">
              {isLast ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
