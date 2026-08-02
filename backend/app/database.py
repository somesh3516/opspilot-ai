import sqlite3
from pathlib import Path
from typing import Any

DATABASE_PATH = Path(__file__).resolve().parent.parent / "opspilot.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor TEXT NOT NULL,
            department TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            risk TEXT NOT NULL
        )
        """
    )

    existing_count = connection.execute(
        "SELECT COUNT(*) AS count FROM invoices"
    ).fetchone()["count"]

    if existing_count == 0:
        invoices = [
            ("Northstar Systems", "Technology", 14850, "Pending", "High"),
            ("BrightPath Consulting", "Operations", 8200, "Review", "Medium"),
            ("Capital Office Supply", "Finance", 3940, "Approved", "Low"),
            ("Summit Data Group", "Technology", 11400, "Pending", "Medium"),
            ("Vertex Security", "Technology", 6750, "Pending", "High"),
            ("Blue Ridge Logistics", "Operations", 4200, "Pending", "Low"),
            ("Pioneer Analytics", "Finance", 9800, "Pending", "Medium"),
            ("Metro Facilities", "Facilities", 12500, "Approved", "Low"),
        ]

        connection.executemany(
            """
            INSERT INTO invoices (
                vendor,
                department,
                amount,
                status,
                risk
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            invoices,
        )

    connection.commit()
    connection.close()


