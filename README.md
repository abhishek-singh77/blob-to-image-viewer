# Folder Image Viewer

Select a local folder (or multiple image files) and preview all images in a fast, responsive grid. Everything runs 100% in your browser—no uploads.

**Live demo:** [Folder Image Viewer](https://abhishek-singh77.github.io/blob-to-image-viewer/)

## Features

-   Folder selection (Chromium-based browsers) and multi-file selection fallback
-   Drag-and-drop files
-   Instant previews via object URLs, lazy-loaded thumbnails
-   Search by name or relative path
-   Zero build tooling, pure HTML/CSS/JS

## Handling unknown blob files

You can now select any file type. The app detects images even when the MIME type or extension is missing by:

-   Checking common image extensions
-   Inspecting magic bytes (PNG/JPG/GIF/WebP/BMP/AVIF)
-   Falling back to attempting an image decode in-memory

## Run locally

Just open `index.html` in your browser. No server required.

If you prefer a local server (optional), from this directory:

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

## Browser notes

-   Folder selection via `webkitdirectory` works best in Chrome/Edge/Brave. Safari/Firefox users: use "Or Select Images".
-   Files are never uploaded; previews use `URL.createObjectURL` and stay in memory until cleared.

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder as the repository root.
2. Ensure GitHub Pages is enabled to deploy from GitHub Actions:
    - Settings → Pages → Build and deployment → Source: GitHub Actions.
3. The provided workflow in `.github/workflows/pages.yml` will publish on every push to `main`.

### Initializing the repo (example)

```bash
git init
git add .
git commit -m "feat: initial folder image viewer"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

After the workflow completes, your site URL will appear under the Pages section (and in the workflow summary).

## License

MIT

# blob-to-image-viewer
