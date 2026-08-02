import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def understand_question(question: str) -> dict[str, Any]:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You classify business invoice analytics questions. "
            "Return ONLY valid JSON. "
            "Do not include markdown. "
            "Use this exact schema: "
            "{"
            '"intent": string, '
            '"amount": number|null, '
            '"min_amount": number|null, '
            '"max_amount": number|null, '
            '"risk": string|null, '
            '"status": string|null, '
            '"department": string|null, '
            '"vendor": string|null'
            "}. "
            "Supported intents: "
            "pending_invoices, "
            "risk_invoices, "
            "department_spending, "
            "vendor_spending, "
            "department_invoices, "
            "amount_range, "
            "risk_and_status, "
            "invoice_summary, "
            "unknown. "
            "Examples: "
            "'Which vendor has the highest total spend?' "
            "=> vendor_spending. "
            "'How much did Technology spend?' "
            "=> department_spending with department Technology. "
            "'Show high-risk pending invoices' "
            "=> risk_and_status with risk High and status Pending. "
            "'Show invoices between $5000 and $10000' "
            "=> amount_range with min_amount 5000 and max_amount 10000. "
            "'How many invoices are there?' "
            "=> invoice_summary."
        ),
        input=question,
    )

    try:
        return json.loads(response.output_text)

    except json.JSONDecodeError:
        return {
            "intent": "unknown",
            "amount": None,
            "min_amount": None,
            "max_amount": None,
            "risk": None,
            "status": None,
            "department": None,
            "vendor": None,
        }


def summarize_results(
    question: str,
    results: list[dict[str, Any]],
) -> str:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You are OpsPilot, a concise business operations analyst. "
            "Answer the user's question using ONLY the supplied database "
            "results. Never invent records, totals, percentages, or trends. "

            "IMPORTANT: The application displays the database results in a "
            "separate table underneath your response. Do NOT list every "
            "record in your written answer. "

            "If the results contain multiple invoice records, give a short "
            "summary of 1 to 3 sentences. State how many matching records "
            "were found and mention at most one or two notable records, "
            "such as the largest invoice. "

            "If the user asks for a total, count, average, vendor, or "
            "department metric, answer that question directly. "

            "If no records match, clearly state that no matching records "
            "were found. "

            "Keep responses concise, professional, and business-friendly. "
            "Do not use long bullet lists because the detailed records "
            "will already be shown in the results table."
        ),
        input=(
            f"User question:\n{question}\n\n"
            f"Number of database results: {len(results)}\n\n"
            f"Database results:\n"
            f"{json.dumps(results, indent=2)}"
        ),
    )

    return response.output_text