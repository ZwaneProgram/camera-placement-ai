# 🔒 Security Camera Placement AI

Upload a photo of any room and let AI figure out the best spots to mount your CCTV cameras — then **see a photorealistic preview** of your actual room with the camera installed.

Built as a demo for a security-equipment store: it bridges the gap between *"where should I put cameras?"* and *"what will it look like?"* so customers can decide before they buy.

---

## ✨ What it does

1. **Upload a room photo** — drag & drop or click to browse.
2. **Find Best Camera Spots** — AI vision analyzes the room and drops **3 suggested positions** (numbered pins) right on your photo, each with a reason ("covers the entrance", "no blind spots", etc.).
3. **Pick & fine-tune** — tap a pin to select it, then **drag it** to nudge the exact spot you want.
4. **Generate** — AI renders a new version of *your* room with a realistic dome camera mounted at that location.
5. **Compare** — original vs. generated, side by side. Try other positions without re-uploading.

---

## 🛠️ Tech stack

| Layer | What |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Styling | Tailwind CSS 4 |
| AI gateway | [OpenRouter](https://openrouter.ai) (one key, many models) |
| Room analysis | `google/gemini-3.5-flash` (vision → camera positions as JSON) |
| Image generation | `google/gemini-2.5-flash-image` ("Nano Banana" — edits your real photo) |

---

## 🚀 Getting started

### 1. Prerequisites
- [Node.js](https://nodejs.org) 18+ installed
- An [OpenRouter API key](https://openrouter.ai/settings/keys) with some credit (image generation costs a few cents per render)

### 2. Install
```bash
git clone <your-repo-url>
cd security-demo
npm install
```

### 3. Add your API key
Create a file called **`.env.local`** in the project root:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```
> `.env.local` is gitignored — your key never gets committed.

### 4. Run
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**, upload a room photo, and hit **Find Best Camera Spots**.

---

## 📖 How to use (step by step)

1. **Drop in a photo** of the room you want to secure.
2. Click **Find Best Camera Spots** — wait a couple seconds for the AI to drop 3 pins.
3. **Tap a pin** → a panel explains why that spot is good.
4. (Optional) **Drag the pin** to the exact spot you'd actually mount the camera.
5. Click **Place Camera at Position X** → the AI generates your room with the camera installed.
6. Review the **side-by-side** result. Hit **← Try another position** to test a different pin, or **Open full image ↗** to view/save it.

---

## 💡 Notes & tips

- **Costs:** room analysis is fractions of a cent; each generated image is a few cents. Keep an eye on your OpenRouter balance.
- **Best photos:** well-lit, shows the ceiling line and corners — the AI places cameras near the ceiling.
- **One camera at a time:** the generator is tuned to add a single, realistic dome camera so the room stays recognizable.
- **No restart needed** after editing routes — Next.js hot-reloads. (Only restart if you change `.env.local`.)

---

## 📂 Project structure

```
app/
├── page.tsx              # Full UI: upload, pins, drag, results
├── api/
│   ├── analyze/route.ts  # Vision → 3 camera positions (JSON)
│   └── generate/route.ts # Renders the room with a camera placed
```

---

*Demo project — built to prove the AI placement concept before building a full security-equipment storefront around it.*
