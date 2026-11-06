"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { SessionEndedNotice } from "@/components/auth/session-ended"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge"
import { BrandLogo } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHydrated } from "@/hooks/use-hydrated"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"

const adminLoginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(4, "Минимум 4 символа"),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

const adminRoles = new Set(["admin", "superadmin", "moderator"])

const AdminLoginContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const loginAdminWithCredentials = useAuthStore(
    (state) => state.loginAdminWithCredentials,
  )
  const completeAdminLoginWith2fa = useAuthStore(
    (state) => state.completeAdminLoginWith2fa,
  )
  const [apiError, setApiError] = useState<string | null>(null)
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [otpBusy, setOtpBusy] = useState(false)
  const apiEnabled = isApiEnabled()
  const isAdmin =
    isAuthenticated &&
    user?.role === "admin" &&
    adminRoles.has(user.platformRole)
  const requestedRedirect = searchParams.get("redirect")
  const adminRedirect =
    requestedRedirect?.startsWith("/admin") &&
    !requestedRedirect.startsWith("/admin/login")
      ? requestedRedirect
      : "/admin"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (hydrated && isAdmin) {
      router.replace(adminRedirect)
    }
  }, [adminRedirect, hydrated, isAdmin, router])

  const handleLogin = async (values: AdminLoginValues) => {
    setApiError(null)
    if (!apiEnabled) {
      setApiError("Для входа администратора необходимо подключение к API")
      return
    }

    try {
      const result = await loginAdminWithCredentials(values)
      if (result.status === "needs_2fa") {
        setChallengeToken(result.challengeToken)
        return
      }
      toast.success("Вы вошли в систему")
      router.replace(adminRedirect)
    } catch (error) {
      const message = getApiErrorMessage(error, "Ошибка входа администратора")
      setApiError(message)
      toast.error(message)
    }
  }

  const handleVerify2fa = async (code: string) => {
    if (!challengeToken) return
    setApiError(null)
    setOtpBusy(true)
    try {
      await completeAdminLoginWith2fa({ challengeToken, code })
      setChallengeToken(null)
      toast.success("Вы вошли в систему")
      router.replace(adminRedirect)
    } catch (error) {
      const message = getApiErrorMessage(error, "Неверный код")
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
        <div className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(28,28,26,.05),0_20px_40px_-28px_rgba(28,28,26,.35)] sm:p-9">
          {challengeToken ? (
            <TwoFactorChallenge
              busy={otpBusy}
              error={apiError}
              onSubmit={handleVerify2fa}
              onBack={() => {
                setChallengeToken(null)
                setApiError(null)
              }}
            />
          ) : (
            <>
          <SessionEndedNotice />
          <h1 className="mb-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">
            Вход администратора
          </h1>
          <p className="mb-6 text-[15px] text-mute">
            Служебная зона Brend Market
          </p>

          <form onSubmit={handleSubmit(handleLogin)} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="admin-email" className="text-[14px] font-semibold text-ink">
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "admin-email-error" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p id="admin-email-error" className="text-[13px] text-red-700">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="admin-password" className="text-[14px] font-semibold text-ink">
                Пароль
              </label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "admin-password-error" : "admin-password-hint"
                }
                {...register("password")}
              />
              {errors.password ? (
                <p id="admin-password-error" className="text-[13px] text-red-700">
                  {errors.password.message}
                </p>
              ) : (
                <p id="admin-password-hint" className="text-[13px] text-mute">
                  Доступ только для сотрудников платформы.
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
              disabled={isSubmitting || !apiEnabled}
              className="mt-1 h-12 w-full text-[16px]"
            >
              {isSubmitting ? "Проверка доступа..." : "Войти в панель"}
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>

            {apiError ? (
              <p className="text-center text-[13px] text-red-700" role="alert">
                {apiError}
              </p>
            ) : null}
          </form>

          <p className="mt-4 text-[12.5px] text-mute">
            Продолжая, вы принимаете условия использования и политику обработки персональных данных.
          </p>

          <p className="mt-5 text-center text-[14px] text-mute">
            Не сотрудник?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Вход для покупателей и поставщиков
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <AdminLoginContent />
    </Suspense>
  )
}
