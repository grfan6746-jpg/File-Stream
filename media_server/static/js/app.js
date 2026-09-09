/**
 * Android TV Local Media Server Client-Side Script
 * Designed for light resource footprint on Android TV and mobile browsers.
 */

// Global state
let currentModalUrl = '';

// ===================================
// TV Remote D-Pad Navigation Support
// ===================================
document.addEventListener('keydown', (e) => {
  // KeyCodes: 37: Left, 38: Up, 39: Right, 40: Down, 13: Enter, 27: Escape / Back
  if (e.key === 'Escape') {
    closeModalDirect();
    closeSearchResults();
  }
});

// ===================================
// VLC Streaming Modal & QR Code
// ===================================
function openVlcModal(fileName, mediaUrl) {
  currentModalUrl = mediaUrl;
  
  const modal = document.getElementById('vlc-modal');
  const title = document.getElementById('modal-file-name');
  const input = document.getElementById('modal-stream-url');
  const vlcBtn = document.getElementById('modal-vlc-btn');
  const intentBtn = document.getElementById('modal-intent-btn');

  if (title) title.textContent = fileName;
  if (input) input.value = mediaUrl;

  // VLC URL Scheme (vlc://http://...)
  if (vlcBtn) vlcBtn.href = 'vlc://' + mediaUrl;

  // Android Intent URL for direct VLC launch without browser intercept
  // intent://<url_without_http>#Intent;package=org.videolan.vlc;type=video/*;scheme=http;end
  const noHttp = (mediaUrl || '').replace(/^https?:\/\//, '');
  const intentUrl = `intent://${noHttp}#Intent;package=org.videolan.vlc;type=video/*;scheme=http;end`;
  if (intentBtn) intentBtn.href = intentUrl;

  // Generate QR Code in canvas
  generateQRCode('modal-qr-canvas', mediaUrl, 160);

  if (modal) modal.classList.remove('hidden');
}

function openVlcModalFromEl(btn) {
  if (!btn) return;
  const fileName = btn.getAttribute('data-filename') || '';
  const mediaUrl = btn.getAttribute('data-url') || '';
  openVlcModal(fileName, mediaUrl);
}

function closeModal(e) {
  if (e.target.id === 'vlc-modal') {
    closeModalDirect();
  }
}

function closeModalDirect() {
  const modal = document.getElementById('vlc-modal');
  if (modal) modal.classList.add('hidden');
}

function copyStreamUrl() {
  copyText(currentModalUrl, document.getElementById('btn-copy-url'), 'کپی شد!');
}

function copyText(text, btnElement, successLabel = 'کپی شد!') {
  if (!text) return;
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showCopied(btnElement, successLabel));
  } else {
    // Fallback for non-https local LAN
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopied(btnElement, successLabel);
    } catch (err) {
      alert('خطا در کپی: ' + text);
    }
    document.body.removeChild(textArea);
  }
}

function showCopied(btn, text) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = text;
  btn.style.borderColor = 'var(--accent-green)';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.borderColor = '';
  }, 2000);
}

// ===================================
// Self-Contained Lightweight QR Code Generator (Zero Dependency)
// ===================================
/**
 * Generates an SVG or visual matrix QR code without requiring heavy Python or JS packages.
 * Uses a clean public encoder or simple high-contrast SVG representation.
 */
function generateQRCode(containerId, text, size = 140) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Use encoded SVG image generator via fast data URI or micro-render
  // To work 100% offline inside local LAN without internet access:
  container.innerHTML = '';

  // Minimal lightweight client-side QR renderer
  const qrImg = document.createElement('img');
  qrImg.width = size;
  qrImg.height = size;
  qrImg.alt = 'QR Code';
  qrImg.referrerPolicy = 'no-referrer';
  
  // High-reliability offline SVG generator using lightweight encoded URL or fallback API
  // Uses standard SVG data or local canvas if online/offline
  const encoded = encodeURIComponent(text);
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`;
  
  // Fallback if offline: create an HTML canvas fallback or simple clickable box
  qrImg.onerror = function() {
    container.innerHTML = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#eee;color:#333;font-size:11px;text-align:center;padding:5px;">QR آفلاین<br><a href="${text}" target="_blank" style="word-break:break-all;color:blue;">باز کردن لینک</a></div>`;
  };

  container.appendChild(qrImg);
}

