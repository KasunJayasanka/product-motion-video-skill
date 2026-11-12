---
name: "fb-motion-ad"
description: "Make a short (10–30s) Facebook/Instagram motion-graphics video ad plus matching thumbnail from a business's photos, logo and website, with music and synced SFX. Use when asked for a FB/IG video ad, promo reel or animated ad."
---

# Facebook motion-graphics ad (code-rendered)

Build the ad as one HTML page whose look at any moment is a pure function `render(t)`, film it frame by frame with Playwright, pipe the frames into ffmpeg, then mix in music and synthesized SFX. Text, phone numbers, URLs and UI stay exact (AI video models garble them).

## 0. Settle the brief
- Format: 1080×1350 (4:5 feed) by default; 1080×1920 for Reels/Stories. 30 fps.
- Scene list with times, brand colours (hex), fonts (Poppins Bold headlines + Inter UI works well), hotline, URL.
- Rules the user has asked for before and will likely want again:
  - every text item on screen ≥ 1.2 s; safe margins ~80 px sides
  - **all headings centered** (lists beside a phone may stay left-aligned)
  - official boards/signs (e.g. route board): **square corners, centered**, not restyled
  - don't paste a full brand livery as background; use **simple brand-colour curves** (pale band + thin accent lines) kept clear of text/key details
  - hotline badge: icon + label + number centered
  - no bell/chime/shimmer SFX; keep SFX to soft whooshes, impacts, pops, taps
- Don't invent prices, schedules or claims; booking-UI demos use neutral placeholder data.

## 1. Prepare assets (`assets/` → copy to `ad/`)
- Logo/wordmark on white → transparent: `a = 1 - min(rgb)`; unpremultiply colour. Recolour via CSS `mask-image` + background.
- Vehicle/product cutouts: `pip install --break-system-packages "rembg[cpu]"`, session `isnet-general-use`. Then make it **solid**:
  1. mask = alpha>40 → keep largest connected component → `binary_fill_holes` (tinted windows otherwise go see-through) → feather 1 px.
  2. Background structures touching the subject (arches, poles) survive this. Fix by zoomed inspection: render the cutout at 3–4× on a red background with a coordinate grid, read the true outline (e.g. top of roof AC cover, real rear edge), and cut with a supersampled polygon/rounded-corner mask. Restore small parts you clipped (mirror lamps) with `binary_closing` inside a box.
  3. Remove ground residue under the body: alpha=0 below the body line except inside tyre circles.
  4. Inspect each fix at full size before moving on; users notice edges.
- Enhance dull/dusty white bodies ("pearl white"): white-balance using the 85th percentile of near-neutral bright pixels → target (246,248,252); lift whites, mild S-curve, +35 % saturation on blue-dominant pixels only, pull near-white low-sat pixels toward clean neutral, UnsharpMask(1.6,70,2). Keep untouched originals in `orig/`.
- On white backgrounds add CSS `filter: drop-shadow(0 0 1.5px rgba(10,22,51,.28)) drop-shadow(0 6px 10px rgba(10,22,51,.12))` so the edge reads.
- Rotating wheels: crop the rim disc (r≈rim radius) around each hub centre into its own circular PNG and overlay it on the vehicle; rotate by `travel / tyreRadius`.
- Road: generated asphalt texture (vertical gradient 58→34 grey + blurred noise + sparse speckles), white far-edge line, white dashed lane in front of the vehicle, soft contact shadow, dashes scroll (camera-tracking) during the end hold.

## 2. Build `ad/index.html`
- `#stage` 1080×1350, one `.scene` div per scene, toggled by time. A skewed brand-gradient `#wipe` panel sweeps across ±0.2 s around each cut.
- Helpers: `p(t,a,b)` clamped progress, `L` lerp, easings `oC oQ oB(back) ioC`, `st(id,styles)`.
- Patterns that worked: kinetic "slam" text (scale 1.9→1 with back-ease + blur 8→0 + tiny screen shake); chips that pop with back-ease one by one; photo frames with clip-path reveal + Ken Burns; SVG curves drawn with `pathLength=1` + dashoffset; phone mockup with CSS 3D (`perspective`, rotateY/X) containing slide-in screens, a finger SVG and ripple; tap positions via `offsetLeft/Top` summed up to the screen (transform-free).
- Booking-flow demo: home (tap Book now) → date grid → seat map (selected seat turns brand blue) → secure payment (spinner) → check-mark + ticket; a numbered step list beside the phone activates in sync. Finish the confirmation ≥0.6 s before the scene cut.
- End card: logo + wordmark, 2-line headline, pulsing hotline pill (ring ripple), URL button with shine sweep, vehicle on road, ≥1.5 s hold.
- Serve over `python3 -m http.server` (CSS masks fail on file://).

## 3. Check frames before rendering
Screenshot 6–8 key times (busiest moments) into a contact sheet and look at it; zoom crops on cutout edges. Fix, then render once.

## 4. Render
```python
# Playwright → ffmpeg pipe (one encode, rename on success)
ff = Popen(['ffmpeg','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-',
            '-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p',tmp], stdin=PIPE)
for i in range(N): await pg.evaluate(f'render({i/30})'); ff.stdin.write(await pg.screenshot(type='jpeg',quality=92))
```
Run long renders in the foreground with a generous timeout (~2 min for 450 frames).

## 5. Audio
- Music: Higgsfield `generate_audio` with `elevenlabs_music_v2_5`, `force_instrumental:true`, duration = ad length, prompt with BPM, mood, local percussion accent, "hit at start, build before final scene, ending sting" (~2 credits; preflight with `get_cost`). The workspace usually **cannot download** the result URL (CDN not allowlisted): send the user the link, ask them to download and upload the MP3. Don't substitute synthesized music — the user disliked it.
- SFX: synthesize with numpy at 48 kHz from an event list taken from the animation timeline: filtered-noise whooshes with stereo sweep (wipes, vehicle pass), low sine-drop impacts (slams), short pitch-drop pops (chips/pills), tiny clicks (phone taps). No bells.
- Mix: `[music]atrim=0:DUR,afade out last 0.9s` + `[sfx]volume=0.45` → `amix normalize=0` → `loudnorm I=-14:TP=-1.5` → AAC 192k, `-c:v copy`.

## 6. Thumbnail
A static `thumb.html` at the same size reusing the assets: name tag, big route/offer headline, pill, official board, hero vehicle on the road, hotline + URL pills on the road. Screenshot → JPG q95. Send with SendUserFile (`display: render`).

## 7. Deliver
Send the MP4 (and thumbnail) with SendUserFile; version filenames `_v2`, `_v3`… on each revision. Summarize changes briefly and name any limitation (low-res logo, missing photos).

## Iterating
Keep `ad/index.html`, `tools/render.py`, `tools/sfx.py` and the mux command; most revisions are one edit + re-render + re-mux. Re-render only after checking the changed frame(s).
