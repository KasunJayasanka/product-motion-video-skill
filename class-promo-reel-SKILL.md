---
name: "class-promo-reel"
description: "Make a professional 30s 9:16 Facebook/Instagram Reel ad for a tuition class or course (teacher photo, class clip, website/LMS laptop walkthrough, schedule, hotline) in the premium navy + flame style, with beat-locked music. Use for class, teacher or institute promo videos."
---

# Class promo Reel (premium style, code-rendered)

One HTML page whose look is a pure function `render(t)`, filmed frame by frame with Playwright into ffmpeg, then muxed with a tempo-grid music track and light SFX. All text, numbers and UI stay exact. Proven on the Uva Wisdom "2027 A/L Revision – Combined Maths" ad (30 s, 1080×1920, 30 fps, ~1 min render).

## 0. Brief and house rules
- Collect: logo, teacher photo, class clip, desktop screenshots of website + LMS, class title, teacher name + qualifications, day/time, URL, hotline, tagline.
- **Class details first.** Experience/credentials ("30+ Years") go near the end, just before the end card.
- **Sinhala (or any non-English) copy: use only lines the user gave or approved.** Never invent a new line; ask first. Never show the fee unless asked.
- No gimmick themes (chalkboard, icon tiles, cartoon fingers) and no filler scenes: every scene must carry a class fact or real footage.
- Each text item on screen ≥ 1.2 s; side margins ≥ 70 px; headings centred.
- No zoompan on stills (it jitters); all motion comes from `render(t)`.

## 1. Look
- Background: `linear-gradient(170deg,#132a52,#0b1830 45%,#070f20)` + three blurred drifting blobs (blue `#2a57a8` .55, orange `#ff6a00` .20, red `#ff2a12` .12, blur 120px) + faint 115° line pattern + vignette + PNG grain at 50 %.
- Accent (only one): flame gradient `linear-gradient(90deg,#ff3a1a,#ff7a00 50%,#ffc400)` for kickers, key words, tiles, hotline pill.
- Type: Montserrat 900 headlines (tight tracking), 800 kickers (uppercase, letter-spacing 9px, 32px), Noto Sans Sinhala 800 for Sinhala.
- Glass panels: `linear-gradient(135deg,rgba(255,255,255,.11),rgba(255,255,255,.04))`, 1.5px border `rgba(255,255,255,.17)`, radius 30–47px.
- Persistent header: logo (118px) left + glass tag ("2027 A/L REVISION") right. Persistent footer bar (from 2.4 s until the end card): URL left, phone icon + hotline right.
- Transition: one skewed (-14°) flame-gradient panel sweeping left→right over ±0.3 s around each cut; scenes hard-switch underneath.
- Text entrances: masked slide-up or rise with quint ease-out; pills pop with a gentle back-ease (overshoot 1.4).

## 2. Scenes (100 BPM: beat 0.6 s, bar 2.4 s; every cut on a bar line or beat)
| Time | Scene | Content |
|---|---|---|
| 0–4.8 | Hero | Teacher cutout (≤1010px tall, bottom mask fade, soft blue glow), outlined ghost title behind, kicker → class title → line → teacher name |
| 4.8–9.6 | Schedule | Week strip with the class day as a flame tile, day text, big time (lands on beat 6.0), two glass chips |
| 9.6–14.4 | Class clip | Approved headline + real footage in a gradient-bordered rounded card (3D settle), name overlay bottom-left |
| 14.4–21.6 | Website/LMS | Laptop walkthrough (section 3) + four ticked feature chips popping on beats 16.2/17.4/18.6/19.8 |
| 21.6–25.2 | Credentials | Big count-up number, label, three glass rows sliding in from alternate sides |
| 25.2–30 | End card | Logo, tagline, title + teacher, CTA line, white URL pill with shine sweep, pulsing flame hotline pill (ring ripple), ≥1.5 s hold |

Footage: colour-balance the class clip first (reduce green cast, mild S-curve, +8 % saturation, light unsharp), then pre-extract JPG frames; for portrait cards use a 640×700 crop that pans to keep the teacher in frame.

## 3. Realistic website/LMS walkthrough
- **Laptop, not a phone.** Show the real desktop screenshots uncropped at 960px width inside a 960×600 screen (dark bezel 20px, silver base with notch, soft floor shadow, faint glare). Do not rebuild fake mobile pages from desktop crops.
- Browser bar: three dots + URL pill with padlock; URL text changes with the page.
- Cursor: normal arrow that switches to the hand within ~34px of a link; press-scale .86 on click; clicks on beats (15.6, 16.8, 18.0).
- After each click: 3px orange loading bar (~0.35 s), then a 0.15 s crossfade to the next page.
- Camera: keyframed zoom on the page inside the screen, max 1.3× toward the click target, back to 1× on load; clamp so no blank edge shows. Final step: zoom to the video player (~1.76×) and play real class frames inside it with a progress bar.
- Typical path: site "Join Online Class" → LMS dashboard class card → week list "Recording of …" → recording plays.

## 4. Music and SFX
- The rhythm must never break. Do **not** loop or splice a shorter track to length; users hear the joins.
- Preferred when credits allow: one Higgsfield `elevenlabs_music_v2` instrumental at the full ad length (0.064 credits/s; preflight with `get_cost`), then retime cuts to its detected beat grid. The workspace cannot download Higgsfield URLs: send the link and ask the user to re-upload the MP3. Image/video generation needs a paid Higgsfield plan.
- Otherwise compose on an exact grid: `pretty_midi` at 100 BPM → `fluidsynth` + `FluidR3_GM.sf2` at 48 kHz. Progression A–E–F#m–D, 12.5 bars: bars 0–1 guitar picking + light piano; 2–3 add kick/bass; 4–8 full groove with piano melody; 9–10 big chords; accent on 25.2; final chord at 26.4 ringing to a fade. Add light `aecho` reverb.
- Verify with `librosa.beat.beat_track`: beat gaps must stay within 0.59–0.61 s.
- SFX (numpy, 48 kHz, quiet): soft whoosh on each cut, small pop on chips/rows/pills, tiny tap on clicks. No bells or chimes.
- Mix: music + SFX at 0.5 → `amix normalize=0` → `loudnorm I=-14:TP=-1.5` → AAC 192k, video `-c:v copy`.

## 5. Build, check, deliver
1. Assets: transparent logo; teacher cutout with `rembg` (`isnet-general-use`), cropped to the figure.
2. Write `index.html` (scenes as absolutely positioned layers; helpers `p`, `L`, `oQ`, `ioC`, `oB`, `rise`, `mask`, `pop`, `key` for keyframes).
3. Screenshot 8–12 key times into a contact sheet and look at it; zoom into the laptop frame. Fix wrapping/overlaps before the full render.
4. Render: Playwright (`google-chrome`, viewport 1080×1920) → JPEG frames piped to `ffmpeg -c:v libx264 -crf 17 -pix_fmt yuv420p`; wait for swapped `<img>` frames to load before each screenshot.
5. Mux audio, check duration and a final frame strip, send the MP4 with a short scene table. Version filenames `_v2`, `_v3` on revisions. Say plainly that audio could not be listened to and which copy lines were reused.
