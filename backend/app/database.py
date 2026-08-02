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


def get_pending_invoices_over(amount: float) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        WHERE LOWER(status) = 'pending'
          AND amount > ?
        ORDER BY amount DESC
        """,
        (amount,),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_invoices_by_risk(risk: str) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        WHERE LOWER(risk) = LOWER(?)
        ORDER BY amount DESC
        """,
        (risk,),
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


def get_department_invoices(
    department: str,
) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        WHERE LOWER(department) = LOWER(?)
        ORDER BY amount DESC
        """,
        (department,),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_invoices_by_amount_range(
    min_amount: float,
    max_amount: float,
) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        WHERE amount BETWEEN ? AND ?
        ORDER BY amount DESC
        """,
        (min_amount, max_amount),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_invoices_by_risk_and_status(
    risk: str,
    status: str,
) -> list[dict[str, Any]]:
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, vendor, department, amount, status, risk
        FROM invoices
        WHERE LOWER(risk) = LOWER(?)
          AND LOWER(status) = LOWER(?)
        ORDER BY amount DESC
        """,
        (risk, status),
    ).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def get_invoice_summary() -> list[dict[str, Any]]:
    connection = get_connection()

    row = connection.execute(
        """
        SELECT
            COUNT(*) AS total_invoices,
            ROUND(COALESCE(SUM(amount), 0), 2) AS total_spend,
            ROUND(COALESCE(AVG(amount), 0), 2) AS average_invoice,
            SUM(
                CASE
                    WHEN LOWER(status) = 'pending' THEN 1
                    ELSE 0
                END
            ) AS pending_invoices,
            SUM(
                CASE
                    WHEN LOWER(status) = 'approved' THEN 1
                    ELSE 0
                END
            ) AS approved_invoices,
            SUM(
                CASE
                    WHEN LOWER(status) = 'review' THEN 1
                    ELSE 0
                END
            ) AS review_invoices,
            SUM(
                CASE
                    WHEN LOWER(risk) = 'high' THEN 1
                    ELSE 0
                END
            ) AS high_risk_invoices
        FROM invoices
        """
    ).fetchone()

    connection.close()
    return [dict(row)]