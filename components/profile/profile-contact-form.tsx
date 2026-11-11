"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckIcon, CircleNotchIcon, LockSimpleIcon, TruckIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { myChangesKey } from "@/components/profile/pending-review-notice"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"

const labelClass = "mb-1.5 block text-[13.5px] font-medium text-ink"

/**
 * Who the person is and how to reach them: name, phone, city, and whether
 * they deliver. The email is the sign-in and cannot be changed here, which the
 * field says. A new name waits for an admin, like the photo.
 */
export function ProfileContactForm({ side }: { side: "buyer" | "supplier" }) {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const queryClient = useQueryClient()
  const useApi = isApiEnabled()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [hasDelivery, setHasDelivery] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setPhone(user.phone ?? "")
    setCity(user.city ?? "")
    setHasDelivery(user.hasDelivery ?? false)
  }, [user])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim() || user?.name || ""
    const parts = trimmedName.split(/\s+/)
    const firstName = parts[0] ?? ""
    const lastName = parts.slice(1).join(" ") || firstName

    setSaving(true)
    try {
      let nameWaits = false
      if (useApi) {
        const result = await authApi.updateProfile({
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim() || null,
        })
        // A new name is shown to others only after an admin approves it.
        nameWaits = Boolean(result.pending_changes?.some((f) => f === "first_name" || f === "last_name"))
        await queryClient.invalidateQueries({ queryKey: myChangesKey })
        if (nameWaits) toast.success("Новое имя отправлено на проверку администратору")
      }
      updateProfile({
        name: nameWaits ? (user?.name ?? trimmedName) : trimmedName,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        hasDelivery,
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось сохранить профиль"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSave(event)}
      aria-label="Контактные данные"
      className="rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
    >
      <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden>
          <UserCircleIcon weight="duotone" className="size-6" />
        </span>
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Контактные данные</h2>
          <p className="text-[13.5px] text-mute">Как к вам обращаться и как с вами связаться</p>
        </div>
      </header>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
        <div>
          <label htmlFor="name" className={labelClass}>
            Имя / контактное лицо
          </label>
          <Input maxLength={100} id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Телефон
          </label>
          <Input
            maxLength={24}
            id="phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+992 90 123 45 67"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <div className="relative">
            <Input id="email" value={user?.email ?? ""} disabled className="pr-9" />
            <LockSimpleIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          </div>
          <p className="mt-1 text-[12.5px] text-mute">Это ваш логин. Изменить его можно через поддержку.</p>
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            Город
          </label>
          <Input maxLength={50} id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Душанбе" />
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors sm:col-span-2",
            hasDelivery ? "border-brand-600 bg-brand-50" : "border-line hover:border-line-strong",
          )}
        >
          <input
            type="checkbox"
            checked={hasDelivery}
            onChange={(e) => setHasDelivery(e.target.checked)}
            className="size-4 accent-[var(--brand-600)]"
          />
          <TruckIcon weight="duotone" className="size-6 shrink-0 text-brand-600" aria-hidden />
          <span>
            <span className="block text-[14px] font-semibold text-ink">У меня есть доставка</span>
            <span className="block text-[13px] text-mute">
              {side === "supplier"
                ? "Доставляю товары покупателям своими силами или через службу"
                : "Могу забрать товар или организовать доставку самостоятельно"}
            </span>
          </span>
        </label>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-line px-5 py-3.5 sm:px-6">
        {saved ? (
          <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-safe-700" role="status">
            <CheckIcon weight="bold" className="size-4" aria-hidden /> Сохранено
          </span>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? <CircleNotchIcon className="size-4 animate-spin" aria-hidden /> : null}
          Сохранить изменения
        </Button>
      </footer>
    </form>
  )
}
