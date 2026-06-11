window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('artifacts');
  const viewer = document.getElementById('viewer');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const editArea = document.getElementById('editArea');
  const editFilename = document.getElementById('editFilename');
  const saveBtn = document.getElementById('saveBtn');

  function showError(msg){ console.error(msg); }

  function loadList(){
    listEl.innerHTML = '';
    fetch('artifacts/list.json')
      .then(r => r.json())
      .then(files => {
        files.forEach(f => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#';
          a.textContent = f;
          a.addEventListener('click', e => {
            e.preventDefault();
            viewer.src = `artifacts/${encodeURIComponent(f)}`;
            // try to load text for editing
            fetch(`artifacts/${encodeURIComponent(f)}`)
              .then(r => r.text())
              .then(txt => {
                editFilename.textContent = f;
                editArea.value = txt;
              })
              .catch(() => { editFilename.textContent = f + ' (preview only)'; editArea.value = ''; });
          });
          li.appendChild(a);
          listEl.appendChild(li);
        });
        if (files.length) viewer.src = `artifacts/${encodeURIComponent(files[0])}`;
      })
      .catch(err => {
        listEl.innerHTML = '<li>Error loading artifacts/list.json</li>';
        console.error(err);
      });
  }

  loadList();

  // upload handler
  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return alert('Select a file to upload');
    const fd = new FormData(); fd.append('file', file);
    fetch('/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(res => {
        if (res.ok) { loadList(); fileInput.value = ''; alert('Uploaded: ' + res.filename); }
        else showError(res.error||'upload failed');
      })
      .catch(err => showError(err));
  });

  // save edits
  saveBtn.addEventListener('click', () => {
    const filename = editFilename.textContent;
    if (!filename || filename === '(select an artifact)') return alert('Select an artifact first');
    const content = editArea.value;
    fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, content }) })
      .then(r => r.json())
      .then(res => { if (res.ok) { alert('Saved'); viewer.src = `artifacts/${encodeURIComponent(filename)}?t=${Date.now()}` } else showError(res.error); })
      .catch(err => showError(err));
  });
});
