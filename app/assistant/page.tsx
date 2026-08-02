"use client"

import { useState } from "react"
import {
  Bot,
  Database,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react"

import {
  askAssistant,
  type AssistantResult,
} from "@/lib/api"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AssistantResultsTable } from "@/components/assistant/assistant-results-table"
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

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
  results?: AssistantResult[]
}

const exampleQuestions = [
  "Show high-risk pending invoices.",
  "Which vendor has the highest total spending?",
  "Show invoices between $5,000 and $10,000.",
]

export default function AssistantPage() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello. I’m OpsPilot, your AI operations assistant. Ask me about invoices, spending, risk, approvals, vendors, or departments.",
    },
  ])

  async function sendMessage(question?: string) {
    const messageText = question ?? input.trim()

    if (!messageText || isLoading) {
      return
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ])

    setInput("")
    setIsLoading(true)

    try {
      const response = await askAssistant(messageText)

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.answer,
        results: response.results,
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ])
    } catch (error) {
      console.error(error)

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "I could not complete that request. Make sure the OpsPilot backend is running.",
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        errorMessage,
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div>
              <h1 className="text-lg font-semibold">
                AI Assistant
              </h1>

              <p className="text-sm text-muted-foreground">
                Ask questions about your uploaded business data.
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            <Sparkles className="mr-1 h-3 w-3" />
            AI connected
          </Badge>
        </header>

        <main className="grid flex-1 gap-6 p-4 md:p-6 xl:grid-cols-[1fr_320px]">
          <Card className="flex min-h-[700px] flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Ask OpsPilot
              </CardTitle>

              <CardDescription>
                Use plain English to explore operational data.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              <div className="flex-1 space-y-6 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[80%]"
                          : "w-full max-w-[90%]"
                      }
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border bg-muted/40"
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.role === "assistant" &&
                        message.results &&
                        message.results.length > 0 && (
                          <AssistantResultsTable
                            results={message.results}
                          />
                        )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing operational data...
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendMessage()
                  }}
                >
                  <Input
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    placeholder="Ask a business question..."
                    disabled={isLoading}
                  />

                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Example questions
                </CardTitle>

                <CardDescription>
                  Select a prompt to test the assistant.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {exampleQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                    onClick={() => sendMessage(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  Connected data
                </CardTitle>

                <CardDescription>
                  Current data sources available to OpsPilot.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Invoice records</span>
                  <Badge>Connected</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Vendor data</span>
                  <Badge>Connected</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Department data</span>
                  <Badge>Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </>
  )
}