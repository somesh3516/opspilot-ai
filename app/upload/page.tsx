"use client"

import { useState } from "react"
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react"

import { uploadInvoiceCsv } from "@/lib/api"
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
import { Input } from "@/components/ui/input"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleUpload() {
    if (!selectedFile || isUploading) {
      return
    }

    setIsUploading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const response = await uploadInvoiceCsv(selectedFile)

      setSuccessMessage(
        `${response.imported_count} invoice records imported successfully.`
      )

      setSelectedFile(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The upload failed."
      )
    } finally {
      setIsUploading(false)
    }
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
                Upload Data
              </h1>

              <p className="text-sm text-muted-foreground">
                Import invoice data for AI analysis.
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            CSV supported
          </Badge>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload invoice file
              </CardTitle>

              <CardDescription>
                Uploading a new file replaces the current active dataset.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-xl border border-dashed p-10 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-lg font-medium">
                  Choose a CSV file
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Required columns: vendor, department, amount, status, risk
                </p>

                <Input
                  type="file"
                  accept=".csv,text/csv"
                  className="mx-auto mt-6 max-w-md"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0] ?? null

                    setSelectedFile(file)
                    setSuccessMessage("")
                    setErrorMessage("")
                  }}
                />
              </div>

              {selectedFile && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-sm font-medium">
                    Selected file
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedFile.name}
                  </p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg border p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-lg border border-destructive p-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Button
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Upload and import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </>
  )
}