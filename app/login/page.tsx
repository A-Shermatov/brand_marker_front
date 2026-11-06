"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { SessionEndedNotice } from "@/components/auth/session-ended"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { BrandLogo, BmInput } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge"
import { useAuthStore } from "@/lib/store/auth-store"
import type { MarketplaceSessionRole } from "@/lib/store/auth-store"
import { isApiEnabled } from "@/lib/api/config"
import { getApiErrorMessage } from "@/lib/api/client"
import { registerUrl } from "@/lib/marketplace-routes"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(4, "Минимум 4 символа"),
})

type FormValues = z.infer<typeof schema>

const roleCards: {
  role: MarketplaceSessionRole
  title: string
  desc: string
}[] = [
  {
    role: "customer",
    title: "Покупать",
    desc: "для своей компании",
  },
  {
    role: "supplier",
    title: "Продавать",
    desc: "товары и услуги",
  },
]

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrated = useHydrated()
  const login = useAuthStore((s) => s.login)
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials)
  const completeLoginWith2fa = useAuthStore((s) => s.completeLoginWith2fa)
  const isReady = useAuthStore((s) => s.isReady)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<"in" | "up">("in")
  const [role, setRole] = useState<MarketplaceSessionRole>("customer")
  const [apiError, setApiError] = useState<string | null>(null)
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [otpBusy, setOtpBusy] = useState(false)
  const useApi = isApiEnabled()

  const finishLogin = (sessionRole: MarketplaceSessionRole | "admin") => {
    toast.success("Вы вошли в систему")
    if (sessionRole === "admin") {
      router.push("/admin")
      return
    }
    const redirect = searchParams.get("redirect") || searchParams.get("next")
    const roleHome = sessionRole === "customer" ? "/customer" : "/supplier"
    const marketplaceRedirect =
      redirect &&
      !redirect.startsWith("/admin") &&
      redirect.startsWith(roleHome)
        ? redirect
        : null
    router.replace(marketplaceRedirect || roleHome)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (!hydrated || !isReady || !isAuthenticated || !user) return
    if (user.role === "admin") {
      router.replace("/admin")
      return
    }
    if (user.role !== "customer" && user.role !== "supplier") return
    const roleHome = user.role === "supplier" ? "/supplier" : "/customer"
    const redirect = searchParams.get("redirect") || searchParams.get("next")
    const safeRedirect =
      redirect
      && !redirect.startsWith("/admin")
      && redirect.startsWith(roleHome)
        ? redirect
        : roleHome
    router.replace(safeRedirect)
  }, [hydrated, isReady, isAuthenticated, user, router, searchParams])

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      if (useApi) {
        const result = await loginWithCredentials({
          email: values.email,
          password: values.password,
          role,
        })
        if (result.status === "needs_2fa") {
          setChallengeToken(result.challengeToken)
          return
        }
        finishLogin(result.role)
        return
      }
      login({ email: values.email, role })
      finishLogin(role)
    } catch (err) {
      const message = getApiErrorMessage(err, "Ошибка входа")
      setApiError(message)
      toast.error(message)
    }
  }

  const onVerify2fa = async (code: string) => {
    if (!challengeToken) return
    setApiError(null)
    setOtpBusy(true)
    try {
      const sessionRole = await completeLoginWith2fa({
        challengeToken,
        code,
        role,
      })
      setChallengeToken(null)
      finishLogin(sessionRole)
    } catch (err) {
      const message = getApiErrorMessage(err, "Неверный код")
      setApiError(message)
      toast.error(message)
    } finally {
      setOtpBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-4 lg:px-8">
        <BrandLogo />
        <Link
          href="/"
          className="text-[14px] font-semibold text-mute hover:text-ink"
        >
          На главную
        </Link>
      </div>

      <div className="grid flex-1 place-items-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(28,28,26,.05),0_20px_40px_-28px_rgba(28,28,26,.35)] sm:p-8">
          {challengeToken ? (
            <TwoFactorChallenge
              busy={otpBusy}
              error={apiError}
              onSubmit={onVerify2fa}
              onBack={() => {
                setChallengeToken(null)
                setApiError(null)
              }}
            />
          ) : (
            <>
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-surface-muted p-1">
            {(
              [
                ["in", "Вход"],
                ["up", "Регистрация"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "up") {
                    router.push(registerUrl())
                    return
                  }
                  setTab(key)
                }}
                className={cn(
                  "h-10 rounded-lg text-[15px] font-semibold transition",
                  tab === key
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                    : "text-mute hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <SessionEndedNotice />
          <h1 className="mb-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">
            Вход в Brend Market
          </h1>
          <p className="mb-6 text-[15px] text-mute">
            Для покупателей и поставщиков
          </p>

          <div className="mb-5 grid gap-2">
            <span className="text-[13.5px] font-medium text-ink">Что вы хотите делать?</span>
            <div className="grid grid-cols-2 gap-2">
              {roleCards.map(({ role: r, title, desc }) => {
                const active = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-[border-color,box-shadow,background-color]",
                      active
                        ? "border-brand-600 bg-brand-50/50 shadow-[0_0_0_1px_var(--brand-600)]"
                        : "border-line-strong hover:border-faint",
                    )}
                  >
                    <b className="block text-[14.5px] font-semibold text-ink">{title}</b>
                    <span className="text-[13px] text-mute">{desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-[13.5px] font-medium text-ink">
                Email
              </label>
              <BmInput
                maxLength={100}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.tj"
                error={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-[13px] text-red-700">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-[13.5px] font-medium text-ink">
                Пароль
              </label>
              <BmInput
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-[13px] text-red-700">{errors.password.message}</p>
              ) : (
                <p className="text-[13px] text-mute">
                  Войдите в кабинет {role === "customer" ? "покупателя" : "поставщика"}.
                </p>
              )}
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-semibold text-brand-700 hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full text-[15px]"
            >
              Войти
              <ArrowRight className="size-4" />
            </Button>

            {apiError ? (
              <p className="text-center text-[13px] text-red-700">{apiError}</p>
            ) : null}
          </form>

          <p className="mt-4 text-[12.5px] text-mute">
            Продолжая, вы принимаете условия использования и политику обработки персональных данных.
          </p>

          <p className="mt-5 text-center text-[14px] text-mute">
            Нет аккаунта?{" "}
            <Link href={registerUrl()} className="font-semibold text-brand-700 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <LoginContent />
    </Suspense>
  )
}
