---
name: product-motion-video
description: Build a 60-second motion-graphic product/brand video (showreel, promo, launch teaser, explainer) as a single self-contained HTML animation, optionally exported to MP4. Use whenever the user asks for a motion graphic, product video, showreel, promo reel, animated brand film, or "1 minute video" for a product, company, or idea, even if they don't say "skill". Token-efficient by design.
---

# Product Motion Video (60s)

## 0. Inputs (ask only for what's missing, one message, max 3 questions)
- TOPIC: product/idea (required)
- BRAND: URL or md file (optional) -> extract name, tagline, 3 benefits, colors, tone. One web_fetch max.
- STYLE REF: optional; infer 3 traits (pace, type, palette) in one line. No deep research.
If the user left `{placeholders}` unfilled, treat them as empty, state assumptions in one line, and build.

## 1. Plan (<=15 lines of thinking, no essays)
Palette (bg, ink, 1 accent, 1 secondary), 1 display font + 1 body font (system/Google Fonts w/ fallback), 8 scenes.

Default 60s structure (seconds):
1. 0-5 Hook: kinetic type, one bold claim
2. 5-13 Problem: glitch/tension, counters
3. 13-21 Reveal: logo/product morph in
4. 21-31 Feature 1-3: UI cards, icon pops, staggered
5. 31-41 Proof: animated chart/number count-ups
6. 41-49 Flow/how-it-works: line-draw path + nodes
7. 49-56 Montage: fast cuts, 0.4s beats, marquee text
8. 56-60 CTA: logo, tagline, URL, pulse

## 2. Build (one .html file, vanilla JS, zero deps, <=18KB)
Architecture, keep it tiny:
- 1920x1080 stage scaled to fit via CSS transform; all colors as CSS vars.
- Master timeline: `scenes=[{t0,t1,build(stage), update(p)}]` with `p` in 0..1 from a single rAF clock `t=(now-start)/1000`. No setTimeout chains.
- Helpers (write once, reuse): `ease(p)` (cubic/expo/back), `lerp`, `clamp`, `stagger(i,n,p)`, `type(el,text,p)`.
- Motion vocabulary (use >=6): kinetic typography, mask reveals, stroke-dashoffset line draws, count-ups, parallax layers, staggered cards, shape morph (SVG path via lerped d), glitch (clip-path slices), marquee, camera push-in (scale+translate on stage), screen wipes between scenes.
- Rules: overlap scene transitions by 0.4s; every element eases (never linear); max 2 simultaneous focal points; hold key text >=1.2s; animate transform/opacity only.
- Controls: play/pause (space), scrub bar, restart, `?t=SECONDS` seek param, `window.seek(t)` for export.
- Respect `prefers-reduced-motion` by not autoplaying the flashing glitch scene.
- Optional audio: WebAudio synthesized hits on scene cuts (off by default, mute toggle). Never external audio.

## 3. Deliver
- Publish via Artifact tool (publish) as the page; if no Artifact tool, create_file in /mnt/user-data/outputs + present_files.
- Reply: 2 sentences (what it is, assumptions). No scene-by-scene narration.

## 4. MP4 export (only if the user asks)
Playwright headless: for f in 0..1799 call `seek(f/30)`, screenshot 1920x1080 -> frames; `ffmpeg -framerate 30 -i f_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4`. If ffmpeg/playwright is missing, say so and give the user this recipe instead of retrying.

## 5. Token discipline
- Don't read other skills, don't preview-render, don't polish-pass unless asked.
- Reuse the same card/type layouts across scenes; vary motion, not markup.
- Write the file in ONE tool call. Edit with small str_replace edits for revisions, never rewrite.
- Cap research at 1 fetch + 1 search.
