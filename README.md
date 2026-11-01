# Keyflow — Typing Studio

A polished, responsive typing-practice website built with plain HTML, CSS, and JavaScript. Designed to publish directly on GitHub Pages: no Node.js, framework, build command, account, or backend required.

## Features

- Premium parchment, ink, and champagne color theme with a midnight dark mode
- Words, passages, and code practice modes
- 15, 30, 60, and 120 second sessions
- Timer begins on the first typed character
- Live WPM, accuracy, correct-character, and mistake counters
- Personal bests stored locally for each mode and duration
- Fresh practice text on page visits, resets, mode changes, and timer changes
- Keyboard shortcuts: `Esc` starts a fresh session
- Responsive layout for desktop and mobile
- Local-only settings and personal records; no backend or analytics

## Run locally

Open `index.html` in a modern browser. An internet connection is only needed for the optional Google Fonts; the system-font fallbacks work offline.

## Publish on GitHub Pages

1. Create a GitHub repository, e.g. `keyflow-typing`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` directly into the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then select **Save**.
6. Wait for deployment and open the published link shown in Settings → Pages.

The site URL typically looks like `https://YOUR-USERNAME.github.io/keyflow-typing/`.

## Update the live site

Upload the changed files to the same repository and commit them. GitHub Pages redeploys from the selected branch automatically. Refresh the browser with `Ctrl + Shift + R` if you see a cached version.

## Files

- `index.html` — semantic layout and UI
- `style.css` — design system, light/dark themes, and responsive styling
- `script.js` — prompt generation, timer, scoring, theme, and local records
