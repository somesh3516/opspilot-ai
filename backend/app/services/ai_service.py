import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def understand_question(question: str) -> dict[str, Any]:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You analyze business operations questions. "
            "Return ONLY valid JSON with these fields: "
            "intent, amount, risk, department. "
            "Supported intents are: "
            "pending_invoices, risk_invoices, department_spending, unknown. "
            "Use null if a value is not provided."
        ),
        input=question,
    )

    try:
        return json.loads(response.output_text)
    except json.JSONDecodeError:
        return {
            "intent": "unknown",
            "amount": None,
            "risk": None,
            "department": None,
        }


def summarize_results(
    question: str,
    results: list[dict[str, Any]],
) -> str:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You are OpsPilot, an AI business operations assistant. "
            "Answer ONLY using the supplied database results. "
            "Do not invent information."
        ),
        input=(
            f"User Question:\n{question}\n\n"
            f"Database Results:\n{json.dumps(results, indent=2)}"
        ),
    )

    return response.output_text