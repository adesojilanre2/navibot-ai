from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from ai import ask_ai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Navibot backend running"}

@app.post("/chat")
async def chat(user_input: str = Form(...)):
    reply = ask_ai(user_input)
    return {"response": reply}

@app.post("/mental-chat")
async def mental_chat(user_input: str = Form(...)):
    reply = ask_ai(f"User mental health message: {user_input}")
    return {"response": reply}
@app.post("/bp-log")
async def bp_log(systolic: int = Form(...), diastolic: int = Form(...)):
    if systolic > 140 or diastolic > 90:
        return {"message": "High blood pressure. See GP."}
    return {"message": "Normal blood pressure."}


@app.post("/triage")
async def triage(user_input: str = Form(...)):
    text = user_input.lower()

    high_risk_keywords = ["chest pain", "stroke", "can't breathe", "unconscious"]
    medium_risk_keywords = ["fever", "vomiting", "infection", "severe headache"]

    risk = "LOW"
    advice = "Self-care and monitor symptoms."

    if any(k in text for k in high_risk_keywords):
        risk = "HIGH"
        advice = "Seek emergency care immediately."
    elif any(k in text for k in medium_risk_keywords):
        risk = "MEDIUM"
        advice = "Consult a GP within 24-48 hours."

    return {
        "risk_level": risk,
        "advice": advice,
        "input": user_input
    }