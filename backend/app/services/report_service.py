from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.database import (
    get_dashboard_summary,
    get_department_spending,
    get_top_vendors,
)


def format_currency(value: float) -> str:
    return f"${value:,.2f}"


def generate_operational_summary_pdf() -> BytesIO:
    summary = get_dashboard_summary()
    departments = get_department_spending()
    vendors = get_top_vendors()

    top_department = departments[0] if departments else None
    top_vendor = vendors[0] if vendors else None

    total_invoices = summary["total_invoices"] or 0
    pending_invoices = summary["pending_invoices"] or 0
    high_risk_invoices = summary["high_risk_invoices"] or 0

    pending_rate = (
        (pending_invoices / total_invoices) * 100
        if total_invoices
        else 0
    )

    high_risk_rate = (
        (high_risk_invoices / total_invoices) * 100
        if total_invoices
        else 0
    )

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
        title="OpsPilot AI Operational Summary",
    )

    styles = getSampleStyleSheet()

    story = []

    story.append(
        Paragraph(
            "OpsPilot AI - Operational Summary",
            styles["Title"],
        )
    )

    story.append(
        Paragraph(
            "Executive summary generated from the active invoice dataset.",
            styles["BodyText"],
        )
    )

    story.append(Spacer(1, 18))

    summary_data = [
        ["Metric", "Value"],
        ["Total Spend", format_currency(summary["total_spend"])],
        ["Total Invoices", str(total_invoices)],
        ["Pending Invoices", str(pending_invoices)],
        ["Pending Rate", f"{pending_rate:.1f}%"],
        ["High-Risk Invoices", str(high_risk_invoices)],
        ["High-Risk Rate", f"{high_risk_rate:.1f}%"],
        ["Departments", str(summary["department_count"])],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[2.6 * inch, 2.6 * inch],
    )

    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F9FAFB")),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    story.append(summary_table)
    story.append(Spacer(1, 22))

    story.append(
        Paragraph(
            "Key Findings",
            styles["Heading2"],
        )
    )

    findings = [
        (
            f"The active dataset contains {total_invoices} invoices "
            f"totaling {format_currency(summary['total_spend'])}."
        ),
        (
            f"{pending_invoices} invoices are pending approval, "
            f"representing {pending_rate:.1f}% of all records."
        ),
        (
            f"{high_risk_invoices} invoices are classified as high risk, "
            f"representing {high_risk_rate:.1f}% of the dataset."
        ),
    ]

    if top_department:
        findings.append(
            f"{top_department['department']} has the highest department spend "
            f"at {format_currency(top_department['total_spending'])} "
            f"across {top_department['invoice_count']} invoices."
        )

    if top_vendor:
        findings.append(
            f"{top_vendor['vendor']} is the highest-spend vendor "
            f"at {format_currency(top_vendor['total_spending'])} "
            f"across {top_vendor['invoice_count']} invoices."
        )

    for finding in findings:
        story.append(
            Paragraph(
                f"- {finding}",
                styles["BodyText"],
            )
        )
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 16))

    story.append(
        Paragraph(
            "Top Vendors",
            styles["Heading2"],
        )
    )

    vendor_data = [
        ["Vendor", "Total Spend", "Invoices"]
    ]

    for vendor in vendors[:5]:
        vendor_data.append(
            [
                vendor["vendor"],
                format_currency(vendor["total_spending"]),
                str(vendor["invoice_count"]),
            ]
        )

    vendor_table = Table(
        vendor_data,
        colWidths=[3.0 * inch, 1.5 * inch, 1.0 * inch],
    )

    vendor_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("PADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(vendor_table)

    document.build(story)

    buffer.seek(0)

    return buffer