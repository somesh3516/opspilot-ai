import csv
import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel

from app.database import (
    analyze_invoices,
    get_all_invoices,
    get_dashboard_summary,
    get_department_spending,
    get_recent_invoices,
    get_risk_distribution,
    get_status_distribution,
    get_top_vendors,
    initialize_database,
    replace_invoices,
)
from app.services.ai_service import (
    summarize_analysis,
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

frontend_url = os.getenv("FRONTEND_URL")

allowed_origins = [
    "http://localhost:3000",
]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        plan = understand_question(request.question)

        if plan.get("intent") == "unknown":
            return {
                "answer": (
                    "I couldn't determine the requested analysis. "
                    "Try asking about invoice amounts, vendors, departments, "
                    "status, risk, spending, or comparisons."
                ),
                "results": [],
                "intent": "unknown",
            }

        analysis = analyze_invoices(plan)

        answer = summarize_analysis(
            question=request.question,
            analysis=analysis,
        )

        return {
            "answer": answer,
            "results": analysis["records"],
            "intent": "invoice_analysis",
            "analysis": {
                "filters": analysis["filters"],
                "summary": analysis["summary"],
                "department_breakdown": analysis[
                    "department_breakdown"
                ],
                "vendor_breakdown": analysis[
                    "vendor_breakdown"
                ],
                "risk_breakdown": analysis["risk_breakdown"],
                "status_breakdown": analysis["status_breakdown"],
                "largest_invoice": analysis["largest_invoice"],
                "smallest_invoice": analysis["smallest_invoice"],
            },
        }

    except OpenAIError as error:
        raise HTTPException(
            status_code=502,
            detail="The OpenAI request failed.",
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="The assistant analysis failed.",
        ) from error