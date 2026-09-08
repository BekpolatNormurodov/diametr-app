import React from "react";

/* ─────────────────────────────────────────────────────────────────
   DiametrBarsLoader  ─  the 3 bars from the logo, animated
───────────────────────────────────────────────────────────────── */
function DiametrBarsLoader({ size = 44 }: { size?: number }) {
  const bar = (delay: string, height: string) => (
    <span
      style={{
        display: "inline-block",
        width: size / 8,
        height,
        borderRadius: size / 16,
        background: "linear-gradient(180deg,#6b7fff 0%,#465FFF 60%,#2e45e0 100%)",
        boxShadow: "0 0 8px 2px rgba(70,95,255,0.38)",
        transformOrigin: "bottom",
        animation: `dmbounce 1.1s ${delay} ease-in-out infinite`,
        marginLeft: size / 16,
      }}
    />
  );
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        height: size,
        gap: 0,
      }}
    >
      {bar("0s",    `${size * 0.82}px`)}
      {bar("0.18s", `${size * 0.50}px`)}
      {bar("0.36s", `${size * 0.65}px`)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Keyframe injection (once per document)
───────────────────────────────────────────────────────────────── */
const STYLE_ID = "__dm_loader_styles__";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const styleEl = document.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
@keyframes dmbounce {
  0%,100% { transform: scaleY(0.45); opacity:.55 }
  45%      { transform: scaleY(1.0);  opacity:1   }
}
@keyframes dmfadein {
  from { opacity:0; transform:translateY(8px) }
  to   { opacity:1; transform:translateY(0)   }
}
@keyframes dmshimmer {
  0%   { background-position: -600px 0 }
  100% { background-position:  600px 0 }
}
@keyframes dmpulsering {
  0%   { transform:scale(1);   opacity:.42 }
  60%  { transform:scale(1.22);opacity:.08 }
  100% { transform:scale(1.22);opacity:0   }
}
`;
  document.head.appendChild(styleEl);
}

/* ─────────────────────────────────────────────────────────────────
   LoadSpinner  (full-area centered)
───────────────────────────────────────────────────────────────── */
type LoadSpinnerProps = {
  message?: string;
  size?: number;
};

export function LoadSpinner({ message = "Yuklanmoqda...", size = 52 }: LoadSpinnerProps) {
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-6 select-none"
      style={{ animation: "dmfadein 0.45s ease both" }}
    >
      {/* Pulse ring behind bars */}
      <div className="relative flex items-center justify-center">
        <span
          style={{
            position: "absolute",
            width: size * 1.9,
            height: size * 1.9,
            borderRadius: "50%",
            border: "1.5px solid rgba(70,95,255,0.35)",
            animation: "dmpulsering 1.8s ease-out infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            width: size * 1.55,
            height: size * 1.55,
            borderRadius: "50%",
            border: "1px solid rgba(70,95,255,0.18)",
            animation: "dmpulsering 1.8s 0.4s ease-out infinite",
          }}
        />
        {/* Logo icon frame */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: size * 0.28,
            background: "linear-gradient(140deg,rgba(70,95,255,0.14) 0%,rgba(70,95,255,0.04) 100%)",
            border: "1.5px solid rgba(70,95,255,0.22)",
          }}
        >
          <DiametrBarsLoader size={size * 0.68} />
        </span>
      </div>

      {/* Label */}
      {message && (
        <p
          className="text-sm font-medium tracking-wide"
          style={{ color: "rgba(70,95,255,0.85)" }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SkeletonRow  ─  single shimmer row for table skeletons
───────────────────────────────────────────────────────────────── */
function SkeletonRow({ cols = 6 }: { cols?: number }) {
  const shimmer: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(90deg,rgba(0,0,0,0.06) 0px,rgba(0,0,0,0.12) 200px,rgba(0,0,0,0.06) 400px)",
    backgroundSize: "600px 100%",
    animation: "dmshimmer 1.4s linear infinite",
    borderRadius: 6,
    height: 14,
  };
  const darkShimmer: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(90deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.09) 200px,rgba(255,255,255,0.04) 400px)",
    backgroundSize: "600px 100%",
    animation: "dmshimmer 1.4s linear infinite",
    borderRadius: 6,
    height: 14,
  };
  const widths = [48, 100, 80, 96, 72, 88, 64, 110];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <span
            className="block dark:hidden"
            style={{ ...shimmer, width: widths[i % widths.length] }}
          />
          <span
            className="hidden dark:block"
            style={{ ...darkShimmer, width: widths[i % widths.length] }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SkeletonTable  ─  drop-in replacement while data loads
───────────────────────────────────────────────────────────────── */
export function SkeletonTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{ animation: "dmfadein 0.35s ease both" }}
    >
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <span
                  className="block dark:hidden"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg,rgba(0,0,0,0.08) 0px,rgba(0,0,0,0.15) 200px,rgba(0,0,0,0.08) 400px)",
                    backgroundSize: "600px 100%",
                    animation: "dmshimmer 1.4s 0.1s linear infinite",
                    borderRadius: 6,
                    height: 12,
                    width: 64,
                    display: "block",
                  }}
                />
                <span
                  className="hidden dark:block"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg,rgba(255,255,255,0.06) 0px,rgba(255,255,255,0.12) 200px,rgba(255,255,255,0.06) 400px)",
                    backgroundSize: "600px 100%",
                    animation: "dmshimmer 1.4s 0.1s linear infinite",
                    borderRadius: 6,
                    height: 12,
                    width: 64,
                    display: "block",
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}