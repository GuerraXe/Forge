import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

interface InfoTipProps {
  text: string;
}

const BUBBLE_WIDTH = 220;
const VIEWPORT_MARGIN = 10;
const ICON_GAP = 8;

/**
 * A small "?" bubble that shows a concise explanation on hover/focus.
 *
 * Renders via a portal into document.body with position computed from the
 * icon's actual bounding box, then clamped to the viewport. This is
 * deliberate: the app's left/right panels use `overflow-y: auto`, which per
 * the CSS spec forces `overflow-x` to compute as `auto` too — any
 * absolutely-positioned bubble living inside those panels gets silently
 * clipped at the panel's own edge, not just the window edge. Rendering to
 * body sidesteps that entirely.
 */
export default function InfoTip({ text }: InfoTipProps) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const [side, setSide] = useState<"top" | "bottom">("top");

  const show = () => {
    const el = iconRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2;
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - BUBBLE_WIDTH - VIEWPORT_MARGIN);

    const estimatedHeight = 100;
    const openUpward = rect.top - estimatedHeight - ICON_GAP > 0;
    setSide(openUpward ? "top" : "bottom");

    const arrowLeft = Math.min(
      Math.max(rect.left + rect.width / 2 - left, 14),
      BUBBLE_WIDTH - 14,
    );

    setStyle({
      left,
      top: openUpward ? rect.top - ICON_GAP : rect.bottom + ICON_GAP,
      width: BUBBLE_WIDTH,
      "--arrow-left": `${arrowLeft}px`,
    } as CSSProperties);
    setOpen(true);
  };

  const hide = () => setOpen(false);

  return (
    <span
      ref={iconRef}
      className="info-tip"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span className="info-tip-icon" aria-hidden="true">
        ?
      </span>
      <span className="sr-only">{text}</span>
      {open &&
        createPortal(
          <span className={`info-tip-bubble info-tip-bubble-${side}`} style={style} role="tooltip">
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
