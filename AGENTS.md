# AGENTS.md

## Agely task intake

- Route new actionable Agely requests through the registered project coordinator by default, including app, website, and release work. Questions may stay here; requested follow-up work follows this rule. Do not interrupt or forward an existing task again.
- Existing coordinators, assigned workers, and bounded coordinated runs continue their recorded roles, scope, and authorization. Verify actual chat/host identity and assignment; a self-declared worker role is insufficient.
- The human can opt out for a task: **Work on this independently in this chat.** Honor an explicit choice without asking again. When the coordinator is available and messaging is authorized, notify it once of the independent scope and checkout/branch/resource ownership to avoid overlap. Independent implementation uses a task-owned managed Git worktree and `codex/` branch, with normal approval, verification, commit, and integration requirements.
- Locate the primary checkout using Git's absolute common directory and worktree inventory. Read its ignored `Docs/Development/PlanArchive/ProjectCoordinator/registry.json`; linked worktrees share that registry. Require `schema_version: 1`, `status: "active"`, `coordinator` with actual `thread_id`/`host_id`, and `routing_authorization` with the human `thread_id`/`turn_id`/`user_message_id`. Keep identities and state local and ignored. Only human-authorized setup or the registered coordinator updates the registry.
- For an unassigned task, verify the destination and actual human routing authorization through supported native chat tools. Forward the request once with its source chat/turn/message references, relevant constraints, originating authorization references, and a stable intake ID derived from the source references. The coordinator owns tracking, prioritization, and dispatch. Do not implement the forwarded task here or create another coordinator.
- Verify delivery, report the coordinator chat link, and finish the intake turn. Delivery does not establish that execution started. Before retrying uncertain delivery, inspect the destination for the intake ID; the coordinator deduplicates that ID before adding or dispatching work. Respect native mode/tool restrictions and approval rejections.
- If the registry is absent, awaiting setup, invalid, or points to an unavailable/archived destination, or sending is blocked, preserve the request and explain why. Offer **Set up or resume the coordinator** or **Work independently here**, then wait for the human's choice before execution; reuse an explicit choice for this task. Do not silently execute independently, guess a destination from its title, or claim work is queued without a retained record.
- Routing authorization covers Agely intake handoffs and independent-work notices. It does not approve broader coordinator setup, worker-chat creation, implementation plans, publication, or account/permission changes. Preserve actual human decisions and approval gates.

## Planning handoff

Use `$save-plan` to save a finalized plan and `$execute-plan` in a fresh chat to implement it; turn off Plan mode before either.

## Git history and commit workflow

- Before beginning a new implementation task, inspect staged, unstaged, and untracked changes. If any exist, ask the user what to do with them before implementing; do not silently stash, discard, stage, or include them. Reuse the user's explicit disposition for those exact changes. A direct request to commit existing changes already authorizes that work.
- Unless the user explicitly says otherwise, commit verified changes locally as part of implementation without asking for separate commit permission. Do not push unless the user explicitly requests a push.
- Every implementation plan includes an ordered sequence of practical commits: each commit's purpose, scope, dependencies, and relevant verification. Routine boundary adjustments may preserve the approved scope and keep each commit functional; material scope changes still require human review.
- Group commits by behavior or purpose, with supporting tests, comments and documentation in the commit they support. Each commit must build and function independently. Use temporary source adjustments when needed to verify intermediate states. A single cohesive change may use one commit; do not force artificial splits or commit broken intermediate code.
- Verify each actual commit state before committing with checks appropriate to its change. Do not defer all verification until the final combined tree or create incomplete commits merely to make the checkout clean.
- Write clear outcome-focused titles and useful bodies explaining intent, rationale, tradeoffs, or a bug's root cause and solution. Report actual commit SHAs/titles and any remaining changes. Suggest messages only when the user requested that work remain uncommitted.

## Repository purpose

This repository contains the public static website for Agely at `https://agely.app`. The iOS app source is maintained in a separate private repository. Keep this repository limited to public website code, public assets, policy text, and deployment configuration.

These instructions apply to the entire repository.

## Repository layout

