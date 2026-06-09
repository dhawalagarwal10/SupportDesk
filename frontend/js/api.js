// all requests go through here so we handle errors in one spot
const API = '/api';

async function request(path, opts = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.detail || 'something went wrong' };
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, message: 'network error - check your connection' };
  }
}

async function getTickets(status, search) {
  let p = new URLSearchParams();
  if (status) p.set('status', status);
  if (search) p.set('search', search);
  let q = p.toString();
  return request('/tickets' + (q ? '?' + q : ''));
}

async function getTicket(id) {
  return request('/tickets/' + id);
}

async function createTicket(data) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateTicket(id, data) {
  return request('/tickets/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