def replace_invoices(invoices: list[dict[str, Any]]) -> int:
    connection = get_connection()

    try:
        connection.execute("DELETE FROM invoices")

        connection.executemany(
            """
            INSERT INTO invoices (
                vendor,
                department,
                amount,
                status,
                risk
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    invoice["vendor"],
                    invoice["department"],
                    invoice["amount"],
                    invoice["status"],
                    invoice["risk"],
                )
                for invoice in invoices
            ],
        )

        connection.commit()
        return len(invoices)

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def get_all_invoices() -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        ORDER BY amount DESC
        """
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_recent_invoices(limit: int = 8) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_dashboard_summary() -> dict[str, Any]:
    connection = get_connection()

    summary = connection.execute(
        """
        SELECT
            COUNT(*) AS total_invoices,
            SUM(
                CASE
                    WHEN LOWER(status) = 'pending' THEN 1
                    ELSE 0
                END
            ) AS pending_invoices,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'high' THEN 1
                    ELSE 0
                END
            ) AS high_risk_invoices,
            ROUND(COALESCE(SUM(amount), 0), 2) AS total_spend,
            COUNT(DISTINCT department) AS department_count
        FROM invoices
        """
    ).fetchone()

    connection.close()
    return dict(summary)


def get_risk_distribution() -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            risk,
            COUNT(*) AS count
        FROM invoices
        GROUP BY risk
        ORDER BY count DESC
        """
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_status_distribution() -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            status,
            COUNT(*) AS count
        FROM invoices
        GROUP BY status
        ORDER BY count DESC
        """
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_department_spending(
    department: str | None = None,
) -> list[dict[str, Any]]:
    connection = get_connection()

    if department:
        rows = connection.execute(
            """
            SELECT
                department,
                ROUND(SUM(amount), 2) AS total_spending,
                COUNT(*) AS invoice_count
            FROM invoices
            WHERE LOWER(department) = LOWER(?)
            GROUP BY department
            ORDER BY total_spending DESC
            """,
            (department,),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            SELECT
                department,
                ROUND(SUM(amount), 2) AS total_spending,
                COUNT(*) AS invoice_count
            FROM invoices
            GROUP BY department
            ORDER BY total_spending DESC
            """
        ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_vendor_spending(
    vendor: str | None = None,
) -> list[dict[str, Any]]:
    connection = get_connection()

    if vendor:
        rows = connection.execute(
            """
            SELECT
                vendor,
                ROUND(SUM(amount), 2) AS total_spending,
                COUNT(*) AS invoice_count
            FROM invoices
            WHERE LOWER(vendor) = LOWER(?)
            GROUP BY vendor
            ORDER BY total_spending DESC
            """,
            (vendor,),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            SELECT
                vendor,
                ROUND(SUM(amount), 2) AS total_spending,
                COUNT(*) AS invoice_count
            FROM invoices
            GROUP BY vendor
            ORDER BY total_spending DESC
            """
        ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_top_vendors(limit: int = 10) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            vendor,
            ROUND(SUM(amount), 2) AS total_spending,
            COUNT(*) AS invoice_count
        FROM invoices
        GROUP BY vendor
        ORDER BY total_spending DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def analyze_invoices(
    plan: dict[str, Any],
) -> dict[str, Any]:
    connection = get_connection()

    where_clauses: list[str] = []
    parameters: list[Any] = []

    departments = plan.get("departments") or []
    vendors = plan.get("vendors") or []
    risks = plan.get("risks") or []
    statuses = plan.get("statuses") or []

    min_amount = plan.get("min_amount")
    max_amount = plan.get("max_amount")

    if departments:
        placeholders = ",".join("?" for _ in departments)

        where_clauses.append(
            f"LOWER(department) IN ({placeholders})"
        )

        parameters.extend(
            department.lower()
            for department in departments
        )

    if vendors:
        placeholders = ",".join("?" for _ in vendors)

        where_clauses.append(
            f"LOWER(vendor) IN ({placeholders})"
        )

        parameters.extend(
            vendor.lower()
            for vendor in vendors
        )

    if risks:
        placeholders = ",".join("?" for _ in risks)

        where_clauses.append(
            f"LOWER(risk) IN ({placeholders})"
        )

        parameters.extend(
            risk.lower()
            for risk in risks
        )

    if statuses:
        placeholders = ",".join("?" for _ in statuses)

        where_clauses.append(
            f"LOWER(status) IN ({placeholders})"
        )

        parameters.extend(
            status.lower()
            for status in statuses
        )

    if min_amount is not None:
        where_clauses.append("amount >= ?")
        parameters.append(float(min_amount))

    if max_amount is not None:
        where_clauses.append("amount <= ?")
        parameters.append(float(max_amount))

    where_sql = ""

    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    rows = connection.execute(
        f"""
        SELECT
            id,
            vendor,
            department,
            amount,
            status,
            risk
        FROM invoices
        {where_sql}
        ORDER BY amount DESC
        """,
        parameters,
    ).fetchall()

    records = [dict(row) for row in rows]

    total_spend = round(
        sum(float(record["amount"]) for record in records),
        2,
    )

    average_amount = (
        round(total_spend / len(records), 2)
        if records
        else 0
    )

    summary = {
        "count": len(records),
        "total_spend": total_spend,
        "average_amount": average_amount,
        "pending_count": sum(
            1
            for record in records
            if record["status"].lower() == "pending"
        ),
        "approved_count": sum(
            1
            for record in records
            if record["status"].lower() == "approved"
        ),
        "review_count": sum(
            1
            for record in records
            if record["status"].lower() == "review"
        ),
        "high_risk_count": sum(
            1
            for record in records
            if record["risk"].lower() == "high"
        ),
        "medium_risk_count": sum(
            1
            for record in records
            if record["risk"].lower() == "medium"
        ),
        "low_risk_count": sum(
            1
            for record in records
            if record["risk"].lower() == "low"
        ),
    }

    department_rows = connection.execute(
        f"""
        SELECT
            department,
            COUNT(*) AS count,
            ROUND(SUM(amount), 2) AS total_spend,
            ROUND(AVG(amount), 2) AS average_amount,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'high' THEN 1
                    ELSE 0
                END
            ) AS high_risk_count,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'medium' THEN 1
                    ELSE 0
                END
            ) AS medium_risk_count,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'low' THEN 1
                    ELSE 0
                END
            ) AS low_risk_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'pending' THEN 1
                    ELSE 0
                END
            ) AS pending_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'approved' THEN 1
                    ELSE 0
                END
            ) AS approved_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'review' THEN 1
                    ELSE 0
                END
            ) AS review_count
        FROM invoices
        {where_sql}
        GROUP BY department
        ORDER BY total_spend DESC
        """,
        parameters,
    ).fetchall()

    department_breakdown = [
        dict(row)
        for row in department_rows
    ]

    vendor_rows = connection.execute(
        f"""
        SELECT
            vendor,
            COUNT(*) AS count,
            ROUND(SUM(amount), 2) AS total_spend,
            ROUND(AVG(amount), 2) AS average_amount,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'high' THEN 1
                    ELSE 0
                END
            ) AS high_risk_count,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'medium' THEN 1
                    ELSE 0
                END
            ) AS medium_risk_count,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'low' THEN 1
                    ELSE 0
                END
            ) AS low_risk_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'pending' THEN 1
                    ELSE 0
                END
            ) AS pending_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'approved' THEN 1
                    ELSE 0
                END
            ) AS approved_count,
            SUM(
                CASE
                    WHEN LOWER(status) = 'review' THEN 1
                    ELSE 0
                END
            ) AS review_count
        FROM invoices
        {where_sql}
        GROUP BY vendor
        ORDER BY total_spend DESC
        """,
        parameters,
    ).fetchall()

    vendor_breakdown = [
        dict(row)
        for row in vendor_rows
    ]

    risk_rows = connection.execute(
        f"""
        SELECT
            risk,
            COUNT(*) AS count,
            ROUND(SUM(amount), 2) AS total_spend,
            ROUND(AVG(amount), 2) AS average_amount
        FROM invoices
        {where_sql}
        GROUP BY risk
        ORDER BY count DESC
        """,
        parameters,
    ).fetchall()

    risk_breakdown = [
        dict(row)
        for row in risk_rows
    ]

    status_rows = connection.execute(
        f"""
        SELECT
            status,
            COUNT(*) AS count,
            ROUND(SUM(amount), 2) AS total_spend,
            ROUND(AVG(amount), 2) AS average_amount
        FROM invoices
        {where_sql}
        GROUP BY status
        ORDER BY count DESC
        """,
        parameters,
    ).fetchall()

    status_breakdown = [
        dict(row)
        for row in status_rows
    ]

    largest_invoice = (
        records[0]
        if records
        else None
    )

    smallest_invoice = (
        min(
            records,
            key=lambda record: record["amount"],
        )
        if records
        else None
    )

    connection.close()

    return {
        "filters": {
            "departments": departments,
            "vendors": vendors,
            "risks": risks,
            "statuses": statuses,
            "min_amount": min_amount,
            "max_amount": max_amount,
        },
        "summary": summary,
        "department_breakdown": department_breakdown,
        "vendor_breakdown": vendor_breakdown,
        "risk_breakdown": risk_breakdown,
        "status_breakdown": status_breakdown,
        "largest_invoice": largest_invoice,
        "smallest_invoice": smallest_invoice,
        "records": records,
    }