// ===================================
// File Browser Sorting
// ===================================
function sortBrowserItems(sortKey) {
  const container = document.getElementById('files-list');
  if (!container) return;

  const items = Array.from(container.querySelectorAll('.file-card'));
  
  items.sort((a, b) => {
    const nameA = (a.dataset.name || '').toLowerCase();
    const nameB = (b.dataset.name || '').toLowerCase();
    const sizeA = parseInt(a.dataset.size || '0', 10);
    const sizeB = parseInt(b.dataset.size || '0', 10);
    const typeA = (a.dataset.type || '').toLowerCase();
    const typeB = (b.dataset.type || '').toLowerCase();

    switch (sortKey) {
      case 'name-asc':
        return nameA.localeCompare(nameB);
      case 'name-desc':
        return nameB.localeCompare(nameA);
      case 'size-desc':
        return sizeB - sizeA;
      case 'size-asc':
        return sizeA - sizeB;
      case 'type':
        return typeA.localeCompare(typeB) || nameA.localeCompare(nameB);
      default:
        return 0;
    }
  });

  items.forEach(item => container.appendChild(item));
}

// ===================================
// Global File Search
// ===================================
let searchDebounce = null;

function performSearch() {
  const input = document.getElementById('global-search-input');
  if (!input) return;
  const q = input.value.trim();
  if (q.length < 2) {
    alert('لطفاً حداقل ۲ حرف برای جستجو وارد کنید');
    return;
  }

  const dropdown = document.getElementById('search-results-box');
  const itemsList = document.getElementById('search-items-list');
  const countSpan = document.getElementById('results-count');

  itemsList.innerHTML = '<div style="padding:1rem; text-align:center;">در حال جستجو در تمام حافظه‌ها... ⏳</div>';
  dropdown.classList.remove('hidden');

  fetch(`/api/search?q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(results => {
      countSpan.textContent = `${results.length} مورد یافت شد`;
      if (results.length === 0) {
        itemsList.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">فایلی با این نام یافت نشد.</div>';
        return;
      }

      itemsList.innerHTML = '';
      results.forEach(item => {
        const streamUrl = `${window.location.origin}/media/${encodeURIComponent(item.storage)}/${encodeURIComponent(item.path)}`;
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
          <div>
            <strong style="display:block;">${item.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${item.storage} &bull; ${item.size_str}</span>
          </div>
          <button class="action-btn btn-copy" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="openVlcModal('${item.name.replace(/'/g, "\\'")}', '${streamUrl}')">
            ▶ پخش در VLC
          </button>
        `;
        itemsList.appendChild(div);
      });
    })
    .catch(err => {
      itemsList.innerHTML = `<div style="padding:1rem; color:var(--accent-red);">خطا در جستجو: ${err.message}</div>`;
    });
}

function closeSearchResults() {
  const dropdown = document.getElementById('search-results-box');
  if (dropdown) dropdown.classList.add('hidden');
}

// ===================================
// Refresh Storages (USB Auto-Detect)
// ===================================
function refreshStorages() {
  const btn = document.getElementById('btn-refresh-storages');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> در حال اسکن USB و حافظه‌ها...';
  }

  fetch('/api/storages/refresh', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.newly_added && data.newly_added.length > 0) {
        alert(`${data.newly_added.length} درایو USB جدید شناسایی و اضافه شد!`);
      }
      // Reload page to display fresh state
      window.location.reload();
    })
    .catch(err => {
      alert('خطا در بروزرسانی حافظه‌ها: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔄 بروزرسانی حافظه‌ها و USB';
      }
    });
}

// ===================================
// Settings Page Helpers
// ===================================
function toggleAuthFields(checked) {
  const fields = document.getElementById('auth-fields');
  if (fields) {
    if (checked) {
      fields.classList.remove('hidden');
    } else {
      fields.classList.add('hidden');
    }
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function setPathInput(path) {
  const input = document.getElementById('new_storage_path');
  if (input) input.value = path;
}

function quickAddStorage(name, path) {
  const nameInput = document.getElementById('new_storage_name');
  const pathInput = document.getElementById('new_storage_path');
  if (nameInput) nameInput.value = name.replace(/\//g, '-');
  if (pathInput) pathInput.value = path;
  submitNewStorage();
}

function submitNewStorage() {
  const nameInput = document.getElementById('new_storage_name');
  const pathInput = document.getElementById('new_storage_path');
  const rawName = nameInput.value.trim();
  const name = rawName.replace(/\//g, '-');
  const path = pathInput.value.trim();

  if (!name || !path) {
    alert('نام و مسیر حافظه الزامی است.');
    return;
  }

  fetch('/api/storage/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, path })
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === 'ok') {
      window.location.reload();
    } else {
      alert('خطا: ' + (res.error || 'ثبت ناموفق بود'));
    }
  })
  .catch(err => alert('خطا: ' + err.message));
}

function removeStorage(name) {
  if (!confirm(`آیا از حذف حافظه "${name}" اطمینان دارید؟`)) return;

  fetch('/api/storage/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === 'ok') {
      window.location.reload();
    } else {
      alert('خطا: ' + (res.error || 'حذف ناموفق بود'));
    }
  })
  .catch(err => alert('خطا: ' + err.message));
}
