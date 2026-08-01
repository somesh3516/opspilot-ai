import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Search,
  ShieldCheck,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

const invoices = [
  {
    vendor: "Northstar Systems",
    department: "Technology",
    amount: "$14,850",
    status: "Pending",
    risk: "High",
  },
  {
    vendor: "BrightPath Consulting",
    department: "Operations",
    amount: "$8,200",
    status: "Review",
    risk: "Medium",
  },
  {
    vendor: "Capital Office Supply",
    department: "Finance",
    amount: "$3,940",
    status: "Approved",
    risk: "Low",
  },
  {
    vendor: "Summit Data Group",
    department: "Technology",
    amount: "$11,400",
    status: "Pending",
    risk: "Medium",
  },
]

const metrics = [
  {
    title: "Pending approvals",
    value: "24",
    change: "+8% this week",
    icon: Clock3,
  },
  {
    title: "Invoice spend",
    value: "$184.2K",
    change: "+12.5% this month",
    icon: CircleDollarSign,
  },
  {
    title: "High-risk items",
    value: "7",
    change: "3 require attention",
    icon: AlertTriangle,
  },
  {
    title: "Completed reports",
    value: "48",
    change: "+6 since Monday",
    icon: FileCheck2,
  },
]

export default function Home() {
  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div>
              <h1 className="text-lg font-semibold">
                Operations Dashboard
              </h1>

              <p className="text-sm text-muted-foreground">
                Monitor activity, risk, and automated workflows.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="w-64 pl-9"
                placeholder="Search operations..."
              />
            </div>

            <Button variant="outline">
              View Reports
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="secondary">
                AI Operations Workspace
              </Badge>

              <h2 className="mt-3 text-3xl font-semibold">
                Welcome to OpsPilot AI
              </h2>

              <p className="mt-1 text-muted-foreground">
                Your AI-powered business operations platform.
              </p>
            </div>

            <Button asChild>
              <Link href="/assistant">
                <Bot className="mr-2 h-4 w-4" />
                Open AI Assistant
              </Link>
            </Button>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    {metric.title}
                  </CardTitle>

                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    Recent Invoice Activity
                  </CardTitle>

                  <CardDescription>
                    Current operational invoices.
                  </CardDescription>
                </div>

                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.vendor}>
                        <TableCell className="font-medium">
                          {invoice.vendor}
                        </TableCell>

                        <TableCell>
                          {invoice.department}
                        </TableCell>

                        <TableCell>
                          {invoice.amount}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {invoice.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {invoice.risk}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Assistant
                  </CardTitle>

                  <CardDescription>
                    Ask questions about your business using natural language.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    Try asking:
                    <p className="mt-2 font-medium">
                      Show pending invoices over $5,000 with elevated risk.
                    </p>
                  </div>

                  <Button asChild className="w-full">
                    <Link href="/assistant">
                      Open AI Assistant
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    System Status
                  </CardTitle>

                  <CardDescription>
                    All systems operational.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <Badge>Healthy</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>AI Services</span>
                    <Badge>Healthy</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Audit Logs</span>
                    <Badge>Healthy</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>
    </>
  )
}