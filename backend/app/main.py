import csv
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel

from app.database import (
    get_all_invoices,
    get_dashboard_summary,
    get_department_invoices,
    get_department_spending,
    get_invoice_summary,
    get_invoices_by_amount_range,
    get_invoices_by_risk,
    get_invoices_by_risk_and_status,
    get_pending_invoices_over,
    get_recent_invoices,
    get_risk_distribution,
    get_status_distribution,
    get_top_vendors,
    get_vendor_spending,
    initialize_database,
    replace_invoices,
)
from app.services.ai_service import (
    summarize_results,
    understand_question,
)
from app.services.report_service import (
    generate_operational_summary_pdf,
)

REQUIRED_COLUMNS = {
    "vendor",
    "department",
    "amount",
    "status",
    "risk",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="OpsPilot AI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssistantRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {
        "message": "OpsPilot AI backend is running",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.get("/dashboard")
def dashboard():
    return {
        "summary": get_dashboard_summary(),
        "recent_invoices": get_recent_invoices(),
        "department_spending": get_department_spending(),
        "risk_distribution": get_risk_distribution(),
        "status_distribution": get_status_distribution(),
        "top_vendors": get_top_vendors(),
    }


@app.get("/invoices")
def invoices():
    return {
        "invoices": get_all_invoices(),
    }


@app.get("/reports/operational-summary.pdf")
def download_operational_summary():
    pdf_buffer = generate_operational_summary_pdf()

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                'attachment; filename="opspilot-operational-summary.pdf"'
            )
        },
    )


@app.post("/upload")
async def upload_invoices(
    file: UploadFile = File(...),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    raw_content = await file.read()

    try:
        decoded_content = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=400,
            detail="The CSV must use UTF-8 encoding.",
        ) from error

    reader = csv.DictReader(io.StringIO(decoded_content))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail="The CSV does not contain column headers.",
        )

    normalized_headers = {
        header.strip().lower()
        for header in reader.fieldnames
        if header
    }

    missing_columns = REQUIRED_COLUMNS - normalized_headers

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required columns: "
                + ", ".join(sorted(missing_columns))
            ),
        )

    imported_invoices = []

    for row_number, row in enumerate(reader, start=2):
        normalized_row = {
            str(key).strip().lower(): str(value).strip()
            for key, value in row.items()
            if key is not None and value is not None
        }

        try:
            amount_text = (
                normalized_row["amount"]
                .replace("$", "")
                .replace(",", "")
            )

            amount = float(amount_text)

            if amount < 0:
                raise ValueError

        except (KeyError, ValueError) as error:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid amount on CSV row {row_number}.",
            ) from error

        invoice = {
            "vendor": normalized_row.get("vendor", ""),
            "department": normalized_row.get("department", ""),
            "amount": amount,
            "status": normalized_row.get("status", ""),
            "risk": normalized_row.get("risk", ""),
        }

        if not all(
            [
                invoice["vendor"],
                invoice["department"],
                invoice["status"],
                invoice["risk"],
            ]
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Missing data on CSV row {row_number}.",
            )

        imported_invoices.append(invoice)

    if not imported_invoices:
        raise HTTPException(
            status_code=400,
            detail="The CSV contains no invoice records.",
        )

    imported_count = replace_invoices(imported_invoices)

    return {
        "message": "Invoice data imported successfully.",
        "imported_count": imported_count,
    }


@app.post("/assistant")
def assistant(request: AssistantRequest):
    try:
        analysis = understand_question(request.question)
        intent = analysis.get("intent")

        if intent == "pending_invoices":
            amount = float(analysis.get("amount") or 0)
            results = get_pending_invoices_over(amount)

        elif intent == "risk_invoices":
            risk = analysis.get("risk") or "High"
            results = get_invoices_by_risk(risk)

        elif intent == "department_spending":
            department = analysis.get("department")
            results = get_department_spending(department)

        elif intent == "vendor_spending":
            vendor = analysis.get("vendor")
            results = get_vendor_spending(vendor)

        elif intent == "department_invoices":
            department = analysis.get("department")

            if not department:
                return {
                    "answer": "Please specify a department.",
                    "results": [],
                    "intent": intent,
                }

            results = get_department_invoices(department)

        elif intent == "amount_range":
            min_amount = float(
                analysis.get("min_amount") or 0
            )

            max_amount = float(
                analysis.get("max_amount") or 999999999
            )

            results = get_invoices_by_amount_range(
                min_amount,
                max_amount,
            )

        elif intent == "risk_and_status":
            risk = analysis.get("risk") or "High"
            status = analysis.get("status") or "Pending"

            results = get_invoices_by_risk_and_status(
                risk,
                status,
            )

        elif intent == "invoice_summary":
            results = get_invoice_summary()

        else:
            return {
                "answer": (
                    "I can analyze invoice totals, vendor spending, "
                    "department spending, risk, status, amount ranges, "
                    "and invoice summaries."
                ),
                "results": [],
                "intent": "unknown",
            }

        answer = summarize_results(
            question=request.question,
            results=results,
        )

        return {
            "answer": answer,
            "results": results,
            "intent": intent,
        }

    except OpenAIError as error:
        raise HTTPException(
            status_code=502,
            detail="The OpenAI request failed.",
        ) from error