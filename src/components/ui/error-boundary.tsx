"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { friendlyError } from "@/lib/error-messages"

interface Props {
  children: ReactNode
  fallbackTitle?: string
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const msg = friendlyError(this.state.error?.message)
      const isNetworkError = this.state.error?.message?.toLowerCase().includes("fetch") ||
        this.state.error?.message?.toLowerCase().includes("network")

      return (
        <div className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
          this.props.className
        )}>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            {isNetworkError ? (
              <WifiOff className="w-6 h-6 text-amber-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <h3 className="text-zinc-300 text-sm font-medium mb-1">
            {this.props.fallbackTitle ?? "Algo deu errado"}
          </h3>
          <p className="text-zinc-500 text-xs max-w-sm mb-5">{msg}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
