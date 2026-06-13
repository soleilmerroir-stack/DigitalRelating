# Static Artifacts Gallery

This folder contains your live artifacts gallery.

## View the gallery

The site must be served over HTTP or HTTPS. Opening `docs/index.html` directly from the file system (`file://`) will prevent the gallery from loading correctly.

### Local static preview

If you only want to preview the gallery and artifacts without upload/edit support, serve the folder with a simple web server. If you have Node installed:

```bash
cd docs
npx http-server . -p 8000
# open http://localhost:8000
```

If you have Python installed:

```bash
cd docs
python -m http.server 8000
# open http://localhost:8000
```

### GitHub Pages

If this repository is published with GitHub Pages using the `docs/` folder, the page will be available at:

`https://<your-username>.github.io/<your-repo>/`

## Upload and edit artifacts

The upload and edit features require the Node server in `docs/server.js`.

Start the server like this:

```bash
cd docs
npm install
npm start
# open http://localhost:3000
```

Then use the upload form and edit panel on the page.

> If Node is not installed, install it first or use GitHub Pages for static preview only.

## Troubleshooting

- If the gallery does not load, make sure the page is served via `http://` or `https://`, not `file://`.
- If upload/save does not work, the Node server must be running.
- If you only want a public site, publish the static files and do not expect upload/edit to work on GitHub Pages.
