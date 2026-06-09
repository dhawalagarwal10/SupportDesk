# SupportDesk

A customer support ticketing system. Built for managing support tickets - create them, track their status, search through them, and add notes.

## what this is

Simple CRM-style tool for handling customer support tickets. You can:
- create tickets with customer info and issue details
- browse and search through all tickets
- filter by status (open, in progress, closed)
- view ticket details and add internal notes
- update ticket status as issues get resolved

## tech stack

- **backend**: Python + FastAPI, because it's fast to build with and the auto-docs are nice for debugging
- **database**: SQLite, no need for postgres when you're dealing with a single-server app. keeps deployment simple too
- **frontend**: vanilla HTML/JS + Tailwind CSS. no react because 3 pages don't need a SPA framework
- **deployment**: Railway

## why these choices

I went with FastAPI over Flask because the request validation with Pydantic saves a lot of boilerplate. Also the built-in docs at /docs are genuinely useful during development.

SQLite over Postgres because this is a single-instance app. adding a postgres dependency for 2 tables felt like overkill. the tradeoff is no concurrent writes but for a support tool this size that's not a real problem.

Vanilla JS over React because I have 3 pages with simple interactions. pulling in a build step, jsx compilation, and a virtual DOM for a ticket list and two forms would be over-engineering it. Tailwind via CDN keeps the styling fast without a build pipeline.

## project structure

```
support-crm/
├── backend/
│   ├── main.py           # api routes + serves frontend
│   ├── database.py       # sqlite queries
│   └── requirements.txt
├── frontend/
│   ├── index.html        # ticket list + search
│   ├── create.html       # new ticket form
│   ├── ticket.html       # ticket detail + notes
│   ├── css/style.css     # custom styles
│   └── js/
│       ├── api.js        # fetch wrapper
│       ├── tickets.js    # home page logic
│       ├── create.js     # form handling
│       └── detail.js     # detail page logic
├── .gitignore
├── .env.example
├── Procfile
├── railway.toml
└── README.md
```

## running locally

```bash
# clone it
git clone <repo-url>
cd support-crm

# install python deps
pip install -r backend/requirements.txt

# run it
cd backend
uvicorn main:app --reload

# open http://localhost:8000 in your browser
```

the database file (crm.db) gets created automatically on first run.

## api endpoints

| method | path | what it does |
|--------|------|-------------|
| POST | /api/tickets | create a new ticket |
| GET | /api/tickets | list tickets, supports ?status= and ?search= |
| GET | /api/tickets/{id} | get single ticket with notes |
| PUT | /api/tickets/{id} | update status or add a note |

## things i'd add with more time

- pagination on the ticket list (right now it loads everything)
- email notifications when ticket status changes
- dark mode toggle
- ticket assignment to team members
- export tickets to csv

## deployment

deployed on Railway. the app serves both the API and frontend from the same server so there's no CORS setup needed.
