const API_URL = "http://127.0.0.1:8000"

export async function askAssistant(question: string) {
  const response = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to contact backend")
  }

  return response.json()
}