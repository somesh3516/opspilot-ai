import sqlite3
from pathlib import Path

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


def get_pending_invoices_over(amount: float) -> list[dict]:
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


def get_invoices_by_risk(risk: str) -> list[dict]:
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


def get_department_spending() -> list[dict]:
    connection = get_connection()

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