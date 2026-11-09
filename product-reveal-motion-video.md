---
name: product-reveal-motion-video
description: Build a 30-90s product reveal or promo motion-graphics video (MP4, 1080p) from code, with sound effects and music locked to the on-screen animation. Use for showreels, launch videos, explainers.
---

# Product reveal / motion graphics video

Produces a polished MP4 using only Python (PIL + numpy + scipy) and ffmpeg. No After Effects, no browser. Proven on a 60 s, 7-scene, 1080p30 reel that rendered in about 4 minutes on 2 cores.

Load the `video-making` skill too if listed. Its render rules (one mp4 per scene, concat with `-c copy`, temp name then rename) are used below.

## 0. Before building

1. Fetch the brand or product reference (WebFetch) and pull out: name, tagline, 3-5 real selling points, real numbers/stats, CTA URL, schedule or price, colours and tone. Use only facts from the source. Never invent stats.
2. Check tools in one call: `ffmpeg`, `PIL`, `numpy`, `scipy`, Poppins/Inter fonts (`fc-list`), `raqm`. Fonts with no glyph (Sinhala, arrows, prime marks) render as tofu boxes, so use ASCII `'` for prime and draw arrows as polygons.
3. If the user is unattended or the brief is clear, don't ask questions. State the reading taken (duration, scenes, palette) in one sentence and go.

## 1. Storyboard (product reveal template)

Default 60 s at 120 BPM, so every scene boundary lands on a beat (1 beat = 0.5 s, 1 bar = 2 s):

| # | Scene | Dur | Job |
|---|-------|-----|-----|
| 1 | Genesis / logo sting | 6 | particles converge to a mark, shockwave, title lockup |
| 2 | Hero reveal | 8 | the product or core concept animating live (chart, UI, 3D-ish mock) with readout cards |
| 3 | Feature kinetic type | 8 | 4-5 big words slammed one per beat over a tilted marquee |
| 4 | Demo / how it works | 10 | two animated demonstrations (e.g. unit circle to sine wave, UI flow) |
| 5 | Proof | 10 | rolling-digit counters in progress rings + ticker |
| 6 | Method / steps | 10 | 3 cards activate in sequence with icon animations |
| 7 | Finale + CTA | 8 | feature checklist, device/window mock, big CTA button, fade to black |

Keep a `DURS` and `STARTS` list. All timing derives from them.

## 2. Visual engine (one file, `reel.py`)

- Draw at 2x supersample (3840x2160 canvas, `S=2`) with PIL `ImageDraw` in RGBA, then downscale to 1920x1080. Coordinates are in 1080p units and the helper multiplies by S.
- Scene function signature: `sceneN(t, T) -> (canvas, camera(z,px,py), hit)` where `t` is scene-local time and `T` is global time. Everything is a pure function of time, so frames can be rendered in any order and in parallel.
- Easing set: out3, out5, in3, in-out3, back, elastic. Use `reveal()` (text rising from a mask line), `text_grad()`, `glow()` (stacked low-alpha circles), `partial()` for stroke draw-on, `dashed()`, `arrow()`.
- Post chain in numpy: bloom (two downsampled blurred thresholds), chromatic aberration scaled by `hit` (a decaying impulse at each beat event), film grain (6 cached noise frames), slow camera push. Keep grain at or below sigma 2.2.
- Persistent HUD: timecode, progress bar with scene ticks. It also acts as a visual anchor for audio sync checks.
- Transitions: each scene draws an outgoing wipe (iris / bars / blinds / slant) and the next scene an incoming one, so scenes are self-contained and files can be concatenated with `-c copy`. Wipe window: `D-0.9 s` to `D`.
- Gotchas learned: `PIL.arc` with width needs round caps drawn manually. Don't draw zero-length lines with caps, which leaves stray dots. Skip anything with alpha below 0.004. Cache backgrounds and fonts.

### Testing before the full render (mandatory)

