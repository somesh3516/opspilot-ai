"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Download,
  FileText,
  Loader2,
  Store,
} from "lucide-react"

import {
  getDashboardData,
  type DashboardResponse,
} from "@/lib/api"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await getDashboardData()
        setData(response)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load report."
        )
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [])

  const report = useMemo(() => {
    if (!data) {
      return null
    }

    const topDepartment = data.department_spending[0]
    const topVendor = data.top_vendors[0]

    const pendingRate =
      data.summary.total_invoices > 0
        ? (data.summary.pending_invoices /
            data.summary.total_invoices) *
          100
        : 0

    const highRiskRate =
      data.summary.total_invoices > 0
        ? (data.summary.high_risk_invoices /
            data.summary.total_invoices) *
          100
        : 0

    return {
      topDepartment,
      topVendor,
      pendingRate,
      highRiskRate,
    }
  }, [data])

  function downloadPdf() {
    window.open(
      `${API_URL}/reports/operational-summary.pdf`,
      "_blank"
    )
  }

  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div>
              <h1 className="text-lg font-semibold">
                Reports
              </h1>

              <p className="text-sm text-muted-foreground">
                Review an operational summary of the active dataset.
              </p>
            </div>
          </div>

          <Button
            onClick={downloadPdf}
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading report...
            </div>
          )}

          {error && (
            <Card>
              <CardHeader>
                <CardTitle>Report unavailable</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          )}

          {data && report && (
            <>
              <section>
                <h2 className="text-3xl font-semibold">
                  Operational Summary
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Executive-level overview generated from the current invoice dataset.
                </p>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Total spend
                    </CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(data.summary.total_spend)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Total invoices
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {data.summary.total_invoices}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Pending rate
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {report.pendingRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      High-risk rate
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {report.highRiskRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Top department
                    </CardTitle>

                    <CardDescription>
                      Department with the highest total invoice spend.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {report.topDepartment?.department ?? "N/A"}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {report.topDepartment
                        ? `${formatCurrency(
                            report.topDepartment.total_spending
                          )} across ${
                            report.topDepartment.invoice_count
                          } invoices`
                        : "No department data available."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Top vendor
                    </CardTitle>

                    <CardDescription>
                      Vendor with the highest total invoice spend.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {report.topVendor?.vendor ?? "N/A"}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {report.topVendor
                        ? `${formatCurrency(
                            report.topVendor.total_spending
                          )} across ${
                            report.topVendor.invoice_count
                          } invoices`
                        : "No vendor data available."}
                    </p>
                  </CardContent>
                </Card>
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>Executive findings</CardTitle>

                  <CardDescription>
                    Key observations from the active invoice dataset.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <p>
                    The dataset contains{" "}
                    <strong>{data.summary.total_invoices}</strong>{" "}
                    invoices totaling{" "}
                    <strong>
                      {formatCurrency(data.summary.total_spend)}
                    </strong>
                    .
                  </p>

                  <p>
                    <strong>{data.summary.pending_invoices}</strong>{" "}
                    invoices are pending approval, representing{" "}
                    <strong>{report.pendingRate.toFixed(1)}%</strong>{" "}
                    of all records.
                  </p>

                  <p>
                    <strong>{data.summary.high_risk_invoices}</strong>{" "}
                    invoices are classified as high risk, or{" "}
                    <strong>{report.highRiskRate.toFixed(1)}%</strong>{" "}
                    of the dataset.
                  </p>

                  {report.topDepartment && (
                    <p>
                      <strong>{report.topDepartment.department}</strong>{" "}
                      has the highest department spend at{" "}
                      <strong>
                        {formatCurrency(
                          report.topDepartment.total_spending
                        )}
                      </strong>
                      .
                    </p>
                  )}

                  {report.topVendor && (
                    <p>
                      <strong>{report.topVendor.vendor}</strong>{" "}
                      is the highest-spend vendor at{" "}
                      <strong>
                        {formatCurrency(
                          report.topVendor.total_spending
                        )}
                      </strong>
                      .
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </>
  )
}