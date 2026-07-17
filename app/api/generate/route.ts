import { NextRequest, NextResponse } from "next/server";

const OR_KEY = process.env.OPENROUTER_API_KEY!;
const OR_HEADERS = {
  Authorization: `Bearer ${OR_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "http://localhost:3000",
  "X-Title": "Security Camera Placement AI",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const selectedPosition = formData.get("selectedPosition") as string;
    // Optional: a clean product reference shot (2nd product image, plain bg) so
    // the AI composites the exact camera model instead of a generic dome.
    const productImageUrl = (formData.get("productImageUrl") as string) || null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const imagePrompt = productImageUrl
      ? `You are EDITING the FIRST image (a room photo), not creating a new image. The SECOND image shows the exact CCTV camera product to add. ` +
        `Return the FIRST image EXACTLY as-is — identical room, furniture, layout, wall positions, colors, lighting, and camera angle — with only ONE change: mount one copy of the camera from the SECOND image on the wall or ceiling near ${selectedPosition}. ` +
        `The added camera must be clearly visible and in focus, at a realistic real-world size (about the size of an actual CCTV camera — not tiny), matching the shape and color of the product in the second image, with shadows and lighting consistent with the room. ` +
        `Do NOT redraw, re-render, mirror, restyle, rearrange, or change the room or its perspective in any way. Composite only the single camera into the existing photo. Photorealistic.`
      : `You are EDITING this room photo, not creating a new image. Add exactly 1 realistic white dome CCTV security camera mounted on the wall or ceiling near ${selectedPosition}. ` +
        `The camera must be clearly visible, in focus, and at a realistic real-world size. Keep EVERYTHING else completely identical — same furniture, floor, walls, colors, lighting, shadows, and perspective. Do NOT re-render or change the room. Only add the single camera. Photorealistic result.`;

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      { type: "text", text: imagePrompt },
      { type: "image_url", image_url: { url: dataUrl } }, // room photo (first)
    ];
    // The product reference goes second so the prompt's "SECOND image" lines up.
    if (productImageUrl) {
      content.push({ type: "image_url", image_url: { url: productImageUrl } });
    }

    // Gemini "Nano Banana" returns images via the CHAT endpoint in message.images[],
    // NOT the /images endpoint. Request the image modality explicitly.
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Image generation failed (${res.status}): ${text.slice(0, 400)}` },
        { status: 500 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `API returned non-JSON (${text.length} chars): ${text.slice(0, 300)}` },
        { status: 500 }
      );
    }

    // Extract generated image from message.images[].image_url.url (Gemini's format)
    const j = json as {
      choices?: Array<{
        message?: {
          images?: Array<{ image_url?: { url?: string }; type?: string }>;
          content?: string;
        };
      }>;
    };
    const msg = j?.choices?.[0]?.message;
    let generatedImage = msg?.images?.[0]?.image_url?.url;

    // Fallback: some responses embed a data URL inside the text content
    if (!generatedImage && msg?.content) {
      const m = msg.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (m) generatedImage = m[0];
    }

    if (!generatedImage) {
      console.error("No image in Gemini response:", text.slice(0, 800));
      return NextResponse.json(
        { error: `No image returned. Response preview: ${text.slice(0, 300)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ generatedImage });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
