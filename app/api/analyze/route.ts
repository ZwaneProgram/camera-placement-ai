import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Security Camera Placement AI",
  },
});

const PROMPT = `Analyze this room photo. Identify exactly 3 possible positions to mount a dome CCTV camera on the wall near the ceiling.

Return ONLY raw JSON (no markdown, no code fences):
{
  "placements": [
    { "x": 15, "y": 10, "position": "Top-left corner above door", "reason": "Covers entrance and 70% of the room" },
    { "x": 85, "y": 8, "position": "Top-right corner", "reason": "Diagonal coverage eliminates blind spots" },
    { "x": 50, "y": 12, "position": "Center wall above window", "reason": "Monitors secondary entry points" }
  ]
}

Rules:
- x and y are percentages (0–100) from top-left of the image
- Place markers near ceiling level (y typically 5–20%) along walls
- Return exactly 3 options covering different coverage zones`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await client.chat.completions.create({
      model: "google/gemini-3.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: PROMPT },
        ],
      }],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = (response.choices[0]?.message?.content ?? "").trim();

    // Robust extraction: take the substring between the first { and last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const slice = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;

    let parsed: { placements?: unknown };
    try {
      parsed = JSON.parse(slice);
    } catch {
      console.error("analyze: failed to parse JSON. Raw response:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `Could not parse analysis. Model returned: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    if (!parsed.placements || !Array.isArray(parsed.placements)) {
      console.error("analyze: no placements array. Raw:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `No placements in response: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ placements: parsed.placements });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
