"use client"

import { HourglassMediumIcon } from "@phosphor-icons/react/dist/ssr"
import { useQuery } from "@tanstack/react-query"
import { authApi } from "@/lib/api/auth"
import { isApiEnabled } from "@/lib/api/config"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

/** What each field is called on the page, for "На проверке: описание, логотип". */
export const PROFILE_FIELD_LABELS: Record<string, string> = {
  title: "название",
  legal_name: "юридическое название",
  tax_number: "ИНН",
  address: "адрес",
  city: "город",
  country: "страна",
  website: "сайт",
  description: "описание",
  logo: "логотип",
  cover: "обложка",
  founded_year: "год основания",
  employees_count: "число сотрудников",
  annual_revenue_range: "оборот",
  languages: "языки",
  industries: "отрасли",
  warehouse_area: "склад",
  markets: "рынки",
  brands: "бренды",
  notable_clients: "клиенты",
  gallery: "фото компании",
  category_ids: "категории",
  first_name: "имя",
  last_name: "фамилия",
  avatar_url: "фото профиля",
  page: "личная страница",
}

export const describePendingFields = (fields: string[]) => {
  const names = [...new Set(fields.map((f) => PROFILE_FIELD_LABELS[f] ?? f))]
  return names.join(", ")
}

export const myChangesKey = ["auth", "me", "changes"] as const

/** My name, photo or page changes still waiting for an admin. */
export const useMyPendingChanges = () => {
  const hydrated = useHydrated()
  return useQuery({
    queryKey: myChangesKey,
    queryFn: () => authApi.myChanges(),
    enabled: hydrated && isApiEnabled(),
  })
}

/**
 * Says which edits wait for an admin and that everyone still sees the old
 * version until then. Renders nothing when nothing waits.
 */
export function PendingReviewNotice({
  fields,
  className,
}: {
  fields: string[] | null | undefined
  className?: string
}) {
  if (!fields?.length) return null
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
        className,
      )}
    >
      <HourglassMediumIcon className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
      <p>
        <b className="font-semibold">На проверке у администратора: {describePendingFields(fields)}.</b>{" "}
        Пока идёт проверка, все видят прежние данные. Когда администратор закончит, придёт уведомление.
      </p>
    </div>
  )
}
