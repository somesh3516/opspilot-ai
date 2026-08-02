export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000"

export type Invoice = {
  id: number
  vendor: string
  department: string
  amount: number
  status: string
  risk: string
}

export type DepartmentSpending = {
  department: string
  total_spending: number
  invoice_count: number
}

export type RiskDistribution = {
  risk: string
  count: number
}

export type StatusDistribution = {
  status: string
  count: number
}

export type TopVendor = {
  vendor: string
  total_spending: number
  invoice_count: number
}

export type AssistantResult = Record<
  string,
  string | number | null
>

export type AssistantResponse = {
  answer: string
  results: AssistantResult[]
  intent: string
}

export type UploadResponse = {
  message: string
  imported_count: number
}

export type DashboardResponse = {
  summary: {
    total_invoices: number
    pending_invoices: number
    high_risk_invoices: number
    total_spend: number
    department_count: number
  }

  recent_invoices: Invoice[]
  department_spending: DepartmentSpending[]
  risk_distribution: RiskDistribution[]
  status_distribution: StatusDistribution[]
  top_vendors: TopVendor[]
}

export async function askAssistant(
  question: string
): Promise<AssistantResponse> {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Failed to contact the backend."
    )
  }

  return data
}

export async function uploadInvoiceCsv(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData()

  formData.append("file", file)

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail ?? "The CSV upload failed."
    )
  }

  return data
}

export async function getDashboardData(): Promise<DashboardResponse> {
  const response = await fetch(`${API_URL}/dashboard`, {
    cache: "no-store",
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Failed to load dashboard data."
    )
  }

  return data
}