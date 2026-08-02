"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  FileText,
  Loader2,
  ReceiptText,
} from "lucide-react"

import {
  API_URL,
  type Invoice,
} from "@/lib/api"

import { AppSidebar } from "@/components/layout/app-sidebar"

import { AverageInvoiceChart } from "@/components/dashboard/average-invoice-chart"
import { HighRiskDepartmentChart } from "@/components/dashboard/high-risk-department-chart"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { StatusChart } from "@/components/dashboard/status-chart"
import { VendorChart } from "@/components/dashboard/vendor-chart"

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


type DepartmentAnalytics = {
  department: string
  total_spending: number
  invoice_count: number
  average_amount: number
  pending_count: number
  high_risk_count: number
  percent_of_spend: number
}


type VendorAnalytics = {
  vendor: string
  total_spending: number
  invoice_count: number
}


type StatusAnalytics = {
  status: string
  count: number
}


function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}


function formatCurrencyExact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")


  useEffect(() => {
    async function loadInvoices() {
      try {
        const response = await fetch(
          `${API_URL}/invoices`,
          {
            cache: "no-store",
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ??
              "Unable to load analytics data."
          )
        }

        setInvoices(data.invoices ?? [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics data."
        )
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])


  const departments = useMemo(() => {
    return Array.from(
      new Set(
        invoices.map(
          (invoice) => invoice.department
        )
      )
    ).sort()
  }, [invoices])


  const filteredInvoices = useMemo(() => {
    if (
      selectedDepartment === "All Departments"
    ) {
      return invoices
    }

    return invoices.filter(
      (invoice) =>
        invoice.department === selectedDepartment
    )
  }, [invoices, selectedDepartment])


  const totalSpend = useMemo(() => {
    return filteredInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.amount),
      0
    )
  }, [filteredInvoices])


  const averageInvoice = useMemo(() => {
    if (filteredInvoices.length === 0) {
      return 0
    }

    return totalSpend / filteredInvoices.length
  }, [filteredInvoices, totalSpend])


  const pendingInvoices = useMemo(() => {
    return filteredInvoices.filter(
      (invoice) =>
        invoice.status.toLowerCase() ===
        "pending"
    ).length
  }, [filteredInvoices])


  const highRiskInvoices = useMemo(() => {
    return filteredInvoices.filter(
      (invoice) =>
        invoice.risk.toLowerCase() === "high"
    ).length
  }, [filteredInvoices])


  const departmentAnalytics =
    useMemo<DepartmentAnalytics[]>(() => {
      const map = new Map<
        string,
        {
          total: number
          count: number
          pending: number
          highRisk: number
        }
      >()

      invoices.forEach((invoice) => {
        const current = map.get(
          invoice.department
        ) ?? {
          total: 0,
          count: 0,
          pending: 0,
          highRisk: 0,
        }

        current.total += Number(invoice.amount)
        current.count += 1

        if (
          invoice.status.toLowerCase() ===
          "pending"
        ) {
          current.pending += 1
        }

        if (
          invoice.risk.toLowerCase() ===
          "high"
        ) {
          current.highRisk += 1
        }

        map.set(invoice.department, current)
      })

      const fullDatasetSpend =
        invoices.reduce(
          (sum, invoice) =>
            sum + Number(invoice.amount),
          0
        )

      return Array.from(map.entries())
        .map(([department, values]) => ({
          department,
          total_spending: values.total,
          invoice_count: values.count,
          average_amount:
            values.count > 0
              ? values.total / values.count
              : 0,
          pending_count: values.pending,
          high_risk_count: values.highRisk,
          percent_of_spend:
            fullDatasetSpend > 0
              ? (values.total /
                  fullDatasetSpend) *
                100
              : 0,
        }))
        .sort(
          (a, b) =>
            b.total_spending -
            a.total_spending
        )
    }, [invoices])


  const visibleDepartmentAnalytics =
    useMemo(() => {
      if (
        selectedDepartment ===
        "All Departments"
      ) {
        return departmentAnalytics
      }

      return departmentAnalytics.filter(
        (item) =>
          item.department ===
          selectedDepartment
      )
    }, [
      departmentAnalytics,
      selectedDepartment,
    ])


  const spendingData = useMemo(() => {
    return visibleDepartmentAnalytics.map(
      (department) => ({
        department: department.department,
        total_spending:
          department.total_spending,
        invoice_count:
          department.invoice_count,
      })
    )
  }, [visibleDepartmentAnalytics])


  const averageInvoiceData = useMemo(() => {
    return visibleDepartmentAnalytics.map(
      (department) => ({
        department: department.department,
        average_amount:
          department.average_amount,
      })
    )
  }, [visibleDepartmentAnalytics])


  const highRiskDepartmentData =
    useMemo(() => {
      return visibleDepartmentAnalytics
        .map((department) => ({
          department:
            department.department,
          high_risk_count:
            department.high_risk_count,
        }))
        .sort(
          (a, b) =>
            b.high_risk_count -
            a.high_risk_count
        )
    }, [visibleDepartmentAnalytics])


  const vendorData =
    useMemo<VendorAnalytics[]>(() => {
      const map = new Map<
        string,
        {
          total: number
          count: number
        }
      >()

      filteredInvoices.forEach(
        (invoice) => {
          const current = map.get(
            invoice.vendor
          ) ?? {
            total: 0,
            count: 0,
          }

          current.total += Number(
            invoice.amount
          )

          current.count += 1

          map.set(
            invoice.vendor,
            current
          )
        }
      )

      return Array.from(map.entries())
        .map(([vendor, values]) => ({
          vendor,
          total_spending: values.total,
          invoice_count: values.count,
        }))
        .sort(
          (a, b) =>
            b.total_spending -
            a.total_spending
        )
        .slice(0, 10)
    }, [filteredInvoices])


  const statusData =
    useMemo<StatusAnalytics[]>(() => {
      const map = new Map<
        string,
        number
      >()

      filteredInvoices.forEach(
        (invoice) => {
          map.set(
            invoice.status,
            (map.get(invoice.status) ?? 0) +
              1
          )
        }
      )

      return Array.from(map.entries())
        .map(([status, count]) => ({
          status,
          count,
        }))
        .sort(
          (a, b) =>
            b.count - a.count
        )
    }, [filteredInvoices])


  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div>
              <h1 className="text-lg font-semibold">
                Analytics
              </h1>

              <p className="text-sm text-muted-foreground">
                Investigate spending,
                exposure, vendors, and
                operational risk.
              </p>
            </div>
          </div>

          <select
            value={selectedDepartment}
            onChange={(event) =>
              setSelectedDepartment(
                event.target.value
              )
            }
            className="h-9 min-w-[190px] rounded-md border bg-background px-3 text-sm"
          >
            <option>
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading analytics...
            </div>
          )}

          {error && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Analytics unavailable
                </CardTitle>

                <CardDescription>
                  {error}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {!loading &&
            !error &&
            invoices.length > 0 && (
              <>
                <section>
                  <h2 className="text-2xl font-semibold">
                    Operational Analysis
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDepartment ===
                    "All Departments"
                      ? "Deep dive across the active invoice dataset."
                      : `Deep dive into ${selectedDepartment} invoice activity.`}
                  </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                          totalSpend
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Current selection
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm">
                        Average invoice
                      </CardTitle>

                      <ReceiptText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                      <div className="text-2xl font-semibold">
                        {formatCurrency(
                          averageInvoice
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Average exposure
                      </p>
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
                        {
                          filteredInvoices.length
                        }
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Records analyzed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm">
                        Pending invoices
                      </CardTitle>

                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                      <div className="text-2xl font-semibold">
                        {pendingInvoices}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Awaiting action
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm">
                        High-risk invoices
                      </CardTitle>

                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                      <div className="text-2xl font-semibold">
                        {highRiskInvoices}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Require review
                      </p>
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Total spend by department
                      </CardTitle>

                      <CardDescription>
                        Compare overall financial
                        exposure across departments.
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <SpendingChart
                        data={spendingData}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Average invoice by department
                      </CardTitle>

                      <CardDescription>
                        Identify departments with
                        larger individual invoice
                        exposure.
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <AverageInvoiceChart
                        data={
                          averageInvoiceData
                        }
                      />
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        High-risk invoices by department
                      </CardTitle>

                      <CardDescription>
                        See where operational risk
                        is concentrated.
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <HighRiskDepartmentChart
                        data={
                          highRiskDepartmentData
                        }
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Invoice status distribution
                      </CardTitle>

                      <CardDescription>
                        Review workflow health across
                        Approved, Pending, and Review
                        invoices.
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <StatusChart
                        data={statusData}
                      />
                    </CardContent>
                  </Card>
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Top vendors by spend
                    </CardTitle>

                    <CardDescription>
                      Identify vendors representing
                      the greatest financial exposure.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <VendorChart
                      data={vendorData}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />

                      <div>
                        <CardTitle>
                          Department performance
                          overview
                        </CardTitle>

                        <CardDescription>
                          Compare spending,
                          average invoice exposure,
                          workflow, and risk.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            Department
                          </TableHead>

                          <TableHead className="text-right">
                            Total Spend
                          </TableHead>

                          <TableHead className="text-right">
                            Avg Invoice
                          </TableHead>

                          <TableHead className="text-right">
                            Invoices
                          </TableHead>

                          <TableHead className="text-right">
                            Pending
                          </TableHead>

                          <TableHead className="text-right">
                            High Risk
                          </TableHead>

                          <TableHead className="text-right">
                            % of Spend
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {visibleDepartmentAnalytics.map(
                          (department) => (
                            <TableRow
                              key={
                                department.department
                              }
                            >
                              <TableCell className="font-medium">
                                {
                                  department.department
                                }
                              </TableCell>

                              <TableCell className="text-right">
                                {formatCurrencyExact(
                                  department.total_spending
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                {formatCurrencyExact(
                                  department.average_amount
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                {
                                  department.invoice_count
                                }
                              </TableCell>

                              <TableCell className="text-right">
                                {
                                  department.pending_count
                                }
                              </TableCell>

                              <TableCell className="text-right">
                                {
                                  department.high_risk_count
                                }
                              </TableCell>

                              <TableCell className="text-right">
                                {department.percent_of_spend.toFixed(
                                  1
                                )}
                                %
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
        </main>
      </SidebarInset>
    </>
  )
}