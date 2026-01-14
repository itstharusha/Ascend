"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StrategyViewerProps {
  content: string
}

export function StrategyViewer({ content }: StrategyViewerProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6 md:p-8 prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 gradient-text">{children}</h1>,
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">{children}</h3>,
            p: ({ children }) => <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 ml-4 space-y-2 list-disc list-inside">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 ml-4 space-y-2 list-decimal list-inside">{children}</ol>,
            li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ className, children }) => {
              const isInline = !className
              return isInline ? (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">{children}</code>
              ) : (
                <code className={cn("block p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto", className)}>
                  {children}
                </code>
              )
            },
            pre: ({ children }) => <pre className="mb-4 rounded-lg bg-muted p-4 overflow-x-auto">{children}</pre>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-border">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>
            ),
            td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
            hr: () => <hr className="my-8 border-border" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  )
}
