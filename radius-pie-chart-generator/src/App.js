import React, { useEffect, useMemo, useState } from "react";

export default function CircleIncrementsApp() {
  const [n, setN] = useState(10);

  // Toggle for random radius task
  const [showRadius, setShowRadius] = useState(false);

  // Radius tick index for the on-screen preview
  const [previewRadiusIndex, setPreviewRadiusIndex] = useState(0);

  const safeN = useMemo(() => {
    const parsed = Number(n);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(360, Math.floor(parsed)));
  }, [n]);

  // SVG geometry
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const tickLen = 12;
  const tickOvershoot = 6; // how far ticks extend past the circle
  const labelOffset = 18; // distance above the circle for 0° label

  const ticks = useMemo(() => {
    if (safeN <= 0) return [];
    const step = 360 / safeN;

    return Array.from({ length: safeN }, (_, i) => {
      const deg = i * step;
      const rad = ((deg - 90) * Math.PI) / 180; // first tick at 12 o'clock

      const x1 = cx + (r + tickOvershoot) * Math.cos(rad);
      const y1 = cy + (r + tickOvershoot) * Math.sin(rad);
      const x2 = cx + (r - tickLen) * Math.cos(rad);
      const y2 = cy + (r - tickLen) * Math.sin(rad);

      return { i, deg, rad, x1, y1, x2, y2 };
    });
  }, [safeN]);

  const stepDeg = safeN > 0 ? (360 / safeN).toFixed(4) : "—";

  // Reroll preview radius when enabled / when safeN changes
  useEffect(() => {
    if (!showRadius || safeN <= 0) return;
    setPreviewRadiusIndex(Math.floor(Math.random() * safeN));
  }, [showRadius, safeN]);

  // Compute a radius line endpoint for a given tick index
  const getRadiusLine = (tickIndex) => {
    if (safeN <= 0) return null;
    const step = 360 / safeN;
    const deg = tickIndex * step;
    const rad = ((deg - 90) * Math.PI) / 180;

    // End point slightly inside the circle edge so it prints cleanly
    const endX = cx + (r - 2) * Math.cos(rad);
    const endY = cy + (r - 2) * Math.sin(rad);

    return { x1: cx, y1: cy, x2: endX, y2: endY, deg };
  };

  // Generate unique random indices (best effort)
  const randomUniqueIndices = (count, maxExclusive) => {
    if (maxExclusive <= 0) return Array.from({ length: count }, () => 0);

    if (maxExclusive >= count) {
      const set = new Set();
      while (set.size < count)
        set.add(Math.floor(Math.random() * maxExclusive));
      return Array.from(set);
    }

    return Array.from({ length: count }, () =>
      Math.floor(Math.random() * maxExclusive)
    );
  };

  // Build SVG markup for export (so each cell can differ)
  const buildSvgMarkup = (radiusIndexOrNull) => {
    const radiusLine =
      showRadius && safeN > 0 && radiusIndexOrNull != null
        ? getRadiusLine(radiusIndexOrNull)
        : null;

    const tickLines = ticks
      .map(
        (t) => `
        <line
          x1="${t.x1}" y1="${t.y1}"
          x2="${t.x2}" y2="${t.y2}"
          stroke="#334155"
          stroke-width="2"
          stroke-linecap="round"
        />`
      )
      .join("");

    const radiusMarkup = radiusLine
      ? `
        <line
          x1="${radiusLine.x1}" y1="${radiusLine.y1}"
          x2="${radiusLine.x2}" y2="${radiusLine.y2}"
          stroke="#0f172a"
          stroke-width="3"
          stroke-linecap="round"
        />`
      : "";

    // ✅ 0° label in the EXPORTED SVG (self-contained styling)
    const zeroLabelMarkup = `
      <text
        x="${cx}"
        y="${cy - r - labelOffset}"
        text-anchor="middle"
        dy="0.35em"
        style="font: 600 12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; fill: #0f172a;"
      >
        0°
      </text>
    `;

    return `
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Circle with evenly spaced increments">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#0f172a" stroke-width="2" />
        ${zeroLabelMarkup}
        ${tickLines}
        ${radiusMarkup}
        <circle cx="${cx}" cy="${cy}" r="3" fill="#334155" />
      </svg>
    `;
  };

  const exportA4Pdf = () => {
    if (safeN <= 0) return;

    const exportIndices = showRadius
      ? randomUniqueIndices(6, safeN)
      : Array(6).fill(null);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Circle increments - A4 export</title>
  <style>
    :root {
      --pageW: 210mm;
      --pageH: 297mm;
      --margin: 8mm;
      --gap: 6mm;
      --captionSpace: 12mm;

      --usableW: calc(var(--pageW) - (2 * var(--margin)));
      --usableH: calc(var(--pageH) - (2 * var(--margin)) - var(--captionSpace));

      --cellW: calc((var(--usableW) - var(--gap)) / 2);
      --cellH: calc((var(--usableH) - (2 * var(--gap))) / 3);

      --cellSize: min(var(--cellW), var(--cellH));
    }

    @page { size: A4; margin: var(--margin); }
    html, body { height: 100%; }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .caption {
      height: var(--captionSpace);
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #0f172a;
      font-size: 10pt;
      line-height: 1.2;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--gap);
      align-items: center;
      justify-items: center;
    }

    .cell {
      width: var(--cellSize);
      height: var(--cellSize);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0;
    }

    .cell svg {
      width: 100%;
      height: 100%;
    }

    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="caption">
    <span>
      Increments: ${safeN} (step size: ${
      safeN > 0 ? (360 / safeN).toFixed(4) : "—"
    }°)
      ${showRadius ? " — Find the tick the radius points to" : ""}
    </span>
    <span style="color:#64748b; font-size:9pt;">Made by Ethan Craddock</span>
  </div>

  <div class="grid">
    ${exportIndices
      .map((idx) => `<div class="cell">${buildSvgMarkup(idx)}</div>`)
      .join("")}
  </div>

  <script>
    setTimeout(() => window.print(), 250);
  </script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // Preview radius line (optional)
  const previewRadiusLine =
    showRadius && safeN > 0 ? getRadiusLine(previewRadiusIndex) : null;

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Circle increments
              </h1>
              <p className="text-sm text-slate-600">
                Type a number (1–360). Ticks are evenly spaced around the
                circle.
              </p>
            </div>

            <div className="text-xs text-slate-500 sm:text-right">
              Made by Ethan Craddock
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="inc"
              >
                Increments (max 360)
              </label>
              <input
                id="inc"
                type="number"
                min={0}
                max={360}
                step={1}
                value={n}
                onChange={(e) =>
                  setN(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-44 rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <div className="text-xs text-slate-600">
                Step size: <span className="font-mono">{stepDeg}</span> degrees
              </div>

              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={showRadius}
                  onChange={(e) => setShowRadius(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Add random radius (task)
              </label>

              {showRadius && safeN > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewRadiusIndex(Math.floor(Math.random() * safeN))
                  }
                  className="mt-1 w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Shuffle radius (preview)
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <svg
                id="preview-svg"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-label="Circle with evenly spaced increments"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-slate-800"
                />

                {/* ✅ 0° label at top (preview) */}
                <text
                  x={cx}
                  y={cy - r - labelOffset}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="12"
                  fill="#0f172a"
                  fontWeight="600"
                >
                  0°
                </text>

                {ticks.map((t) => (
                  <line
                    key={t.i}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="text-slate-700"
                  />
                ))}

                {previewRadiusLine && (
                  <line
                    x1={previewRadiusLine.x1}
                    y1={previewRadiusLine.y1}
                    x2={previewRadiusLine.x2}
                    y2={previewRadiusLine.y2}
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    className="text-slate-900"
                  />
                )}

                <circle cx={cx} cy={cy} r={3} className="fill-slate-700" />
              </svg>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={exportA4Pdf}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 active:bg-slate-950"
              >
                Export A4 PDF (6 circles)
              </button>
              <div className="text-xs text-slate-600">
                Opens a print dialog → choose{" "}
                <span className="font-semibold">Save as PDF</span>.
              </div>
            </div>

            <div className="text-xs text-slate-600">
              Showing <span className="font-semibold">{safeN}</span> increment
              {safeN === 1 ? "" : "s"}.
              {showRadius && safeN > 0 && (
                <>
                  {" "}
                  (Preview radius tick index:{" "}
                  <span className="font-mono">{previewRadiusIndex}</span>)
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
            <li>
              If you enter <span className="font-mono">10</span>, the step size
              is <span className="font-mono">36°</span>.
            </li>
            <li>
              If you enter <span className="font-mono">3</span>, the step size
              is <span className="font-mono">120°</span>.
            </li>
            <li>
              Export uses your browser’s print dialog. Select{" "}
              <span className="font-semibold">Save as PDF</span> to create an A4
              PDF.
            </li>
            <li>
              If radius is enabled, the export page creates 6 circles with (as
              far as possible) different radius angles.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
