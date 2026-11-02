# Keyflow — Typing Studio

A lightweight, responsive typing-practice website built with plain HTML, CSS, and JavaScript. It deploys directly to GitHub Pages and has no runtime framework, backend, or build step.

## Features

- Parchment, ink, and champagne visual theme with a midnight dark mode
- Words, passages, and code practice modes
- 15, 30, 60, and 120 second sessions
- Timer starts with the first typed character
- Live WPM, accuracy, correct-character, and mistake counters
- Personal bests stored locally for each mode and duration
- Fresh prompts on page visits, resets, mode changes, and duration changes
- Escape shortcut to restart a session
- Responsive desktop and mobile layout
- Local-only settings and records; no analytics or account required

## Run locally

Open `index.html` in a modern browser, or serve the repository folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

An internet connection is only needed for optional Google Fonts. System-font fallbacks work offline.

## Automated tests

The browser tests use Playwright. They are development-only and are not included in the published site.

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npx playwright install chromium
npm test
```

The test suite checks page loading, mode and duration controls, typing and completion, early-finish timer state, theme persistence, keyboard restart, paste prevention, and mobile layout.

## Publish on GitHub Pages

This repository uses GitHub Actions for deployment.

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push changes to the `main` branch.
4. Open the **Actions** tab and wait for the validation and deployment workflow to finish.
5. Open the published URL shown in **Settings → Pages**.

For a project repository named `Keyflow`, the URL is typically:

`https://yashkgupta928-blip.github.io/Keyflow/`

## Update the live site

Commit changes to `main`. The workflow runs validation before deploying the updated static files. If an older version remains visible, refresh the page without cache (Ctrl + Shift + R).

## Privacy

Keyflow stores preferences and personal-best scores in the browser's local storage. It does not send typing content or scores to a server.