- `Website/` is the complete GitHub Pages artifact. There is no compile or bundling step.
- `Website/index.html` is the marketing home page.
- `Website/privacy/index.html` and `Website/support/index.html` are the policy and contact pages.
- `Website/404.html` is the custom not-found page.
- `Website/assets/styles.css` contains shared styles and responsive/dark-mode rules.
- `Website/assets/theme-init.js` applies the saved appearance before rendering to avoid a theme flash.
- `Website/assets/animations.js` owns appearance controls, menus, scroll effects, and marketing-video playback.
- `Website/assets/` also contains the public screenshots, poster frames, videos, and brand images.
- `.github/workflows/pages.yml` deploys only `Website/` when relevant changes reach `main`.

## Working locally

There are no package-manager dependencies and no generated files to commit. From the repository root, preview the exact published directory with:

```bash
python3 -m http.server 4173 --directory Website
```

Then visit `http://127.0.0.1:4173/`. Do not validate pages by opening the HTML files directly: the site intentionally uses root-relative URLs such as `/assets/styles.css` and `/privacy/`.

### Persistent private dev site

`./scripts/install-dev-site.sh` installs a launchd LaunchAgent that keeps `scripts/dev-server.sh` serving `Website/` at `http://127.0.0.1:4173/` across logins and reboots, so local review is always one bookmark away. The server binds to loopback only and is never exposed to the local network or the internet.

To review from an iPhone (or any other personal device) without making the dev site public, front the port with Tailscale: install and sign in to Tailscale on the Mac and the phone, run `tailscale serve --bg 4173` once on the Mac, and bookmark the printed `https://<mac>.<tailnet>.ts.net` address. Only devices signed into the same tailnet can reach it. `./scripts/install-dev-site.sh --uninstall` removes the LaunchAgent, and `tailscale serve --https=443 off` stops the tailnet sharing.

## Editing conventions

- Use semantic HTML, shared CSS, and dependency-free browser JavaScript. Do not introduce a framework, build system, or third-party runtime for a small change.
- Preserve the existing two-space indentation in HTML and CSS and the existing ES5-compatible JavaScript style (`var`, function declarations, semicolons, and the wrapping IIFE).
- Reuse existing components and CSS custom properties before adding one-off styles. Keep shared header, navigation, appearance controls, and footer markup consistent across all four HTML pages.
- Preserve accessibility behavior: meaningful headings, useful image alt text, decorative images with empty alt text, keyboard-operable controls, visible focus behavior, ARIA state updates, reduced-motion support, and adequate color contrast.
- Keep layouts usable at desktop and narrow mobile widths, including widths below 360 px. Check both light and dark appearances after visual changes.
- Keep the early, non-deferred `theme-init.js` in the document head. `animations.js` should remain deferred near the end of the body.
- Treat privacy and support copy as product/legal content. Do not casually change promises about data collection, analytics, iCloud, or contact addresses; ensure related statements remain consistent across pages.
- Keep canonical URLs, Open Graph/Twitter metadata, navigation links, and `aria-current` values accurate when page titles or routes change.

## Copy guidance

Consult this section whenever adding, changing, or reviewing user-facing wording, including page metadata and accessibility text.

### Voice and useful detail

- Write for someone discovering Agely for the first time, including someone who has not added a contact. Use plain, polished, friendly language with the clarity of traditional Apple apps.
- Explain concrete benefits and useful next steps. Keep marketing claims factual; keep navigation, controls, instructions, and policy text direct. Avoid developer jargon, forced casualness, vague hype, and overly clever labels.
- Prefer useful brevity over the shortest sentence. Explain a meaningful effect or consequence; omit obvious implications, repeated instructions, and details already visible in the next step.
- Describe what a control changes and where the effect appears. Refer to a visible control by its exact label. Explain both switch states only when that distinction helps.
- Review related wording together: headings and descriptions, labels and destinations, and any title/message/action combination. Use consistent patterns while allowing different contexts to need different words.

### Shared terminology

