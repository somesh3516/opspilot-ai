"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AssistantResult = Record<string, string | number | null>

type AssistantResultsTableProps = {
  results: AssistantResult[]
}

function formatColumnName(column: string) {
  return column
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(
  column: string,
  value: string | number | null
) {
  if (value === null) {
    return "-"
  }

  if (
    typeof value === "number" &&
    (
      column === "amount" ||
      column === "total_spending" ||
      column === "total_spend" ||
      column === "average_invoice"
    )
  ) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value)
  }

  return value
}

function getRiskVariant(
  risk: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (risk.toLowerCase()) {
    case "high":
      return "destructive"
    case "medium":
      return "secondary"
    default:
      return "outline"
  }
}

export function AssistantResultsTable({
  results,
}: AssistantResultsTableProps) {
  if (!results.length) {
    return null
  }

  const columns = Object.keys(results[0])

  return (
    <div className="mt-4 overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">
            Query results
          </p>

          <p className="text-xs text-muted-foreground">
            {results.length} matching{" "}
            {results.length === 1 ? "record" : "records"}
          </p>
        </div>

        <Badge variant="secondary">
          {results.length} results
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>
                  {formatColumnName(column)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {results.slice(0, 10).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => {
                  const value = row[column]

                  if (
                    column === "risk" &&
                    typeof value === "string"
                  ) {
                    return (
                      <TableCell key={column}>
                        <Badge variant={getRiskVariant(value)}>
                          {value}
                        </Badge>
                      </TableCell>
                    )
                  }

                  if (
                    column === "status" &&
                    typeof value === "string"
                  ) {
                    return (
                      <TableCell key={column}>
                        <Badge variant="outline">
                          {value}
                        </Badge>
                      </TableCell>
                    )
                  }

                  return (
                    <TableCell
                      key={column}
                      className={
                        column === "vendor"
                          ? "font-medium"
                          : undefined
                      }
                    >
                      {formatValue(column, value)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {results.length > 10 && (
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          Showing the first 10 of {results.length} matching records.
        </div>
      )}
    </div>
  )
}