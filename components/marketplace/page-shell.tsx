import { Suspense } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"

type PageShellProps = {
  children: React.ReactNode
}

export const PageShell = ({ children }: PageShellProps) => {
  return (
    <main className="min-h-screen bg-canvas">
      <Suspense fallback={<div className="h-16 border-b border-line bg-card" />}>
        <Header />
      </Suspense>
      {children}
      <Footer />
    </main>
  )
}
