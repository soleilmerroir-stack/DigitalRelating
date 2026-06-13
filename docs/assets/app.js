window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('artifacts');
  const viewer = document.getElementById('viewer');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const editArea = document.getElementById('editArea');
  const editFilename = document.getElementById('editFilename');
  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');
  const artifactCount = document.getElementById('artifactCount');

  function showStatus(text) {
    if (statusMessage) statusMessage.textContent = text;
  }

  function showError(text) {
    if (statusMessage) statusMessage.textContent = text;
    console.error(text);
  }

  function loadList() {
    listEl.innerHTML = '<li>Loading artifacts…</li>';
    fetch('artifacts/list.json')
      .then(r => {
        if (!r.ok) throw new Error('Could not load artifacts/list.json');
        return r.json();
      })
      .then(files => {
        listEl.innerHTML = '';
        if (!files.length) {
          listEl.innerHTML = '<li>No artifacts found. Upload one or add filenames to artifacts/list.json.</li>';
          artifactCount.textContent = '0';
          showStatus('No artifacts available yet. Upload or add one.');
          return;
        }
        artifactCount.textContent = String(files.length);
        files.forEach(f => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#';
          a.textContent = f;
          a.addEventListener('click', e => {
            e.preventDefault();
            viewer.src = `artifacts/${encodeURIComponent(f)}`;
            fetch(`artifacts/${encodeURIComponent(f)}`)
              .then(r => {
                if (!r.ok) throw new Error('Cannot load artifact text');
                return r.text();
              })
              .then(txt => {
                editFilename.textContent = f;
                editArea.value = txt;
                showStatus(`Editing ${f}`);
              })
              .catch(() => {
                editFilename.textContent = f + ' (preview only)';
                editArea.value = '';
                showStatus(`Previewing ${f} (edit disabled)`);
              });
          });
          li.appendChild(a);
          listEl.appendChild(li);
        });
        viewer.src = `artifacts/${encodeURIComponent(files[0])}`;
        showStatus('Artifacts loaded successfully. Click a file to preview and edit.');
      })
      .catch(err => {
        listEl.innerHTML = '<li>Unable to load artifacts. Use a web server or GitHub Pages to view this page.</li>';
        showError('Unable to load artifacts: ' + err.message);
      });
  }

  loadList();

  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return alert('Select a file to upload');
    const fd = new FormData();
    fd.append('file', file);
    fetch('/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          loadList();
          fileInput.value = '';
          alert('Uploaded: ' + res.filename);
        } else {
          showError(res.error || 'Upload failed. Is the Node server running?');
        }
      })
      .catch(err => showError('Upload failed: ' + err.message));
  });

  saveBtn.addEventListener('click', () => {
    const filename = editFilename.textContent;
    if (!filename || filename === '(select an artifact)') return alert('Select an artifact first');
    const content = editArea.value;
    fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content })
    })
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          alert('Saved');
          viewer.src = `artifacts/${encodeURIComponent(filename)}?t=${Date.now()}`;
          showStatus(`Saved ${filename}`);
        } else {
          showError(res.error || 'Save failed. Is the Node server running?');
        }
      })
      .catch(err => showError('Save failed: ' + err.message));
  });
});
