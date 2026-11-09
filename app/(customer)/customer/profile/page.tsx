"use client"

import { useEffect, useState } from "react"
import { TruckIcon as Truck, CheckIcon as Check, SignOutIcon as LogOut } from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { ChangePasswordCard } from "@/components/auth/change-password-card"
import { TwoFactorSettings } from "@/components/auth/two-factor-settings"
import { IdentityVerificationCard } from "@/components/verification/identity-verification-card"
import { authApi } from "@/lib/api/auth"
import { AvatarUploader } from "@/components/profile/avatar-uploader"

export default function ProfilePage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [hasDelivery, setHasDelivery] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const useApi = isApiEnabled()
  const actsAsIndividual =
    user?.actors?.find((actor) => actor.id === user.activeActorId)?.kind === "individual"

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone ?? "")
      setCity(user.city ?? "")
      setHasDelivery(user.hasDelivery ?? false)
    }
  }, [user])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim() || user?.name || ""
    const parts = trimmedName.split(/\s+/)
    const firstName = parts[0] ?? ""
    const lastName = parts.slice(1).join(" ") || firstName

    setSaving(true)
    try {
      if (useApi) {
        await authApi.updateProfile({
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim() || null,
        })
      }
      updateProfile({
        name: trimmedName,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        hasDelivery,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-primary/35 bg-card text-sm outline-none transition-[color,border-color,box-shadow] duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-primary/60 focus:border-primary focus:ring-[3px] focus:ring-primary/20"

  if (!hydrated) return null

  return (
    <PageFrame>
      <PageHeader
        title="Профиль заказчика"
        description="Контактные данные и настройки доставки"
      />

      <div className="space-y-6">
      <AvatarUploader />
      <form onSubmit={handleSave} className="space-y-6">
        <PageSurface className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Имя / контактное лицо</label>
              <Input maxLength={100} id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input maxLength={50} id="email" value={email} disabled className={cn(inputClass, "bg-muted text-muted-foreground cursor-not-allowed")} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">Телефон</label>
              <input maxLength={15} id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1.5">Город</label>
              <input maxLength={50} id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Душанбе" className={inputClass} />
            </div>
          </div>
        </PageSurface>

        <PageSurface className="p-5 sm:p-6">
          <h2 className="text-sm font-bold text-foreground mb-1">Доставка</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Укажите, если вы можете организовать доставку своими силами
          </p>
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={hasDelivery}
              onChange={(e) => setHasDelivery(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <Truck size={18} className="text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">У меня есть доставка</div>
              <div className="text-[11px] text-muted-foreground">Готов забрать или организовать доставку самостоятельно</div>
            </div>
          </label>
        </PageSurface>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut size={16} /> Выйти
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saved ? (
              <>
                <Check size={16} /> Сохранено
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
      <IdentityVerificationCard enabled={useApi && actsAsIndividual} />
      <ChangePasswordCard />
      <TwoFactorSettings />
      </div>
    </PageFrame>
  )
}
