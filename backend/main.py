import os
import io
import csv
import re
import datetime
from pathlib import Path
from typing import List, Dict, Optional
from collections import Counter
from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

from ai import ask_ai

load_dotenv()

app = FastAPI(title="Navibot API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
DATA_DIR = Path(__file__).parent / "data"
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge" / "nhs"

INTERACTIONS_FILE = DATA_DIR / "interactions.csv"
FEEDBACK_FILE = DATA_DIR / "feedback.csv"
WAITLIST_FILE = DATA_DIR / "waitlist.csv"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class FeedbackRequest(BaseModel):
    user_input: str
    response: str
    topic: str
    risk: str
    feedback: str


class WaitlistRequest(BaseModel):
    email: EmailStr


def ensure_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not INTERACTIONS_FILE.exists():
        with INTERACTIONS_FILE.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "user_input", "response", "topic", "risk"])

    if not FEEDBACK_FILE.exists():
        with FEEDBACK_FILE.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "user_input", "response", "topic", "risk", "feedback"])

    if not WAITLIST_FILE.exists():
        with WAITLIST_FILE.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["email"])


ensure_data_files()


def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("’", "'")
    text = re.sub(r"[^a-z0-9\s']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_knowledge_docs() -> List[Dict[str, str]]:
    docs = []
    if not KNOWLEDGE_DIR.exists():
        return docs

    for file_path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        try:
            content = file_path.read_text(encoding="utf-8")
            docs.append(
                {
                    "filename": file_path.name,
                    "title": file_path.stem,
                    "content": content,
                    "normalized": normalize_text(content),
                }
            )
        except Exception:
            continue

    return docs


KNOWLEDGE_DOCS = load_knowledge_docs()


def classify_question(text: str):
    t = normalize_text(text)

    emergency_terms = [
        "chest pain",
        "difficulty breathing",
        "trouble breathing",
        "stroke",
        "fainting",
        "collapsed",
        "collapse",
        "not waking",
        "heavy bleeding",
        "seizure",
    ]
    if any(term in t for term in emergency_terms):
        return "emergency", "HIGH"

    if any(term in t for term in ["blood pressure", "heart racing", "heart is racing", "palpitations"]):
        return "blood_pressure", "MEDIUM"

    if any(term in t for term in ["tummy", "stomach", "belly pain", "abdominal pain", "cramps"]):
        return "stomach_issue", "LOW"

    if any(term in t for term in ["anxious", "anxiety", "mental health", "panic", "low mood"]):
        return "mental_health", "MEDIUM"

    if any(term in t for term in ["medicine", "medication", "prescription", "tablets", "repeat prescription"]):
        return "repeat_medicine", "LOW"

    if any(term in t for term in ["just arrived", "new to the uk", "register with a doctor", "how do i see a doctor"]):
        return "new_to_uk", "LOW"

    return "general_navigation", "LOW"


def score_doc(user_text: str, doc_text: str) -> int:
    user_words = set(user_text.split())
    doc_words = set(doc_text.split())
    return len(user_words.intersection(doc_words))


def retrieve_context(user_input: str, max_docs: int = 3) -> str:
    if not KNOWLEDGE_DOCS:
        return ""

    q = normalize_text(user_input)
    scored = []

    for doc in KNOWLEDGE_DOCS:
        score = score_doc(q, doc["normalized"])
        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_docs = [doc for _, doc in scored[:max_docs]]

    if not top_docs:
        return ""

    return "\n\n---\n\n".join(
        [f"Source: {doc['filename']}\n{doc['content']}" for doc in top_docs]
    )


def append_csv_row(file_path: Path, row: List[str]) -> None:
    with file_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row)


def log_interaction(user_input: str, response: str, topic: str, risk: str) -> None:
    append_csv_row(
        INTERACTIONS_FILE,
        [
            datetime.datetime.utcnow().isoformat(),
            user_input,
            response,
            topic,
            risk,
        ],
    )


def log_feedback(user_input: str, response: str, topic: str, risk: str, feedback: str) -> None:
    append_csv_row(
        FEEDBACK_FILE,
        [
            datetime.datetime.utcnow().isoformat(),
            user_input,
            response,
            topic,
            risk,
            feedback,
        ],
    )


def get_rows(file_path: Path) -> List[Dict[str, str]]:
    if not file_path.exists():
        return []
    with file_path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def get_interactions() -> List[Dict[str, str]]:
    return get_rows(INTERACTIONS_FILE)


def get_feedback_rows() -> List[Dict[str, str]]:
    return get_rows(FEEDBACK_FILE)


