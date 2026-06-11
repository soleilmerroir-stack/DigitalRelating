const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const ROOT = __dirname;
const ARTIFACTS = path.join(ROOT, 'artifacts');

app.use(express.static(ROOT));
app.use(express.json({ limit: '2mb' }));

const storage = multer.diskStorage({
  destination: ARTIFACTS,
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const listPath = path.join(ARTIFACTS, 'list.json');
  fs.readFile(listPath, 'utf8', (err, data) => {
    let arr = [];
    if (!err) {
      try { arr = JSON.parse(data); } catch (e) { arr = []; }
    }
    if (!arr.includes(req.file.originalname)) arr.push(req.file.originalname);
    fs.writeFile(listPath, JSON.stringify(arr, null, 2), err2 => {
      if (err2) console.error(err2);
      res.json({ ok: true, filename: req.file.originalname });
    });
  });
});

app.post('/save', (req, res) => {
  const { filename, content } = req.body;
  if (!filename) return res.status(400).json({ error: 'missing filename' });
  const dest = path.join(ARTIFACTS, filename);
  fs.writeFile(dest, content || '', 'utf8', err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.listen(port, () => console.log(`Static-site server listening on http://localhost:${port}`));
