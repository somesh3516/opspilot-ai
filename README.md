# OpsPilot AI

**AI-powered operations analytics for invoice data.**

OpsPilot AI is a full-stack analytics application that transforms operational invoice data into interactive dashboards, risk insights, natural-language analysis, and downloadable executive reports.

Users can upload a CSV dataset, explore live analytics, ask questions about the data through an AI assistant, and generate an operational summary report.

---

## Overview

Operations teams often rely on spreadsheets and manual analysis to understand spending, invoice status, vendor activity, and operational risk.

OpsPilot AI provides a centralized workflow for analyzing this data.

The application combines:

- CSV data ingestion
- Relational data storage
- REST API development
- Interactive analytics
- AI-assisted data querying
- Risk and status analysis
- Automated PDF reporting

The goal is to demonstrate how AI can complement traditional analytics rather than replace deterministic data processing. Numerical results are calculated from the underlying database and provided to the AI layer for interpretation and summarization.

---

## Features

### Live Operations Dashboard

Monitor key operational metrics including:

- Total invoice count
- Total spend
- Pending approvals
- High-risk invoices
- Department-level spending
- Risk distribution
- Recent invoice activity

Dashboard metrics automatically update based on the active uploaded dataset.

### CSV Data Import

Upload invoice data directly through the application.

OpsPilot validates the CSV and imports the records into the backend database.

Uploading a new dataset replaces the current active dataset, allowing the application to recalculate analytics against the new data.

### Analytics Workspace

Explore deeper operational trends through interactive visualizations:

- Department spending
- Risk distribution
- Top vendors by spend
- Invoice status distribution

Analytics are generated dynamically from the active dataset.

### OpsPilot AI Assistant

Ask natural-language questions about operational data.

Example questions:

```text
How many invoices are there?

How much did Technology spend?

Which vendor has the highest spending?

Show invoices between $5,000 and $10,000.

Which invoices are high risk?

Show high-risk pending invoices.
```

The assistant interprets the user's question, executes the appropriate database query, and returns both a natural-language explanation and structured results.

### Operational Reports

Generate an executive-level operational summary containing:

- Total spend
- Invoice volume
- Pending approval rate
- High-risk rate
- Highest-spend department
- Highest-spend vendor
- Key operational findings

### PDF Export

Download a generated PDF operational report directly from the Reports workspace.

The PDF is generated server-side using the active dataset.

---

## Architecture

```text
                    OpsPilot AI
                         |
          +--------------+--------------+
          |                             |
     Next.js Frontend              FastAPI Backend
          |                             |
          |                         REST API
          |                             |
          +-----------------------------+
                                        |
                              +---------+---------+
                              |                   |
                           SQLite             OpenAI API
                              |                   |
                       Invoice Data       Question Analysis
                       Aggregations       Result Summaries
                              |
                       Report Generation
                              |
                         PDF Export
```

### Data Flow

```text
CSV Upload
    |
    v
FastAPI Validation
    |
    v
SQLite Database
    |
    +--------------------+
    |                    |
    v                    v
Dashboard API       AI Query Engine
    |                    |
    v                    v
Analytics UI        OpenAI Analysis
    |                    |
    +---------+----------+
              |
              v
       Operational Report
              |
              v
          PDF Export
```

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Lucide React

### Backend

- Python
- FastAPI
- SQLite
- Uvicorn
- Pydantic

### AI

- OpenAI API
- Natural-language intent analysis
- Database-grounded response generation

### Reporting

- ReportLab
- Server-side PDF generation

---

## Project Structure

```text
opspilot-ai/
|
+-- app/
|   +-- analytics/
|   +-- assistant/
|   +-- reports/
|   +-- upload/
|   +-- page.tsx
|
+-- components/
|   +-- assistant/
|   +-- dashboard/
|   +-- layout/
|   +-- ui/
|
+-- lib/
|   +-- api.ts
|
+-- backend/
|   +-- app/
|   |   +-- services/
|   |   |   +-- ai_service.py
|   |   |   +-- report_service.py
|   |   |
|   |   +-- database.py
|   |   +-- main.py
|   |
|   +-- requirements.txt
|
+-- README.md
```

---

## CSV Format

OpsPilot currently expects CSV files containing the following columns:

| Column | Description |
|---|---|
| `vendor` | Vendor or supplier name |
| `department` | Department responsible for the invoice |
| `amount` | Invoice amount |
| `status` | Invoice workflow status |
| `risk` | Assigned risk classification |

Example:

```csv
vendor,department,amount,status,risk
Northstar Systems,Technology,5200,Approved,Medium
Orion Manufacturing,Manufacturing,4813,Pending,Low
Apex Medical,Healthcare,4426,Review,High
```

---

## Running Locally

### Prerequisites

Install:

- Node.js
- npm
- Python 3
- Git

You will also need an OpenAI API key for AI Assistant functionality.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd opspilot-ai
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the backend

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create:

```text
backend/.env
```

Add:

```text
OPENAI_API_KEY=your_openai_api_key
```

Do not commit your `.env` file.

### 5. Start the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API runs at:

```text
http://127.0.0.1:8000
```

### 6. Start the frontend

Open another terminal from the project root:

```bash
npm run dev
```

The application runs at:

```text
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `GET` | `/dashboard` | Dashboard and analytics data |
| `GET` | `/invoices` | Invoice records |
| `POST` | `/upload` | Upload and import CSV data |
| `POST` | `/assistant` | Submit natural-language data questions |
| `GET` | `/reports/operational-summary.pdf` | Generate operational PDF report |

---

## AI Design

OpsPilot uses a database-grounded AI workflow.

Instead of asking the language model to calculate business metrics directly, the application:

1. Receives the user's natural-language question.
2. Determines the requested analytical intent.
3. Executes the corresponding database query.
4. Retrieves structured results from SQLite.
5. Provides those results to the AI layer.
6. Generates a concise natural-language explanation.
7. Displays the underlying structured results when applicable.

This architecture reduces hallucination risk and keeps quantitative answers grounded in the active dataset.

---

## Example Workflow

```text
Upload invoice CSV
        |
        v
Validate and import records
        |
        v
View dashboard KPIs
        |
        v
Explore analytics
        |
        v
Ask OpsPilot questions
        |
        v
Review structured results
        |
        v
Generate executive report
        |
        v
Download PDF
```

---

## Current Limitations

OpsPilot currently:

- Supports one active dataset at a time
- Requires a defined CSV column structure
- Uses SQLite for local data persistence
- Focuses primarily on invoice and operational spend analysis

These constraints keep the current version focused while leaving room for future expansion.

---

## Future Improvements

Potential future development includes:

- Automatic CSV column mapping
- Multiple saved datasets
- Historical upload tracking
- Date-range analysis
- Dataset comparison
- User authentication
- Role-based access control
- PostgreSQL support
- Advanced anomaly detection
- Additional report formats
- Cloud deployment and persistent storage

---

## Security

Sensitive configuration is excluded from source control.

The repository ignores:

- `.env` files
- OpenAI API credentials
- Python virtual environments
- Local SQLite databases
- Python cache files
- Next.js build artifacts
- Node modules

API keys should always be supplied through environment variables.

---

## Author

**Somesh Dixit**

Full-stack software engineering, data analytics, automation, and AI-enabled business applications.

---

## Project Status

**MVP complete**

Core functionality includes CSV ingestion, database-backed analytics, interactive dashboards, AI-assisted querying, operational reporting, and PDF export.