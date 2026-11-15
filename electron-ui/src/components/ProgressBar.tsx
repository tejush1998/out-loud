import { useRef, useState } from "react";

interface ProgressBarProps {
  chunkProgress: number;
  playProgress: number;
  stats: string;
  /** Seek to a fraction (0–1) of the bar. Omit to make the bar read-only. */
  onSeek?: (fraction: number) => void;
  /** Jump by a number of seconds from the playhead (arrow keys). */
  onSeekBy?: (deltaSeconds: number) => void;
}

const ARROW_STEP_SECONDS = 5;

export function ProgressBar({
  chunkProgress,
  playProgress,
  stats,
  onSeek,
  onSeekBy,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // While dragging, the green bar follows the pointer; the seek itself happens
  // on release so audio isn't rescheduled on every pointer move.
  const [dragPct, setDragPct] = useState<number | null>(null);

  const pctAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    // Only the generated (amber) part is reachable.
    return Math.max(0, Math.min(chunkProgress, pct));
  };

  const shownPct = dragPct ?? playProgress;

  return (
    <div className="mt-4">
      <div className="mb-2 text-center text-[11px] font-medium tabular-nums tracking-wide text-gray-400">
        {stats}
      </div>
      <div
        ref={trackRef}
        role={onSeek ? "slider" : undefined}
        aria-label={onSeek ? "Playback position" : undefined}
        aria-valuemin={onSeek ? 0 : undefined}
        aria-valuemax={onSeek ? 100 : undefined}
        aria-valuenow={onSeek ? Math.round(shownPct) : undefined}
        aria-valuetext={onSeek ? stats : undefined}
        tabIndex={onSeek ? 0 : undefined}
        className={`relative mb-2.5 h-2 overflow-hidden rounded-full bg-gray-800/80 shadow-inner ${
          onSeek
            ? "cursor-pointer touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40"
            : ""
        }`}
        onKeyDown={(e) => {
          if (!onSeek) return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            onSeekBy?.(e.key === "ArrowLeft" ? -ARROW_STEP_SECONDS : ARROW_STEP_SECONDS);
          } else if (e.key === "Home") {
            onSeek(0);
          } else if (e.key === "End") {
            // The player clamps this to the end of the generated audio.
            onSeek(1);
          } else {
            return;
          }
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          if (!onSeek || e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragPct(pctAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragPct === null) return;
          setDragPct(pctAt(e.clientX));
        }}
        onPointerUp={(e) => {
          if (dragPct === null || !onSeek) return;
          onSeek(pctAt(e.clientX) / 100);
          setDragPct(null);
        }}
        onPointerCancel={() => setDragPct(null)}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-amber-500/40 transition-all duration-150 ease-out"
          style={{ width: `${chunkProgress}%` }}
        />
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm shadow-emerald-500/30 ${
            dragPct === null ? "transition-all duration-150 ease-out" : ""
          }`}
          style={{ width: `${shownPct}%` }}
        />
      </div>
    </div>
  );
}
