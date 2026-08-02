"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Download,
  FileText,
  Loader2,
} from "lucide-react"

import {
  API_URL,
  getDashboardData,
  type DashboardResponse,
} from "@/lib/api"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Badge } from "@/components/ui/badge"
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadReportData() {
      try {
        const response = await getDashboardData()
        setData(response)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load report data."
        )
      } finally {
        setLoading(false)
      }
    }

    loadReportData()
  }, [])

  function handleDownloadPdf() {
    window.location.href =
      `${API_URL}/reports/operational-summary.pdf`
  }

  const pendingRate =
    data && data.summary.total_invoices > 0
      ? (data.summary.pending_invoices /
          data.summary.total_invoices) *
        100
      : 0

  const highRiskRate =
    data && data.summary.total_invoices > 0
      ? (data.summary.high_risk_invoices /
          data.summary.total_invoices) *
        100
      : 0

  const topDepartment = data?.department_spending?.[0]
  const topVendor = data?.top_vendors?.[0]

  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div>
              <h1 className="text-lg font-semibold">
                Operational Reports
              </h1>

              <p className="text-sm text-muted-foreground">
                Executive summary of the active invoice dataset.
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            Live report
          </Badge>
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
                <CardTitle>
                  Report unavailable
                </CardTitle>

                <CardDescription>
                  {error}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {data && (
            <>
              <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge variant="outline">
                    Executive summary
                  </Badge>

                  <h2 className="mt-3 text-3xl font-semibold">
                    Operational Summary
                  </h2>

                  <p className="mt-1 max-w-2xl text-muted-foreground">
                    Review spending, invoice volume, approval
                    workload, and operational risk across the
                    currently uploaded dataset.
                  </p>
                </div>

                <Button onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
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
                      {formatCurrency(
                        data.summary.total_spend
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Across the active dataset
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Invoice volume
                    </CardTitle>

                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {data.summary.total_invoices}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Total invoice records
                    </p>
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
                      {formatPercent(pendingRate)}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {data.summary.pending_invoices} pending
                      invoices
                    </p>
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
                      {formatPercent(highRiskRate)}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {data.summary.high_risk_invoices} high-risk
                      invoices
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Spending concentration
                    </CardTitle>

                    <CardDescription>
                      Highest-spend areas in the current dataset.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-1 h-5 w-5 text-muted-foreground" />

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Highest-spend department
                        </p>

                        <p className="font-semibold">
                          {topDepartment
                            ? topDepartment.department
                            : "No data"}
                        </p>

                        {topDepartment && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(
                              topDepartment.total_spending
                            )}{" "}
                            across{" "}
                            {topDepartment.invoice_count} invoices
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CircleDollarSign className="mt-1 h-5 w-5 text-muted-foreground" />

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Highest-spend vendor
                        </p>

                        <p className="font-semibold">
                          {topVendor
                            ? topVendor.vendor
                            : "No data"}
                        </p>

                        {topVendor && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(
                              topVendor.total_spending
                            )}{" "}
                            across {topVendor.invoice_count} invoices
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Operational findings
                    </CardTitle>

                    <CardDescription>
                      Automatically calculated observations from
                      the active dataset.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">
                          Approval workload
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {data.summary.pending_invoices} of{" "}
                          {data.summary.total_invoices} invoices are
                          pending, representing{" "}
                          {formatPercent(pendingRate)} of the current
                          dataset.
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="font-medium">
                          Risk exposure
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {data.summary.high_risk_invoices} invoices
                          are classified as high risk, representing{" "}
                          {formatPercent(highRiskRate)} of all
                          invoices.
                        </p>
                      </div>

                      {topDepartment && (
                        <div className="rounded-lg border p-4">
                          <p className="font-medium">
                            Department concentration
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {topDepartment.department} has the
                            highest departmental spend at{" "}
                            {formatCurrency(
                              topDepartment.total_spending
                            )}
                            .
                          </p>
                        </div>
                      )}

                      {topVendor && (
                        <div className="rounded-lg border p-4">
                          <p className="font-medium">
                            Vendor concentration
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {topVendor.vendor} is the highest-spend
                            vendor at{" "}
                            {formatCurrency(
                              topVendor.total_spending
                            )}
                            .
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </main>
      </SidebarInset>
    </>
  )
}