def get_waitlist_emails() -> List[str]:
    rows = get_rows(WAITLIST_FILE)
    return [row.get("email", "").strip() for row in rows if row.get("email")]


def save_waitlist_email(email: str) -> bool:
    existing = {e.lower().strip() for e in get_waitlist_emails()}
    clean = email.lower().strip()
    if clean in existing:
        return False

    append_csv_row(WAITLIST_FILE, [clean])
    return True


def filter_rows(
    rows: List[Dict[str, str]],
    topic: Optional[str] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
):
    filtered = rows

    if topic and topic != "all":
        filtered = [r for r in filtered if r.get("topic", "") == topic]

    if risk and risk != "all":
        filtered = [r for r in filtered if r.get("risk", "") == risk]

    if search:
        q = search.lower().strip()
        filtered = [
            r
            for r in filtered
            if q in r.get("user_input", "").lower()
            or q in r.get("response", "").lower()
            or q in r.get("topic", "").lower()
            or q in r.get("risk", "").lower()
        ]

    return filtered


@app.get("/")
def home():
    return {"message": "Navibot backend running"}


@app.post("/chat")
def chat(req: ChatRequest):
    user_input = req.message.strip()

    if not user_input:
        return {
            "response": "Please type a question.",
            "topic": "unknown",
            "risk": "unknown",
        }

    topic, risk = classify_question(user_input)
    context = retrieve_context(user_input)
    response = ask_ai(user_input=user_input, context=context)

    log_interaction(user_input, response, topic, risk)

    return {
        "response": response,
        "topic": topic,
        "risk": risk,
    }


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    log_feedback(
        user_input=req.user_input,
        response=req.response,
        topic=req.topic,
        risk=req.risk,
        feedback=req.feedback,
    )
    return {"status": "ok"}


@app.post("/waitlist")
def waitlist(req: WaitlistRequest):
    created = save_waitlist_email(req.email)
    if created:
        return {"status": "ok", "message": "You have been added to the waitlist."}
    return {"status": "exists", "message": "This email is already on the waitlist."}


@app.get("/analytics")
def analytics(
    topic: str = Query(default="all"),
    risk: str = Query(default="all"),
    search: str = Query(default=""),
):
    interactions = get_interactions()
    feedback_rows = get_feedback_rows()

    filtered_interactions = filter_rows(interactions, topic=topic, risk=risk, search=search)
    filtered_feedback = filter_rows(feedback_rows, topic=topic, risk=risk, search=search)

    topic_counts = Counter(row.get("topic", "unknown") for row in filtered_interactions)
    risk_counts = Counter(row.get("risk", "unknown") for row in filtered_interactions)
    feedback_counts = Counter(row.get("feedback", "unknown") for row in filtered_feedback)

    recent_questions = [
        {
            "timestamp": row.get("timestamp", ""),
            "user_input": row.get("user_input", ""),
            "topic": row.get("topic", "unknown"),
            "risk": row.get("risk", "unknown"),
        }
        for row in filtered_interactions[-20:][::-1]
    ]

    all_topics = sorted({row.get("topic", "unknown") for row in interactions if row.get("topic")})
    all_risks = sorted({row.get("risk", "unknown") for row in interactions if row.get("risk")})

    return {
        "totals": {
            "interactions": len(filtered_interactions),
            "feedback": len(filtered_feedback),
            "waitlist": len(get_waitlist_emails()),
        },
        "topic_counts": dict(topic_counts),
        "risk_counts": dict(risk_counts),
        "feedback_counts": dict(feedback_counts),
        "recent_questions": recent_questions,
        "filters": {
            "topics": all_topics,
            "risks": all_risks,
            "selected_topic": topic,
            "selected_risk": risk,
            "search": search,
        },
    }


@app.get("/export")
def export_csv(
    topic: str = Query(default="all"),
    risk: str = Query(default="all"),
    search: str = Query(default=""),
):
    interactions = get_interactions()
    filtered = filter_rows(interactions, topic=topic, risk=risk, search=search)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "user_input", "topic", "risk"])

    for row in filtered:
        writer.writerow([
            row.get("timestamp", ""),
            row.get("user_input", ""),
            row.get("topic", ""),
            row.get("risk", ""),
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=navibot_export.csv"},
    )
waitlist = []

@app.post("/waitlist")
def join_waitlist(data: dict = Body(...)):
    email = data.get("email")
    waitlist.append(email)
    print("New email:", email)
    return {"status": "ok"}