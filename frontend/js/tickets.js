// ticket list page logic

const list = document.getElementById('ticket-list');
const sub = document.getElementById('subtitle');
const empty = document.getElementById('empty-state');
const searchEl = document.getElementById('search');
const filterEl = document.getElementById('filter');

let timer;

// so we don't spam the api on every keystroke
function onSearch() {
  clearTimeout(timer);
  timer = setTimeout(() => loadTickets(), 300);
}

function onFilter() {
  loadTickets();
}

searchEl.addEventListener('input', onSearch);
filterEl.addEventListener('change', onFilter);

document.addEventListener('DOMContentLoaded', () => {
  loadTickets();
});

function showSkeletons() {
  let html = '';
  for (let i = 0; i < 3; i++) {
    html += `
      <div class="card" style="padding: 20px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <div class="skeleton" style="height: 12px; width: 70px; margin-bottom: 10px;"></div>
            <div class="skeleton" style="height: 16px; width: 180px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 14px; width: 260px;"></div>
          </div>
          <div style="text-align: right;">
            <div class="skeleton" style="height: 24px; width: 72px; border-radius: 24px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 12px; width: 80px;"></div>
          </div>
        </div>
      </div>`;
  }
  list.innerHTML = html;
  empty.style.display = 'none';
}

async function loadTickets() {
  showSkeletons();

  try {
    let status = filterEl.value;
    let search = searchEl.value.trim();
    let tickets = await getTickets(status, search);

    if (!tickets.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      sub.textContent = '0 tickets';
      return;
    }

    empty.style.display = 'none';
    sub.textContent = tickets.length + ' ticket' + (tickets.length === 1 ? '' : 's');

    let html = '';
    tickets.forEach((t, i) => {
      let stagger = Math.min(i + 1, 8);
      let cls = statusClass(t.status);
      let label = statusLabel(t.status);
      let ago = timeAgo(t.created_at);

      html += `
        <a href="/ticket?id=${enc(t.ticket_id)}" class="card card-hover animate-in stagger-${stagger}" style="display: block; padding: 20px; margin-bottom: 12px; cursor: pointer;">
          <div class="ticket-card-inner" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; min-width: 0;">
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${enc(t.ticket_id)}</span>
              <p style="font-size: 15px; font-weight: 600; margin-top: 3px; color: var(--text-primary);">${enc(t.customer_name)}</p>
              <p style="font-size: 14px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${enc(t.subject)}</p>
            </div>
            <div class="ticket-card-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-left: 16px; flex-shrink: 0;">
              <span class="status-badge ${cls}">${label}</span>
              <span style="font-size: 12px; color: var(--text-muted);">${ago}</span>
            </div>
          </div>
        </a>`;
    });

    list.innerHTML = html;

  } catch (err) {
    list.innerHTML = `
      <div class="card animate-in" style="padding: 32px; text-align: center; color: var(--text-secondary);">
        <p>Failed to load tickets</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${err.message || 'unknown error'}</p>
      </div>`;
  }
}

function statusClass(s) {
  if (s === 'Open') return 'status-open';
  if (s === 'In Progress') return 'status-progress';
  if (s === 'Closed') return 'status-closed';
  return 'status-open';
}

function statusLabel(s) {
  // just return as-is since backend already gives us the right casing
  return s || 'Open';
}

function timeAgo(str) {
  if (str && !str.endsWith('Z')) {
    str = str.replace(' ', 'T') + 'Z';
  }
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
