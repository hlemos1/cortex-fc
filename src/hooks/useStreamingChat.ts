"use client"

import { useState, useCallback, useRef } from "react"

interface StreamingState {
  isStreaming: boolean
  streamedText: string
  error: string | null
}

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      onToken?: (text: string) => void,
      onComplete?: (fullText: string, messageId?: string) => void
    ) => {
      abortRef.current = new AbortController()
      setState({ isStreaming: true, streamedText: "", error: null })

      try {
        const res = await fetch(`/api/chat?stream=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: content }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) throw new Error("Failed to send message")

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""
        let buffer = ""

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events from buffer
          const lines = buffer.split("\n")
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || ""

          let currentEvent = ""
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (currentEvent === "done" || (!currentEvent && data.messageId)) {
                  // Final event with message ID
                  onComplete?.(accumulated, data.messageId)
                } else if (currentEvent === "error") {
                  setState((prev) => ({ ...prev, error: data.message }))
                } else if (data.text) {
                  // Token event
                  accumulated += data.text
                  setState((prev) => ({ ...prev, streamedText: accumulated }))
                  onToken?.(data.text)
                }
              } catch {
                // Ignore malformed JSON lines
              }
              currentEvent = ""
            } else if (line === "") {
              currentEvent = ""
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Unknown error" }))
        }
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }))
      }
    },
    []
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return { ...state, sendMessage, stopGeneration }
}
