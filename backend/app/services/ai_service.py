import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


DEFAULT_PLAN = {
    "intent": "invoice_analysis",
    "departments": [],
    "vendors": [],
    "risks": [],
    "statuses": [],
    "min_amount": None,
    "max_amount": None,
    "metrics": [],
    "breakdowns": [],
    "sort_by": None,
    "sort_order": "desc",
    "limit": None,
}


def understand_question(question: str) -> dict[str, Any]:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You are the query planner for an invoice analytics application. "
            "Convert the user's question into a structured JSON analysis plan. "
            "Return ONLY valid JSON with no markdown or explanation. "

            "Use this exact schema: "
            "{"
            '"intent": "invoice_analysis" | "unknown", '
            '"departments": string[], '
            '"vendors": string[], '
            '"risks": string[], '
            '"statuses": string[], '
            '"min_amount": number|null, '
            '"max_amount": number|null, '
            '"metrics": string[], '
            '"breakdowns": string[], '
            '"sort_by": string|null, '
            '"sort_order": "asc"|"desc", '
            '"limit": number|null'
            "}. "

            "Allowed metrics are: "
            "count, total_spend, average_amount, "
            "pending_count, approved_count, review_count, "
            "high_risk_count, medium_risk_count, low_risk_count. "

            "Allowed breakdowns are: department, vendor, risk, status. "

            "Rules: "
            "Preserve ALL filters mentioned in the question. "
            "If multiple departments are mentioned, include every department. "
            "If a dollar range is mentioned, always include both min_amount "
            "and max_amount when available. "
            "If High risk is mentioned as a FILTER, include High in risks. "
            "If Pending is mentioned as a FILTER, include Pending in statuses. "

            "IMPORTANT: Distinguish filters from requested metrics. "
            "If the user asks to compare departments and asks which has more "
            "high-risk invoices, high risk is a METRIC, not necessarily a "
            "filter. In that case use high_risk_count in metrics but leave "
            "risks empty so overall department spending can still be calculated. "

            "Likewise, if the user asks for overall spending plus pending "
            "invoice counts, use pending_count as a metric and do not filter "
            "the entire dataset to Pending unless the user specifically asks "
            "to show or analyze only pending invoices. "

            "Do not choose only one part of a compound question. "

            "Examples: "

            "'Show high-risk invoices between $7000 and $20000, identify "
            "which department has the most, calculate their total spend, "
            "and tell me which vendor represents the largest exposure.' "
            "=> "
            "{"
            '"intent":"invoice_analysis",'
            '"departments":[],'
            '"vendors":[],'
            '"risks":["High"],'
            '"statuses":[],'
            '"min_amount":7000,'
            '"max_amount":20000,'
            '"metrics":["count","total_spend"],'
            '"breakdowns":["department","vendor"],'
            '"sort_by":"amount",'
            '"sort_order":"desc",'
            '"limit":null'
            "}. "

            "'Compare Technology and Manufacturing spending and tell me "
            "which department has more high-risk invoices.' "
            "=> "
            "{"
            '"intent":"invoice_analysis",'
            '"departments":["Technology","Manufacturing"],'
            '"vendors":[],'
            '"risks":[],'
            '"statuses":[],'
            '"min_amount":null,'
            '"max_amount":null,'
            '"metrics":["total_spend","high_risk_count"],'
            '"breakdowns":["department"],'
            '"sort_by":null,'
            '"sort_order":"desc",'
            '"limit":null'
            "}. "

            "'Which vendor has the most pending invoices in Technology?' "
            "=> "
            "{"
            '"intent":"invoice_analysis",'
            '"departments":["Technology"],'
            '"vendors":[],'
            '"risks":[],'
            '"statuses":["Pending"],'
            '"min_amount":null,'
            '"max_amount":null,'
            '"metrics":["count"],'
            '"breakdowns":["vendor"],'
            '"sort_by":"count",'
            '"sort_order":"desc",'
            '"limit":null'
            "}. "

            "'Compare Finance and Operations by total spend, pending "
            "invoices, and high-risk invoices.' "
            "=> "
            "{"
            '"intent":"invoice_analysis",'
            '"departments":["Finance","Operations"],'
            '"vendors":[],'
            '"risks":[],'
            '"statuses":[],'
            '"min_amount":null,'
            '"max_amount":null,'
            '"metrics":["total_spend","pending_count","high_risk_count"],'
            '"breakdowns":["department"],'
            '"sort_by":null,'
            '"sort_order":"desc",'
            '"limit":null'
            "}. "

            "'How many invoices are there?' "
            "=> "
            "{"
            '"intent":"invoice_analysis",'
            '"departments":[],'
            '"vendors":[],'
            '"risks":[],'
            '"statuses":[],'
            '"min_amount":null,'
            '"max_amount":null,'
            '"metrics":["count"],'
            '"breakdowns":[],'
            '"sort_by":null,'
            '"sort_order":"desc",'
            '"limit":null'
            "}."
        ),
        input=question,
    )

    try:
        plan = json.loads(response.output_text)

        return {
            **DEFAULT_PLAN,
            **plan,
        }

    except (json.JSONDecodeError, TypeError):
        return DEFAULT_PLAN.copy()


def summarize_analysis(
    question: str,
    analysis: dict[str, Any],
) -> str:
    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You are OpsPilot, a concise business operations analyst. "

            "Answer the user's question using ONLY the supplied verified "
            "analysis results. Every number you state must come directly "
            "from the supplied analysis object. "

            "IMPORTANT CURRENCY FORMATTING RULE: "
            "Always format every monetary value as U.S. currency with a "
            "dollar sign, comma separators, and exactly two decimal places. "
            "For example, 52600.0 must be displayed as $52,600.00. "
            "47200.0 must be displayed as $47,200.00. "
            "18850 must be displayed as $18,850.00. "
            "Never display raw monetary values such as 52600.0 or 47200.0. "

            "Counts must be displayed as whole numbers without decimal places. "

            "When comparing departments, vendors, or other groups, write "
            "the comparison in clear natural business language. "

            "For example: "
            "'Technology had $52,600.00 in total spend, compared with "
            "$47,200.00 for Manufacturing. Technology also had more "
            "high-risk invoices, with 3 compared with Manufacturing's 2.' "

            "The application's results table displays the filtered invoice "
            "records used for the analysis. "

            "Never apply your own filters. "
            "Never recalculate using records outside the supplied analysis. "
            "Never invent missing data. "

            "For compound questions, answer EVERY requested part when the "
            "verified analysis contains the necessary information. "

            "When department_breakdown is provided, use it for comparisons "
            "between departments. "

            "When vendor_breakdown is provided, use it for comparisons "
            "between vendors. "

            "Use summary for overall metrics such as matching record count, "
            "total spend, average amount, status counts, and risk counts. "

            "Use largest_invoice and smallest_invoice when the question "
            "asks about largest, smallest, highest, or lowest exposures. "

            "Do not list every invoice because detailed records are already "
            "displayed in the application's results table. "

            "Keep the response concise, normally 2 to 5 sentences."
        ),
        input=(
            f"User question:\n{question}\n\n"
            f"Verified analysis:\n"
            f"{json.dumps(analysis, indent=2)}"
        ),
    )

    return response.output_text