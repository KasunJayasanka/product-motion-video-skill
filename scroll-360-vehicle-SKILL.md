---
name: scroll-360-vehicle
description: Turn real photos of a vehicle or product into a photoreal 360° turnaround video (AI video prompt), then add it to a website as a scroll-scrubbed animation (frames on a canvas, pinned beside a list or timeline). Use when the user wants a "3D model", "360 view" or "rotating bus/car/product while scrolling" on a page.
---

# Scroll-scrubbed 360° vehicle from real photos

Proven on MRN Express (Next.js 15 static export, Tailwind): the coach turns as the 27-stop route list scrolls.

## 0. Pick the approach (don't repeat what failed)
- **Rejected by the user as "not realistic":** a procedural three.js model, and a box textured with the photos ("looks like 4 sides printed on a box"). Don't offer these as the realistic route.
- **What worked:** an AI-generated photoreal turnaround video from the client's photos → frames → scroll scrub. Real 3D isn't needed for a scroll effect.
- Claude can't generate photoreal video. Use Gemini/Veo (worked, free for the user), Kling, Runway or Higgsfield. Higgsfield free plan: about 10 credits; Kling 4.0 Flash 5 s ≈ 7.5 credits, Seedance 2.5 5 s ≈ 35. Always quote before spending and ask.

## 1. Video prompt (give this to the user)
Attach the photos as references; use the three-quarter front photo as the start frame.

```
A photorealistic 360-degree turntable orbit around a [vehicle], "[BRAND]" livery. The camera circles the stationary [vehicle] once at a constant, smooth speed, at eye level, keeping it centred and fully in frame the entire time.

The [vehicle] matches the reference images exactly: [body colour], [windows], [livery shapes and colours], [lettering and where it sits], [mirrors/lights/wheels], [rear details and logo].

Orbit order: front three-quarter, full front, opposite front three-quarter, full side, rear three-quarter, full rear, other side, ending back at the start so it loops.

Setting: clean, empty light-grey studio floor with a seamless white-to-pale-grey backdrop, soft studio lighting, a soft contact shadow. No people, no other vehicles, no buildings, no text overlays.

Style: high-end automotive commercial, sharp focus, realistic reflections, stable geometry, no warping or morphing, consistent shape and livery from every angle. 16:9, 24 fps, 8-10 seconds.
```
Negative prompt: `distorted text, misspelled logo, warped body, morphing, extra wheels, changing colours, camera shake, zoom, cuts, people, other vehicles, background buildings, blur`.

The user can't attach an MP4 in chat: ask them to put it in `~/Downloads` and find it with `ls -lt ~/Downloads/*.mp4`.

## 2. Check the video before using it
```bash
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of compact in.mp4
ffmpeg -v error -i in.mp4 -vf "fps=1.5,scale=480:-1,tile=4x4" -frames:v 1 sheet.jpg   # look at it
```
AI turnarounds often glitch (a ghosted second vehicle, morphing) somewhere. Zoom into suspect spans (`-ss 7.6 -t 1.6 -vf fps=8,...tile=4x4`) and **trim to the clean range**. MRN: clean 0–7.85 s (front 3/4 → front → side → rear), ghost at 7.9–9.0 s.

## 3. Frames
```bash
ffmpeg -t <CLEAN_END> -i in.mp4 -an -vf "fps=15,scale=960:-2" -c:v libwebp -quality 72 public/<dir>/f%03d.webp
ffmpeg -i public/<dir>/f001.webp -q:v 3 public/<dir>/poster.jpg
```
MRN: 118 frames ≈ 1.7 MB. On exFAT drives `du` over-reports; sum the real bytes with `stat -f %z`.

## 4. Component
Copy `scroll-360-vehicle-template.tsx` (next to this file in the repo) and set FRAME_COUNT, the path and the scroll-driver element id. It:
- starts loading frames via IntersectionObserver (rootMargin 400px), so first-load JS barely changes;
- maps the progress of the driver element (`#route-timeline`) to a frame index; draws the nearest loaded frame on a canvas in a rAF (never blank), with the poster `<img>` underneath;
- shows a thin brand progress bar. The user asked to **remove** the "Now passing <stop>" label and counter.

## 5. Layout that the user approved
Grid `lg:grid-cols-12`: intro col-span-4, list `lg:col-span-3 id="route-timeline"`, bus column:
```tsx
<div className="max-lg:contents lg:col-span-5">
  <div className="sticky top-0 z-10 order-first -mx-4 bg-background px-3 pt-2 pb-2 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-background after:to-transparent sm:mx-0 sm:px-0 lg:order-none lg:top-28 lg:bg-transparent lg:p-0 lg:after:hidden">
    <RouteBus360 />
  </div>
</div>
```
- `max-lg:contents` makes the sticky element a grid child on mobile, so it pins for the whole section. Inside its own grid cell it wouldn't pin.
- Mobile feedback, in order: centred pin with text behind it = "not user friendly"; pinned top with a solid band and a fade = good; large padding = "too large", so use full width, top-0 (the site header hides on scroll down) and small padding.

## 6. Verify (Playwright; install it in the scratchpad)
- Screenshots at 1440×900 and 393×852 at scroll fractions 0.02 / 0.35 / 0.65 / 1 of the list; check that `scrollWidth === innerWidth`.
- Don't run `next build` while `next dev` is running (it corrupts `.next`); stop dev, build, restart.
- Speed (offer, not yet built): a 480px mobile frame set, load every 8th frame first and then fill in, and a poster only when `navigator.connection.saveData` is on or the connection is 2G.

## 7. Ship
Branch, separate commits per change, PR via `gh`, the user merges. Commits pushed after a merge are lost: check `gh pr view N --json state` before pushing more, and cherry-pick onto a new branch if it's already merged. MRN deploys with `npm run deploy` (Firebase Hosting, `out/`); then curl the live page and one frame URL.
