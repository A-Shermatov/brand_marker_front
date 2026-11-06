"use client"

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api/client"
import { SessionEndedHandler } from "@/components/auth/session-ended"

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (isUnauthorizedError(error)) return false
              return failureCount < 1
            },
          },
        },
        mutationCache: new MutationCache({
          onSuccess: (_data, _variables, _context, mutation) => {
            const message = mutation.meta?.successMessage
            if (!message || mutation.meta?.silent) return
            toast.success(message)
          },
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return
            toast.error(
              getApiErrorMessage(
                error,
                mutation.meta?.errorMessage ?? "Не удалось выполнить запрос",
              ),
            )
          },
        }),
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <SessionEndedHandler />
      {children}
    </QueryClientProvider>
  )
}
