# Static Artifacts Gallery

Drop HTML/JS files into the `artifacts/` folder and add their filenames to `artifacts/list.json` (an array of filenames).

To view locally:

Python 3:
```bash
cd static-site
python -m http.server 8000
# open http://localhost:8000
```

Node (serve):
```bash
npm install -g serve
cd static-site
serve -s .
```

To publish static-only (no upload/edit server): push this folder to a GitHub repo and enable GitHub Pages (use the `main` branch or `gh-pages` branch) from the repo settings, or deploy to any static host.

If you want upload and edit functionality, run the included Node server which serves the site and provides local endpoints to upload files and save edits:

Node server:
```bash
cd static-site
npm install
npm start
# open http://localhost:3000
```

Notes:
- GitHub Pages cannot run the Node server — uploads and edits require a server. For public upload/edit features, consider deploying the server to a VPS or a platform that supports Node (Heroku, Fly, Render) and secure it (authentication) before exposing uploads.
- The server saves uploads to `artifacts/` and appends filenames to `artifacts/list.json`.
