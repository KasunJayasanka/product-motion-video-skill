---
name: saas-animation
description: Create a SaaS product animation in After Effects via Higgsfield, using the user's app screens and brand assets — feature highlights with smooth interface transitions, animated typography, and a final logo reveal, with text, UI elements, and keyframes kept editable. Use when the user asks for a SaaS/app promo animation, product UI walkthrough video, or runs /saas-animation.
---

# SaaS product animation (Higgsfield)

Use Higgsfield to run `/saas-animation`.

Create a SaaS product animation in After Effects using the user's app screens and brand assets. Highlight the key features with smooth interface transitions, animated typography, and a final logo reveal. Keep the text, interface elements, and keyframes editable.

## Inputs

- App screens (screenshots or exported UI frames)
- Brand assets (logo, colors, fonts)
- Reference media (e.g. Reference 1) — style/motion reference supplied by the user

## Steps

1. **Check the connection.** If the Higgsfield MCP server is not connected, ask the user to connect it using https://mcp.higgsfield.ai/mcp before continuing. Do not proceed until it is available.
2. **Load the recipe.** Call Higgsfield `get_preset_instructions` with `{ preset: "/saas-animation" }` and follow what it returns.
3. **Upload assets.** Upload app screens, brand assets, and reference media (`media_upload` → PUT → `media_confirm`, or `media_upload_widget` if files aren't readable locally).
4. **Build the animation** per the recipe:
   - Feature highlight sections with smooth interface transitions
   - Animated typography for feature callouts
   - Final logo reveal
5. **Keep it editable.** Text layers, interface elements, and keyframes must remain editable in After Effects (no flattened/pre-rendered text or UI).
6. **Deliver** the After Effects project plus a preview render, and summarize the scene list.
