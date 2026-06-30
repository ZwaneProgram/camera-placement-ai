"use client";

import { useState, useRef, useEffect } from "react";

type Placement = {
  x: number;
  y: number;
  position: string;
  reason: string;
};

const COLORS = ["#2563eb", "#16a34a", "#dc2626"];

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [placements, setPlacements] = useState<Placement[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag a pin: update its x/y based on pointer position within the photo box
  useEffect(() => {
    if (dragging === null) return;

    function move(clientX: number, clientY: number) {
      const el = photoRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.round(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)));
      const y = Math.round(Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100)));
      setPlacements((prev) => prev?.map((p, i) => (i === dragging ? { ...p, x, y } : p)) ?? null);
    }

    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }
    };
    const end = () => setDragging(null);

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", end);
    };
  }, [dragging]);

  function handleFile(f: File) {
    setFile(f);
    setPlacements(null);
    setSelected(null);
    setGeneratedImage(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setPlacements(null);
    setSelected(null);
    setGeneratedImage(null);

    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlacements(data.placements);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function generate() {
    if (!file || selected === null || !placements) return;
    setGenerating(true);
    setGenStatus("Adding camera to your room...");
    setError(null);
    setGeneratedImage(null);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("selectedPosition", placements[selected].position);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedImage(data.generatedImage);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
      setGenStatus("");
    }
  }

  const showPins = placements && !generating && !generatedImage;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Security Camera Placement AI</h1>
          <p className="text-gray-400 text-sm">Upload a room photo → pick a spot → AI places the camera</p>
        </div>

        {/* Upload / pin zone */}
        <div
          className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors mb-6"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !placements && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <div
              ref={photoRef}
              className="relative inline-block max-w-full select-none align-top"
              style={{ cursor: dragging !== null ? "grabbing" : "default" }}
            >
              <img
                src={preview}
                alt="Room"
                draggable={false}
                className="block max-h-80 w-auto max-w-full rounded-lg pointer-events-none"
              />

              {showPins && placements.map((p, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                  onMouseDown={(e) => { e.stopPropagation(); setSelected(i); setDragging(i); }}
                  onTouchStart={(e) => { e.stopPropagation(); setSelected(i); setDragging(i); }}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    background: COLORS[i],
                    boxShadow: selected === i
                      ? `0 0 0 3px white, 0 0 0 6px ${COLORS[i]}`
                      : "0 2px 10px rgba(0,0,0,0.7)",
                    transform: `translate(-50%, -50%) scale(${selected === i ? 1.15 : 1})`,
                    cursor: dragging === i ? "grabbing" : "grab",
                  }}
                  className="absolute w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-shadow z-10 touch-none"
                  title={p.position}
                >
                  {i + 1}
                </button>
              ))}

              {showPins && selected !== null && dragging === null && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                  Drag pin {selected + 1} to fine-tune
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="absolute top-2 right-2 bg-gray-900/70 hover:bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded-lg z-20"
              >
                Change photo
              </button>
            </div>
          ) : (
            <div className="text-gray-500 py-4">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-sm">Drag & drop your room photo here, or click to browse</p>
            </div>
          )}
        </div>

        {/* Pin detail */}
        {showPins && selected !== null && (
          <div
            className="rounded-xl p-4 mb-4 text-sm border transition-all"
            style={{ background: `${COLORS[selected]}18`, borderColor: `${COLORS[selected]}55` }}
          >
            <p className="font-semibold text-white mb-1">
              Position {selected + 1} — {placements[selected].position}
            </p>
            <p className="text-gray-300">{placements[selected].reason}</p>
          </div>
        )}

        {placements && !generatedImage && (
          <p className="text-center text-gray-500 text-xs mb-4">
            {selected === null
              ? "Tap a numbered pin to choose where to mount the camera"
              : `Position ${selected + 1} selected — hit Generate`}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mb-8">
          {file && !placements && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {analyzing
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⟳</span> Finding best spots...</span>
                : "Find Best Camera Spots"}
            </button>
          )}

          {placements && !generatedImage && (
            <>
              <button
                onClick={analyze}
                disabled={analyzing}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
              >
                Re-analyze
              </button>
              <button
                onClick={generate}
                disabled={generating || selected === null}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {generating
                  ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⟳</span>{genStatus || "Generating..."}</span>
                  : selected === null ? "Select a pin first" : `Place Camera at Position ${selected + 1}`}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {generatedImage && placements && selected !== null && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                  Original — Position {selected + 1} selected
                </p>
                <div className="relative inline-block max-w-full align-top">
                  <img src={preview!} alt="Original" className="block w-full h-auto rounded-xl" />
                  <div
                    style={{
                      left: `${placements[selected].x}%`,
                      top: `${placements[selected].y}%`,
                      background: COLORS[selected],
                      boxShadow: `0 0 0 3px white, 0 0 0 6px ${COLORS[selected]}`,
                    }}
                    className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  >
                    {selected + 1}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">AI Generated — With Camera</p>
                <img src={generatedImage} alt="Generated" className="block w-full rounded-xl object-cover" />
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Why this spot?</p>
              <p className="text-white text-sm font-medium">{placements[selected].position}</p>
              <p className="text-gray-400 text-xs mt-1">{placements[selected].reason}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGeneratedImage(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                ← Try another position
              </button>
              <a
                href={generatedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Open full image ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