`python3 reel.py test 0:3.8 1:5.0 ...` renders chosen `scene:time` frames at full size into a contact sheet. Look at 3 sheets covering the busiest frames of every scene. Fix overlaps, tofu glyphs, text colliding with the HUD, and elements that never appear. Only then run the single full render.

### Full render

`multiprocessing.Pool(2)` over scenes, longest first. Each worker pipes raw RGB frames into ffmpeg (`libx264 -preset veryfast -crf 17 -g 30`) writing `sN_tmp.mp4`, renamed to `sN.mp4` only on exit code 0. Concat with `-f concat -c copy`. Verify 1800 frames at 30 fps for 60 s.

## 3. AUDIO: how to get sound that is actually synced and clean

The first version of this workflow failed on audio in two ways. Do NOT repeat it.

**What went wrong**
1. Audio and visuals were authored separately. The audio script had hand-typed times (`add(..., 44.6)`) that drifted from what the renderer actually did, so hits landed on nothing.
2. The mix was overloaded: pad + arp + bass + kick + clap + hats + risers + crashes + booms + bells + reverb on everything. Summed peak was about 2.7 (+8.7 dBFS), then `tanh` soft-clipped and normalised. That squashes everything into distortion, and the broadband noise layers (hats, risers, crashes, reverb tails) turn into hiss.
3. No verification. Nobody measured the result against the picture.

**The fix: single source of truth + gain staging + verification**

### 3a. The renderer emits a cue sheet

Every animated event writes one cue as it is defined. Use the same constants the animation uses, never retyped numbers.

```python
# cues.py (imported by reel.py and audio.py)
CUES = []   # (time_sec_global, kind, strength 0..1, pitch_hint)
def cue(T, kind, s=1.0, note=None): CUES.append((round(T, 4), kind, s, note))
```

In `reel.py`, next to the animation that uses the time constant:

```python
TK = 1.0 + k                       # word k slams in at scene-local TK
cue(STARTS[2] + TK + 0.2, 'slam', 0.9, note=SCALE[k])
```

The same constant drives both the `e_back(prog(t, TK, ...))` animation and the cue. Kinds to use: `impact` (shockwave, big reveal), `slam` (word/card lands), `whoosh` (wipe or fast move, cue at start), `tick` (each counter step, derive from the same easing curve), `chime` (checkmark, card activate), `riser` (cue at wipe start minus riser length), `cta`. Dump to `cues.json` at the end of the dry run (`python3 reel.py cues`), which needs no rendering, since time is a pure function.

### 3b. Snap cues to the grid

Choose tempo so scene boundaries and key beats fall on beats (120 BPM: boundary multiples of 0.5 s). In the animation, put hero moments on beats (`T % 0.5 == 0`) wherever the design allows. If a cue is within 60 ms of a beat, snap the *audio* to that beat. If the visual is clearly off-grid, leave the cue unsnapped and let the music duck instead of fighting it.

### 3c. Build audio from cues, with music subordinate to cues

`audio.py` reads `cues.json` and renders:
- **Music bed** (pad + sparse pluck arp + sub bass, 4-chord loop in one key). Music is quiet. Hits carry the sync.
- **Hits** from cues: `impact` = sub boom + short filtered noise crash; `slam` = low thump + clap, pitched bell on `note`; `whoosh` = band-passed noise swell **ending** on the visual event, i.e. start the sound `len` before the wipe peak; `tick` = short sine blip; `riser` = ends exactly on the next scene boundary.
- Pitched sounds take notes from the chord active at that moment, so everything is consonant.
- **Sidechain**: duck the music bed 4-6 dB on every cue (not only on kicks) with a 10 ms attack and 250 ms release. This is what makes the hits read as part of the picture.

### 3d. Anti-noise gain staging

