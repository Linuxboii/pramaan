# Pramaan

Resize a photo or signature to the exact size a form asks for.

**Live:** https://pramaan.avlokai.com

**For:** Students, job seekers and visa applicants stuck on "photo must be 200 x 230 px and 20 to 50 KB" upload rules.

## What it does

- Exact pixel size with crop, zoom and position controls
- Hits a KB range by searching JPEG quality, padding safely if a minimum is required
- Writes the DPI into the file for portals that check it
- Whitens the paper behind phone-shot signatures
- Presets for common photo and signature sizes

Nothing is uploaded. The image is processed on a canvas in your browser.

## Demand

About 28 lakh (2.8 million) people applied for SSC CGL 2025 alone, and each application needs a photo of 20 to 50 KB and a signature of 10 to 20 KB.

- [Careers360: SSC CGL 2025, 28 lakh registrations](https://news.careers360.com/ssc-cgl-2025-tier-1-93-percent-candidates-allotted-exam-centres-first-second-or-third-choice-city-slip-28-lakh-registrations)
- [Career Power: 28 lakh applied](https://www.careerpower.in/blog/28-lakhs-candidates-applied-for-ssc-cgl-2025-exam)
- [DocSet: SSC photo and signature size rules](https://docset.in/blog/ssc-cgl-photo-size-2026-guide)

These figures measure demand for the task, from existing tools. They are third-party estimates or company claims, not usage of this tool.

## Privacy

Everything runs in your browser. There is no backend, no analytics and no account. Nothing you enter is uploaded.

## Run locally

No build step and no runtime dependencies. Serve the folder with any static server:

```
npx serve .
```

## Tests

The logic lives in `lib.js` as pure functions, tested with the Node test runner (Node 20+):

```
npm test
```

## Files

- `index.html` page and styles
- `app.js` wiring between the page and the logic
- `lib.js` pure logic, no DOM
- `lib.test.js` tests
- `base.css`, `ui.js` shared look and small DOM helpers

## Licence

MIT. Made by [Sushanth Kasturi](https://sushanth.avlokai.com).
