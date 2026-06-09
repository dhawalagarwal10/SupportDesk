import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'supportdesk.db')

VALID_STATUSES = ('Open', 'In Progress', 'Closed')


def get_conn():
    # row_factory gives us dict-like access on rows so we can do row['column_name']
    # instead of indexing by position
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open'
                CHECK(status IN ('Open', 'In Progress', 'Closed')),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT NOT NULL,
            note_text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
        )
    ''')

    conn.commit()
    conn.close()


def gen_ticket_id():
    # parse the numeric suffix from existing ticket_ids (e.g. 'TKT-003' -> 3)
    # then increment. we can't just use the autoincrement id because ticket_ids
    # are their own format and rows could be deleted leaving gaps
    conn = get_conn()
    row = conn.execute(
        "SELECT ticket_id FROM tickets ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()

    if row is None:
        return 'TKT-001'

    last = row['ticket_id']
    num = int(last.split('-')[1])
    return f'TKT-{num + 1:03d}'


def create_ticket(name, email, subject, desc):
    conn = get_conn()
    tid = gen_ticket_id()
    now = datetime.now().isoformat()

    try:
        conn.execute(
            '''INSERT INTO tickets
               (ticket_id, customer_name, customer_email, subject, description, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'Open', ?, ?)''',
            (tid, name, email, subject, desc, now, now)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise

    tkt = conn.execute(
        "SELECT * FROM tickets WHERE ticket_id = ?", (tid,)
    ).fetchone()
    conn.close()
    return dict(tkt)


def get_tickets(status=None, search=None):
    conn = get_conn()
    query = "SELECT * FROM tickets"
    params = []
    clauses = []

    if status:
        clauses.append("status = ?")
        params.append(status)

    if search:
        # search across multiple fields so users can find tickets by name, id, or subject
        clauses.append(
            "(customer_name LIKE ? OR ticket_id LIKE ? OR subject LIKE ?)"
        )
        term = f'%{search}%'
        params.extend([term, term, term])

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY created_at DESC"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_ticket(ticket_id):
    conn = get_conn()
    tkt = conn.execute(
        "SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)
    ).fetchone()

    if tkt is None:
        conn.close()
        return None

    notes = conn.execute(
        "SELECT * FROM notes WHERE ticket_id = ? ORDER BY created_at ASC",
        (ticket_id,)
    ).fetchall()
    conn.close()

    result = dict(tkt)
    result['notes'] = [dict(n) for n in notes]
    return result


def update_ticket(ticket_id, status=None, note=None):
    # check status validity before touching the db to give a clear error
    if status and status not in VALID_STATUSES:
        raise ValueError(f"status must be {', '.join(VALID_STATUSES)}")

    conn = get_conn()

    tkt = conn.execute(
        "SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)
    ).fetchone()
    if tkt is None:
        conn.close()
        return None

    now = datetime.now().isoformat()

    if status:
        conn.execute(
            "UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?",
            (status, now, ticket_id)
        )

    if note:
        conn.execute(
            "INSERT INTO notes (ticket_id, note_text, created_at) VALUES (?, ?, ?)",
            (ticket_id, note, now)
        )

    # always bump updated_at even if only a note was added
    if not status and note:
        conn.execute(
            "UPDATE tickets SET updated_at = ? WHERE ticket_id = ?",
            (now, ticket_id)
        )

    conn.commit()
    conn.close()
    return now
