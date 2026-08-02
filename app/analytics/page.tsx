"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  Loader2,
  ShieldAlert,
} from "lucide-react"

import {
  getDashboardData,
  type DashboardResponse,
} from "@/lib/api"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { RiskChart } from "@/components/dashboard/risk-chart"
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getDashboardData()
        setData(response)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics."
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b px-6">
          <SidebarTrigger />

          <div>
            <h1 className="text-lg font-semibold">
              Analytics
            </h1>

            <p className="text-sm text-muted-foreground">
              Explore spending, vendors, risk, and invoice status trends.
            </p>
          </div>
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
                <CardTitle>Analytics unavailable</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          )}

          {data && (
            <>
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

                    <p className="mt-1 text-xs text-muted-foreground">
                      Across the active dataset
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Departments
                    </CardTitle>

                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {data.summary.department_count}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Unique departments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      High-risk invoices
                    </CardTitle>

                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {data.summary.high_risk_invoices}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Require additional review
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">
                      Total invoices
                    </CardTitle>

                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {data.summary.total_invoices}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Records currently analyzed
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Department spending
                    </CardTitle>

                    <CardDescription>
                      Compare total invoice spend across departments.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <SpendingChart
                      data={data.department_spending}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Risk distribution
                    </CardTitle>

                    <CardDescription>
                      Distribution of Low, Medium, and High risk invoices.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <RiskChart
                      data={data.risk_distribution}
                    />
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Top vendors by spend
                    </CardTitle>

                    <CardDescription>
                      Vendors ranked by total invoice value.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <VendorChart
                      data={data.top_vendors}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Invoice status distribution
                    </CardTitle>

                    <CardDescription>
                      Current breakdown of Approved, Pending, and Review invoices.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <StatusChart
                      data={data.status_distribution}
                    />
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