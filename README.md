# Keyflow — Typing Practice

Keyflow is a responsive, browser-based typing practice website. It uses plain HTML, CSS, and JavaScript, with no build step, framework, account, or backend. It can be hosted directly on GitHub Pages.

## Features

- Timed tests: 15, 30, 60, and 120 seconds
- Practice modes: common words, original quotes, and code snippets
- Fresh randomized prompts on page visits, restarts, and every timer selection (including reselecting the active duration); the last prompt per mode is remembered locally to avoid immediate repeats
- Live words per minute (WPM), accuracy, correct-character, and mistake counters
- Personal best saved separately by mode and duration in your browser
- Light/dark theme toggle; selection and theme preferences are saved locally
- Keyboard controls, mobile-friendly input, responsive layout, and reduced-motion support
- No ads, analytics, external APIs, or server-side data collection

## Run locally

1. Download or extract this project.
2. Open `index.html` in a modern browser.

A local web server is optional. If you have Python installed, open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Sign in to GitHub and create a **new public repository** (for example, `keyflow-typing`).
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository's **root** directory. Do not upload the ZIP as the only file; GitHub Pages needs the site files themselves.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/(root)` folder, then click **Save**.
6. Wait for the deployment to finish. GitHub will show the published URL in **Settings → Pages**. It normally follows this format: `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

If you use a repository named `YOUR-USERNAME.github.io`, the URL is instead `https://YOUR-USERNAME.github.io/`.

## Keyboard controls

- Type the text displayed in the practice area to begin the timer.
- `Backspace` deletes the latest typed character.
- `Esc` resets the current test.
- Click the practice area to focus it.

## Notes

- Personal bests and preferences are stored in the browser's `localStorage` on that device/browser. They do not sync between devices.
- Google Fonts are used for the visual design. If they are unavailable, local system font fallbacks are used.
- This project is static and designed for GitHub Pages; no GitHub Actions workflow or server is required.
