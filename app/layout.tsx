import type { Metadata } from 'next'

import { IBM_Plex_Mono, Onest } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-onest',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL("https://brand-marker-front.vercel.app"),
  title: "Brend Market — B2B маркетплейс для бизнеса",
  description:
    "B2B-площадка для закупок компаний Таджикистана. Каталог, заявки, сделки с гарантией оплаты через банк-партнёр.",
  openGraph: {
    title: "Brend Market — B2B маркетплейс для бизнеса",
    description:
      "B2B-площадка для закупок компаний Таджикистана. Каталог, заявки, сделки с гарантией оплаты через банк-партнёр.",
    url: "https://brand-marker-front.vercel.app",
    siteName: "Brend Market",
    locale: "ru_TJ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brend Market — B2B маркетплейс для бизнеса",
    description:
      "B2B-площадка для закупок компаний Таджикистана.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`bg-canvas ${onest.variable} ${plexMono.variable}`}>
      <body className="bg-canvas font-sans text-[15px] text-ink antialiased">
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
