import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
INTERACTIONS_FILE = DATA_DIR / "interactions.csv"
FEEDBACK_FILE = DATA_DIR / "feedback.csv"
JSONL_FILE = DATA_DIR / "learning_log.jsonl"


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def ensure_csv_file(file_path: Path, headers: list[str]) -> None:
    ensure_data_dir()
    if not file_path.exists():
      with file_path.open("w", newline="", encoding="utf-8") as f:
          writer = csv.writer(f)
          writer.writerow(headers)


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).replace("\r", " ").replace("\n", " ").strip()


def append_csv_row(file_path: Path, headers: list[str], row: list[Any]) -> None:
    ensure_csv_file(file_path, headers)
    with file_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row)


def append_jsonl(record: dict) -> None:
    ensure_data_dir()
    with JSONL_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def log_interaction(
    user_input: str,
    topic: str,
    risk: str,
    context: str,
    response: str,
) -> None:
    timestamp = now_iso()

    csv_headers = [
        "timestamp",
        "user_input",
        "topic",
        "risk",
        "context_preview",
        "response",
    ]

    context_preview = safe_text(context)[:500]

    append_csv_row(
        INTERACTIONS_FILE,
        csv_headers,
        [
            timestamp,
            safe_text(user_input),
            safe_text(topic),
            safe_text(risk),
            context_preview,
            safe_text(response),
        ],
    )

    append_jsonl(
        {
            "type": "interaction",
            "timestamp": timestamp,
            "user_input": user_input,
            "topic": topic,
            "risk": risk,
            "context": context,
            "response": response,
        }
    )


def log_feedback(
    user_input: str,
    response: str,
    topic: str,
    risk: str,
    feedback: str,
) -> None:
    timestamp = now_iso()

    csv_headers = [
        "timestamp",
        "user_input",
        "response",
        "topic",
        "risk",
        "feedback",
    ]

    append_csv_row(
        FEEDBACK_FILE,
        csv_headers,
        [
            timestamp,
            safe_text(user_input),
            safe_text(response),
            safe_text(topic),
            safe_text(risk),
            safe_text(feedback),
        ],
    )

    append_jsonl(
        {
            "type": "feedback",
            "timestamp": timestamp,
            "user_input": user_input,
            "response": response,
            "topic": topic,
            "risk": risk,
            "feedback": feedback,
        }
    )


def read_csv_rows(file_path: Path) -> list[dict]:
    if not file_path.exists():
        return []

    with file_path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def get_interactions() -> list[dict]:
    rows = read_csv_rows(INTERACTIONS_FILE)
    rows.reverse()
    return rows


def get_feedback() -> list[dict]:
    rows = read_csv_rows(FEEDBACK_FILE)
    rows.reverse()
    return rows