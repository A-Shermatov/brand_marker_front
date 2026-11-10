"use client"

import { RouteError } from "@/components/layout/route-error"

export default function RouteErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} homeHref="/customer" homeLabel="На главную кабинета" />
}
