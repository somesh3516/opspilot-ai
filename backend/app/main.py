from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAIError
from pydantic import BaseModel

from app.database import (
    get_department_spending,
    get_invoices_by_risk,
    get_pending_invoices_over,
    initialize_database,
)
from app.services.ai_service import (
    summarize_results,
    understand_question,
)


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
    return {"status": "healthy"}


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
            results = get_department_spending()

        else:
            return {
                "answer": (
                    "I can currently analyze pending invoices, invoice risk, "
                    "and department spending."
                ),
                "results": [],
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
            detail=f"OpenAI request failed: {error}",
        ) from error