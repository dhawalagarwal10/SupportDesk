# supportdesk api - ticket management endpoints

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3
from pydantic import BaseModel
from typing import Optional

from database import init_db, create_ticket, get_tickets, get_ticket, update_ticket, VALID_STATUSES

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')


class TicketCreate(BaseModel):
    customer_name: str
    customer_email: str
    subject: str
    description: str


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


app = FastAPI(title='SupportDesk API')

# cors setup mostly for local dev, won't hurt in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# static file mounts for frontend assets
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, 'css')), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, 'js')), name="js")


# serving frontend pages

@app.get("/")
def index_page():
    return FileResponse(os.path.join(FRONTEND_DIR, 'index.html'))

@app.get("/create")
def create_page():
    return FileResponse(os.path.join(FRONTEND_DIR, 'create.html'))

@app.get("/ticket")
def ticket_page():
    return FileResponse(os.path.join(FRONTEND_DIR, 'ticket.html'))


# api routes

@app.post("/api/tickets", status_code=201)
def api_create_ticket(body: TicketCreate):
    # validate all fields are non-empty since pydantic only checks type
    if not body.customer_name.strip():
        raise HTTPException(400, 'customer name is required')
    if not body.customer_email.strip():
        raise HTTPException(400, 'email is required')
    if not body.subject.strip():
        raise HTTPException(400, 'subject is required')
    if not body.description.strip():
        raise HTTPException(400, 'description is required')

    try:
        tkt = create_ticket(
            body.customer_name.strip(),
            body.customer_email.strip(),
            body.subject.strip(),
            body.description.strip()
        )
    except sqlite3.IntegrityError:
        raise HTTPException(409, 'duplicate ticket id - please retry')

    return tkt


@app.get("/api/tickets")
def api_list_tickets(status: Optional[str] = None, search: Optional[str] = None):
    if status and status not in VALID_STATUSES:
        raise HTTPException(400, 'status must be Open, In Progress, or Closed')
    return get_tickets(status=status, search=search)


@app.get("/api/tickets/{ticket_id}")
def api_get_ticket(ticket_id: str):
    tkt = get_ticket(ticket_id)
    if tkt is None:
        raise HTTPException(404, 'ticket not found')
    return tkt


@app.put("/api/tickets/{ticket_id}")
def api_update_ticket(ticket_id: str, body: TicketUpdate):
    if body.status and body.status not in VALID_STATUSES:
        raise HTTPException(400, 'status must be Open, In Progress, or Closed')

    try:
        result = update_ticket(ticket_id, status=body.status, note=body.notes)
    except ValueError as e:
        raise HTTPException(400, str(e))

    if result is None:
        raise HTTPException(404, 'ticket not found')

    return {"success": True, "updated_at": result}
