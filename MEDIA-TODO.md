# Website media capture tasks

Follow-up captures for agely.app, collected during the 2026-07-07 site review.
All app captures come from the iOS repo's Marketing Media workflow
(`Agely/scripts/generate-marketing-media.sh`, fixed demo date **2026-07-05**,
1206x2622 output). Produce **light and dark** variants of every asset, and keep
any on-screen people/ages consistent with the seeded demo data (Maya Chen 8m,
Theo Brooks 11m, Avery Parker 1y 0m 0d, Eli Morgan 1y 2m, Harper Quinn 1y 8m,
Sofia Rivera 3y 1m, Noah Bennett / Isla Monroe 3y 6m, ...).

## Standing rule for all site videos

Every `<video>` on the site now sits on top of an identical still-frame
`<picture>` fallback (see the group-filtering block in `Website/index.html`).
For each video, export **the exact first frame** as its poster PNGs
(light + dark) so the fade between fallback and video is invisible. Record
sequences that **end on the same frame they start on** so the native loop has
no visible jump. Consider adding a poster-export step to
`generate-marketing-media.sh` so this stays automatic.

## 1. Ages tab — age-difference loop video (new)

Replaces the static `app-ages(.png/-dark.png)` screenshots in the "Every age,
always up to date." section (`Website/index.html`, Ages feature section).
This also fixes the hero and Ages section currently showing the same
screenshot.

Recording sequence (must loop seamlessly — first and last frames identical):
1. Start on the default Ages list, scrolled to the top.
2. Tap a contact to select/pin them, showing everyone else's age difference
   (how much older/younger they are).
3. Scroll down a bit, as if comparing a specific contact against the pinned
   contact (position that contact just below the pinned row).
4. Tap the pinned contact to deselect and return to the default ages view.
5. Scroll back to the very top so the final frame matches frame 1 exactly.

Integration notes: use the `phone-frame-video` + fallback-`picture` +
`data-controlled-loop` pattern from the group-filtering block. Export the
first frame as `app-ages-poster(.png/-dark.png)`. Update the Ages section
copy/alt text if the visible interaction changes what the bullets describe
(the third bullet already covers the age-difference tap).

## 2. Calculator screenshots — Input Date mode (retake)

Replaces `app-calculator.png` / `app-calculator-dark.png`.

The section headline asks "How old was everyone in that photo?", which is the
**Input Date** flow, but the current capture shows **Input Age** selected —
confusing. Retake with:
- the input selector set to **Input Date**
- the date set to an example date in the past (before 2026-07-05); pick one
  where the demo people show varied, believable past ages
- everything else matching the standard capture setup

## 3. Lock-screen birthday reminder notifications (new)

For the new "Stay on top of birthdays with helpful reminders." section
(`Website/index.html` — an HTML comment marks the media slot; convert the
section to the standard `split-section` layout when the asset lands).

Capture a phone lock screen with two stacked Agely notifications, shown as a
partial/cropped image (the `detail-frame` style in `styles.css` exists for
exactly this kind of zoomed crop):
- One reminder for today, e.g. Avery Parker turning 1 on July 5
  ("Avery Parker turns 1 today! 🥳" or whatever the app's real copy is).
- One advance reminder for another contact (e.g. Theo Brooks turning 1 in
  30 days) to show the "heads-up ahead of time" option.

Notes:
- Use the app's actual notification title/body format (check
  `UNLocalNotificationService` / notification content in the iOS repo) —
  don't invent copy the app never sends.
- The example "Eli Morgan turns 5 in 3 weeks" from the review notes does NOT
  match the demo data (Eli is 1y 2m); pick people/ages that match.
- Decide whether one theme-neutral capture is enough or light/dark variants
  are needed (lock screens usually read fine in both).

## 4. Group-filtering video — loop-clean re-export (retake/re-edit)

`group-filtering.mp4` / `group-filtering-dark.mp4` currently contain dead
frames: the content runs ~0.5s–11.05s of a 15.85s file. The site works around
this with `data-loop-start="0.5" data-loop-end="11.05"` on the video element.

When re-exporting:
- trim to the content window only
- make the first frame == last frame == poster (per the standing rule above)
- regenerate `group-filtering-poster(.png/-dark.png)` from the new first frame
- then delete the `data-loop-start` / `data-loop-end` attributes in
  `Website/index.html`

## Housekeeping

- `Website/assets/app-ages-detail.png` is unreferenced; delete it or fold it
  into a future capture batch.
- Bump the `?v=` cache keys on any replaced assets.
