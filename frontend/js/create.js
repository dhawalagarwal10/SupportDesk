// create ticket form logic

const form = document.getElementById('ticket-form');
const btn = document.getElementById('submit-btn');
const errBox = document.getElementById('form-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  let name = document.getElementById('name').value.trim();
  let email = document.getElementById('email').value.trim();
  let subject = document.getElementById('subject').value.trim();
  let desc = document.getElementById('desc').value.trim();

  // basic validation
  if (!name || !email || !subject || !desc) {
    showError('Please fill in all fields.');
    return;
  }

  if (!email.includes('@')) {
    showError('Please enter a valid email address.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    await createTicket({
      customer_name: name,
      customer_email: email,
      subject: subject,
      description: desc
    });

    showToast('Ticket created successfully!', 'success');

    // short delay so the user sees the toast
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);

  } catch (err) {
    showError(err.message || 'Failed to create ticket. Try again.');
    btn.disabled = false;
    btn.textContent = 'Create Ticket';
  }
});

function showError(msg) {
  errBox.textContent = msg;
  errBox.style.display = 'block';
}

function hideError() {
  errBox.style.display = 'none';
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

  // little icon based on type
  let icon = type === 'success'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

  el.innerHTML = icon + '<span>' + msg + '</span>';
  container.appendChild(el);

  // auto-dismiss after 3s
  setTimeout(() => {
    el.classList.add('toast-exit');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