- Use **Agely**, **Ages**, **Upcoming**, **Calculator**, and **Settings** when naming the app and its tabs.
- Use **Touch and Hold** for the gesture label and *touch and hold* in instructions, rather than *long press*.
- Use **Default Tab** for the launch preference and **Group Filters** for the filter-settings destination. Use *group filter bar* in prose about the list control.
- Distinguish **Birthday Reminders** (notifications) from **Birthday Celebrations** (the in-app experience). Describe the latter as a **celebratory message**, rather than a birthday card or alert.
- Preserve context: **Add Contact** names an action, while **New Contact** can title an editor; **Manage Groups** names an entry action, while **Groups** can title its destination.
- Use **Apple Account**, **Contacts app**, **Settings app**, and **Third-Party Notices** when those concepts appear. Match app control labels exactly when explaining them.
- Keep **Feedback / Send Feedback** purpose-focused: bugs, confusing experiences, and ideas for improvement. Avoid promises of replies or reading every message, general-support categories, and unnecessary instructions or no-reply disclaimers. Privacy questions and requests remain distinct.

### Truthful claims and presentation

- Verify claims about saving, deletion, sync, permissions, data collection, and external actions against current behavior and policy. Opening an email app is a handoff, not confirmation that an email was sent or delivered. Do not imply rollback or completion without evidence.
- Keep stored app content, analytics/diagnostics, and voluntarily supplied feedback distinct. Confirm claimed legal or platform wording requirements with current primary sources; distinguish them from editorial recommendations. Preserve required disclosures and license bodies.
- For app-owned failure titles, Agely uses **Couldn’t…**. Use **Please try again.** only where retry helps; provide specific recovery for unavailable files, permissions, or destinations. Review the full title, message, and actions together without raw platform errors.
- Keep capitalization and punctuation consistent by component: title-style short control labels and app names; sentence-style explanatory prose with normal ending punctuation. Preserve exact visible labels in prose and established web-heading styles.
- Keep accessible names aligned with visible labels, make link destinations clear, and avoid redundant announcements. Check dynamic counts and dates, long names, wrapping, and truncation where relevant.

### Website review

- Check affected headings, calls to action, navigation, footer links, page titles, descriptions, Open Graph/Twitter metadata, image alternatives, and ARIA labels together. A visible rename does not by itself require a route change.
- Preserve the separate Feedback and privacy purposes across navigation, the contact page, and the policy. Do not silently add privacy promises or remove necessary disclosures to shorten a page.
- Follow the validation checklist below for user-facing changes, including narrow mobile widths and light/dark appearances. Record exact decisions and useful rationale in the change description; do not publish private app documentation or internal coordination history here.

## Assets and cache keys

- Use root-relative paths for published site resources and internal routes.
- App media is generated by the private iOS repository's Marketing Media workflow; do not hand-edit screenshots or recordings unless the task explicitly calls for it.
- Marketing media commonly has matched light and `-dark` variants. Update both variants and their poster frames together when the represented UI changes.
- When a referenced CSS, JavaScript, image, poster, or video file changes, bump its `?v=` cache key everywhere that file is referenced. Keep all references to the same revision synchronized.
- For themed images, preserve the `<picture>`/`source[data-theme-dark-source]` pattern. For themed videos, preserve the `data-light-*`, `data-dark-*`, poster, and fallback `<source>` relationships used by `animations.js`.
- Keep intrinsic `width` and `height` attributes accurate to avoid layout shift. Optimize large media before committing it.
- Preserve `Website/CNAME` and `Website/.nojekyll` unless the hosting configuration itself is intentionally changing.

## Validation checklist

For every change, perform the smallest relevant set of checks and report what was run:

1. Start the local server and load every affected route over HTTP.
2. Check the browser console for JavaScript, media, and 404 errors.
3. Test affected interactions with a mouse and keyboard, including Escape-to-close behavior where applicable.
4. Verify System, Light, and Dark appearance choices; also check reduced-motion behavior for animation or video changes.
5. Check a desktop viewport, a typical phone viewport, and a narrow viewport when layout or copy changes.
6. Confirm changed asset references exist and cache keys are consistent across the HTML files.
7. Review `git diff --check` and `git diff` before handing off.

There is currently no automated test suite. Visual and interaction checks against the locally served site are therefore required for user-facing changes.

## Deployment boundaries

- GitHub Pages deployment is defined in `.github/workflows/pages.yml`; do not change its permissions, artifact path, domain setup, or trigger scope without a deployment-specific reason.
- Do not deploy, change DNS, or modify GitHub Pages settings unless the user explicitly requests it.
- Never add private app source, credentials, signing material, user data, unpublished internal documentation, or private-repository URLs to this public repository.
