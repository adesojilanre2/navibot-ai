import re
from typing import Tuple


def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("’", "'")
    text = re.sub(r"[^a-z0-9\s']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


TOPIC_PATTERNS = {
    "stomach_issue": [
        "tummy ache",
        "stomach ache",
        "stomach pain",
        "belly pain",
        "abdominal pain",
        "cramps",
        "diarrhoea",
        "diarrhea",
        "vomiting",
        "indigestion",
        "constipation",
        "trapped wind",
        "feel sick",
        "nausea",
    ],
    "blood_pressure": [
        "blood pressure",
        "heart racing",
        "heart is racing",
        "palpitations",
        "bp check",
        "check my blood pressure",
        "pulse",
        "dizzy",
        "dizziness",
    ],
    "new_to_uk": [
        "new to the uk",
        "just arrived in the uk",
        "just moved to the uk",
        "i just arrived",
        "i just moved",
        "how do i see a doctor",
        "family doctor",
        "where do i go",
        "how do i access healthcare",
        "how do i use nhs",
        "register with a doctor",
        "register with a gp",
    ],
    "urgent_same_day": [
        "need help today",
        "same day",
        "doctor is closed",
        "gp is closed",
        "need urgent help",
        "not an emergency",
        "getting worse",
        "worse today",
        "need help now",
    ],
    "pharmacy_first": [
        "pharmacy",
        "chemist",
        "pharmacist",
        "quick advice",
        "minor illness",
        "over the counter",
        "without appointment",
        "can i get medicine",
    ],
    "repeat_medicine": [
        "ran out of my medicine",
        "ran out of my medication",
        "repeat prescription",
        "prescription refill",
        "regular medicine",
        "regular medication",
        "need my tablets",
        "need my meds",
    ],
    "mental_health": [
        "anxious",
        "anxiety",
        "panic",
        "depressed",
        "depression",
        "low mood",
        "mental health",
        "counselling",
        "therapy",
        "talk to someone",
        "stress",
    ],
    "sexual_health": [
        "contraception",
        "emergency contraception",
        "sexual health",
        "sti",
        "std",
        "pill",
        "tested",
        "sexual clinic",
        "confidential",
    ],
    "emergency": [
        "chest pain",
        "trouble breathing",
        "difficulty breathing",
        "short of breath",
        "severe bleeding",
        "heavy bleeding",
        "stroke",
        "collapsed",
        "collapse",
        "fainting",
        "seizure",
        "unconscious",
        "allergic reaction",
        "ambulance",
        "emergency",
    ],
}


HIGH_RISK_PATTERNS = [
    "chest pain",
    "trouble breathing",
    "difficulty breathing",
    "short of breath",
    "stroke",
    "seizure",
    "collapsed",
    "collapse",
    "fainting",
    "fainted",
    "unconscious",
    "not waking up",
    "heavy bleeding",
    "severe bleeding",
    "severe allergic reaction",
    "blue lips",
    "can t breathe",
    "cannot breathe",
    "suicidal",
    "harm myself",
    "kill myself",
    "not safe",
]

MEDIUM_RISK_PATTERNS = [
    "heart racing",
    "heart is racing",
    "palpitations",
    "vomiting",
    "dehydrated",
    "dehydration",
    "high fever",
    "fever",
    "worse today",
    "getting worse",
    "severe pain",
    "urgent",
    "same day",
    "ran out of medicine",
    "ran out of medication",
    "anxious",
    "panic",
]

LOW_RISK_PATTERNS = [
    "blood pressure",
    "pharmacy",
    "chemist",
    "tummy ache",
    "stomach ache",
    "constipation",
    "indigestion",
    "new to the uk",
    "register with a gp",
    "family doctor",
]


def score_topic(text: str, phrases: list[str]) -> int:
    score = 0
    for phrase in phrases:
        if phrase in text:
            score += len(phrase.split()) + 2
    return score


def classify_topic(text: str) -> str:
    topic_scores = {}

    for topic, phrases in TOPIC_PATTERNS.items():
        topic_scores[topic] = score_topic(text, phrases)

    best_topic = max(topic_scores, key=topic_scores.get)
    best_score = topic_scores[best_topic]

    if best_score == 0:
        return "general_navigation"

    return best_topic


def classify_risk(text: str) -> str:
    for phrase in HIGH_RISK_PATTERNS:
        if phrase in text:
            return "HIGH"

    for phrase in MEDIUM_RISK_PATTERNS:
        if phrase in text:
            return "MEDIUM"

    for phrase in LOW_RISK_PATTERNS:
        if phrase in text:
            return "LOW"

    return "LOW"


def classify_question(user_input: str) -> Tuple[str, str]:
    text = normalize_text(user_input)
    topic = classify_topic(text)
    risk = classify_risk(text)
    return topic, risk