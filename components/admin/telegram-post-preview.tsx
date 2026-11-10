"use client"

import { Fragment, useMemo, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { telegramApi } from "@/lib/api/telegram"

/**
 * The caption Telegram will show: the server builds it as Telegram HTML with
 * only <b> and <a> and the buyer's text escaped. It is turned into React
 * elements here, never put into the page as raw HTML.
 */
function Caption({ html }: { html: string }) {
  const nodes = useMemo(() => {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
    const walk = (node: Node, key: string): ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent
      if (!(node instanceof HTMLElement)) return null
      const children = [...node.childNodes].map((child, i) => walk(child, `${key}-${i}`))
      if (node.tagName === "B") return <b key={key}>{children}</b>
      if (node.tagName === "A") {
        return (
          <span key={key} className="text-[#168ACD] break-all">
            {children}
          </span>
        )
      }
      return <Fragment key={key}>{children}</Fragment>
    }
    return walk(doc.body.firstChild as Node, "c")
  }, [html])
  return <p className="whitespace-pre-line">{nodes}</p>
}

/** The next post as the channel will see it: the card, the caption, the button. */
export function TelegramPostPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-telegram", "preview"],
    queryFn: telegramApi.preview,
  })

  return (
    <div className="rounded-2xl bg-[#E7EEF5] p-3 dark:bg-[#0E1621]">
      <div className="overflow-hidden rounded-xl rounded-bl-sm bg-white text-[14px] leading-[1.45] text-[#0F1419] shadow-sm dark:bg-[#182533] dark:text-[#E9EEF2]">
        {isLoading ? (
          <div className="aspect-[1200/750] animate-pulse bg-[#DDE5EE] dark:bg-[#22303F]" />
        ) : data?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt="Картинка поста" className="block w-full" />
        ) : null}
        {data ? (
          <div className="p-3">
            <Caption html={data.caption} />
          </div>
        ) : null}
      </div>
      <div className="mt-1.5 rounded-lg bg-white/70 py-2 text-center text-[13.5px] font-medium text-[#168ACD] dark:bg-[#182533]/80">
        Открыть заявку
      </div>
      {data?.sample ? (
        <p className="mt-2 text-[12px] text-mute">Пример: открытых заявок сейчас нет.</p>
      ) : data && !data.image ? (
        <p className="mt-2 text-[12px] text-mute">
          На сервере нет шрифта для картинки — пост уйдёт текстом.
        </p>
      ) : null}
    </div>
  )
}