- Max 4 concurrent layers at any moment. Drop hi-hat 16ths entirely in intro and outro. Use at most an 8th-note closed hat, high-passed at 8 kHz, at -24 dB relative to kick.
- Noise-based sounds (crash, riser, whoosh) get a lowpass at 9-10 kHz and a `HP 200 Hz`. Never full-band white noise. Crash tails at most 1.2 s.
- Reverb: one short plate-style IR (1.2 s, not 2.4 s), only on music and chimes at a 15-20 % wet send. Never reverb drums or booms, because that is what creates the "muddy" overmixed feel. High-pass the reverb return at 250 Hz.
- HP 30 Hz on the master to remove DC and sub rumble.
- **No `tanh` saturation of a 2.7-peak sum.** Mix each bus to a sensible level first (music peak about -14 dBFS, hits about -8 dBFS, sum about -3 dBFS) so nothing needs squashing. Then master with a look-ahead limiter: `ffmpeg -af "highpass=f=30,alimiter=limit=0.89:attack=5:release=60"`.
- Loudness target -16 LUFS integrated, true peak at or below -1.5 dBTP, via two-pass `loudnorm=I=-16:TP=-1.5:LRA=7` (measure, then apply with the measured values, `linear=true`). Never shrink to fit by normalising the clipped waveform.
- Fade in 0.3 s and out 1.2 s. Final scene fade-to-black coincides with the music tail.

### 3e. Verify sync and cleanliness (mandatory, before delivering)

1. **Onset check**: compute a spectral-flux onset list from the final wav (numpy STFT) and, for every `impact`/`slam` cue, assert that an onset exists within +/-40 ms. Print a table `cue time | nearest onset | delta ms`. Fix anything beyond 40 ms.
2. **Visual check**: extract the frame at each impact cue time with ffmpeg and confirm something visibly happens in that frame (shockwave ring, word landing). Compare with the frame 0.2 s earlier.
3. **Loudness check**: `ffmpeg -i out.wav -af ebur128=peak=true -f null -` gives integrated at about -16 LUFS, true peak at or below -1.5 dBTP, LRA 4-8 LU. Compute the crest factor and also confirm there is no sample clipping (`np.abs(x).max() < 0.95`).
4. **Noise check**: print the spectrum energy above 10 kHz in quiet gaps (should be at least 40 dB below the hit peaks). Listen-proxy: render a spectrogram PNG with `ffmpeg -lavfi showspectrumpic` and look for horizontal hiss bands.

Only deliver if checks 1-3 pass. State the measured numbers in the final message.

## 4. Final assembly

```bash
ffmpeg -y -i master_video.mp4 -i audio.wav -map 0:v -map 1:a \
  -c:v libx264 -preset medium -crf 22 -maxrate 16M -bufsize 32M -pix_fmt yuv420p \
  -profile:v high -movflags +faststart -c:a aac -b:a 192k -shortest final_tmp.mp4 && mv final_tmp.mp4 Name.mp4
```

If only the audio changes, mux with `-c:v copy` and do not re-render video. Send with SendUserFile (`display: render`). Final reply: one or two sentences on what the video is, plus the sync/loudness numbers. No step recap.

## 5. Product-reveal adaptation notes

- Hero reveal for a physical or software product: build the product as vector shapes (rounded rects, circles, strokes) and animate with draw-on, parallax layers, camera push, light sweep. Do not download or paste brand photos.
- Never imitate a real brand's logo or mascot. Use the user's own name and wordmark in plain type unless they supply the asset.
- Copy rules: headline of 2-5 words per scene, one proof point per scene, CTA in the last 8 s with the real URL.
- Put the HUD/timecode in a muted tone so it reads as showreel polish, not clutter. Remove it if the user wants a clean commercial cut.

## Checklist

- [ ] Brand facts pulled from source, nothing invented
- [ ] Storyboard with `DURS`/`STARTS` on the beat grid
- [ ] 3 contact sheets inspected before full render
- [ ] Cue sheet emitted by renderer; audio built from it
- [ ] Gain-staged mix, limiter, -16 LUFS, peak at or below -1.5 dBTP
- [ ] Onset-vs-cue table within 40 ms; loudness and noise checks printed
- [ ] 1080p30, frame count and duration verified, file sent
