// ticket detail page logic

const params = new URLSearchParams(window.location.search);
const ticketId = params.get('id');

const loading = document.getElementById('loading');
const notFound = document.getElementById('not-found');
const detail = document.getElementById('detail');
const statusSelect = document.getElementById('status-select');
const statusBtn = document.getElementById('status-btn');
const noteInput = document.getElementById('note-input');
const noteBtn = document.getElementById('note-btn');
const notesList = document.getElementById('notes-list');
const notesCount = document.getElementById('notes-count');

let ticket = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!ticketId) {
    showNotFound();
    return;
  }
  loadTicket();
});

async function loadTicket() {
  loading.style.display = 'block';
  detail.style.display = 'none';
  notFound.style.display = 'none';

  try {
    ticket = await getTicket(ticketId);
    renderTicket();
  } catch (err) {
    if (err.status === 404) {
      showNotFound();
    } else {
      showNotFound();
    }
  }
}

function showNotFound() {
  loading.style.display = 'none';
  detail.style.display = 'none';
  notFound.style.display = 'block';
}

function renderTicket() {
  loading.style.display = 'none';
  notFound.style.display = 'none';
  detail.style.display = 'block';

  document.title = ticket.ticket_id + ' - SupportDesk';

  document.getElementById('t-id').textContent = ticket.ticket_id;
  document.getElementById('t-subject').textContent = ticket.subject;
  document.getElementById('t-name').textContent = ticket.customer_name;
  document.getElementById('t-email').textContent = ticket.customer_email;
  document.getElementById('t-desc').textContent = ticket.description;
  document.getElementById('t-created').textContent = timeAgo(ticket.created_at);
  document.getElementById('t-updated').textContent = timeAgo(ticket.updated_at);

  // status badge
  let badge = document.getElementById('t-status');
  badge.textContent = statusLabel(ticket.status);
  badge.className = 'status-badge ' + statusClass(ticket.status);

  // pre-select current status in dropdown
  statusSelect.value = ticket.status;

  renderNotes();
}

function renderNotes() {
  let notes = ticket.notes || [];
  notesCount.textContent = notes.length + ' note' + (notes.length === 1 ? '' : 's');

  if (!notes.length) {
    notesList.innerHTML = `
      <p style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 20px 0;">
        No notes yet. Add one below.
      </p>`;
    return;
  }

  let html = '';
  notes.forEach((n, i) => {
    let ago = timeAgo(n.created_at || n.timestamp);
      html += `
      <div class="note-item animate-in stagger-${Math.min(i + 1, 8)}">
        <p style="font-size: 14px; color: var(--text-primary); line-height: 1.6; white-space: pre-wrap;">${enc(n.note_text)}</p>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">${ago}</p>
      </div>`;
  });

  notesList.innerHTML = html;
}

// update status handler
statusBtn.addEventListener('click', async () => {
  let newStatus = statusSelect.value;
  if (newStatus === ticket.status) {
    showToast('Status is already set to ' + statusLabel(newStatus), 'info');
    return;
  }

  statusBtn.disabled = true;
  statusBtn.textContent = 'Updating...';

  try {
    await updateTicket(ticketId, { status: newStatus });
    showToast('Status updated to ' + statusLabel(newStatus), 'success');
    await loadTicket();
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
  }

  statusBtn.disabled = false;
  statusBtn.textContent = 'Update Status';
});

// add note handler
noteBtn.addEventListener('click', async () => {
  let txt = noteInput.value.trim();
  if (!txt) {
    showToast('Please write something first', 'error');
    return;
  }

  noteBtn.disabled = true;
  noteBtn.textContent = 'Adding...';

  try {
    await updateTicket(ticketId, { notes: txt });
    showToast('Note added', 'success');
    noteInput.value = '';
    await loadTicket();
  } catch (err) {
    showToast(err.message || 'Failed to add note', 'error');
  }

  noteBtn.disabled = false;
  noteBtn.textContent = 'Add Note';
});

function statusClass(s) {
  if (s === 'Open') return 'status-open';
  if (s === 'In Progress') return 'status-progress';
  if (s === 'Closed') return 'status-closed';
  return 'status-open';
}

function statusLabel(s) {
  return s || 'Open';
}

function timeAgo(str) {
  if (!str) return '-';
  let now = new Date();
  let d = new Date(str);
  let diff = Math.floor((now - d) / 1000);

  if (diff < 60) return 'just now';
  let mins = Math.floor(diff / 60);
  if (mins < 60) return mins + 'm ago';
  let hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  let days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return days + 'd ago';
  let weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks + 'w ago';
  return d.toLocaleDateString();
}

// basic html escaping
function enc(s) {
  if (!s) return '';
  let el = document.createElement('span');
  el.textContent = s;
  return el.innerHTML;
}

function showToast(msg, type) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  let el = document.createElement('div');
  el.className = 'toast toast-' + (type || 'info');

  let icon = '';
  if (type === 'success') {
    icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else {
    icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  el.innerHTML = icon + '<span>' + msg + '</span>';
  container.appendChild(el);

  // auto-dismiss after 3s
  setTimeout(() => {
    el.classList.add('toast-exit');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
