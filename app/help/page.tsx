import Link from "next/link"
import { QuestionIcon as HelpCircle } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { guaranteeUrl, newRfqRedirect, verificationUrl } from "@/lib/marketplace-routes"

export default function HelpPage() {
  const topics = [
    { title: "Как разместить заказ", href: newRfqRedirect() },
    { title: "Гарантии и безопасность", href: guaranteeUrl() },
    { title: "Верификация исполнителей", href: verificationUrl() },
    { title: "Условия размещения", href: "/help" },
  ]

  return (
    <PageShell>
      <section className="bg-background py-12">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
              <HelpCircle size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Помощь и поддержка</h1>
              <p className="text-sm text-muted-foreground mt-1">Ответы на частые вопросы о работе платформы</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {topics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className="block px-6 py-4 text-sm font-semibold text-foreground hover:text-primary hover:bg-secondary/40 transition-colors"
              >
                {topic.title}
              </Link>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Не нашли ответ? Позвоните{" "}
            <a href="tel:88005553535" className="text-primary font-semibold hover:underline">
              +992 92 882 9955
            </a>
          </p>
        </div>
      </section>
    </PageShell>
  )
}
