"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { BrandLogo } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/store/auth-store"
import type { MarketplaceSessionRole } from "@/lib/store/auth-store"
import { getApiErrorMessage } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const schema = z
  .object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(8, "Минимум 8 символов"),
    confirmPassword: z.string().min(8, "Минимум 8 символов"),
    first_name: z.string().min(1, "Введите имя"),
    last_name: z.string().min(1, "Введите фамилию"),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
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

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registerWithCredentials = useAuthStore((s) => s.registerWithCredentials)
  const [tab, setTab] = useState<"in" | "up">("up")
  const [role, setRole] = useState<MarketplaceSessionRole>("customer")
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
      phone: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await registerWithCredentials({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone?.trim() || undefined,
        role,
      })
      toast.success("Регистрация прошла успешно")
      const redirect = searchParams.get("redirect")
      const roleHome = role === "customer" ? "/customer" : "/supplier"
      const marketplaceRedirect =
        redirect &&
        !redirect.startsWith("/admin") &&
        redirect.startsWith(roleHome)
          ? redirect
          : null
      router.push(marketplaceRedirect || roleHome)
    } catch (err) {
      const message = getApiErrorMessage(err, "Ошибка регистрации")
      setApiError(message)
      toast.error(message)
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
                  if (key === "in") {
                    router.push("/login")
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

          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
            Регистрация в Brend Market
          </h1>
          <p className="mb-6 text-[15px] text-mute">
            Для покупателей и поставщиков
          </p>

          <div className="mb-5 grid gap-2">
            <span className="text-[14px] font-semibold text-ink">Что вы хотите делать?</span>
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
                    <b className="block text-[15px] text-ink">{title}</b>
                    <span className="text-[13px] text-mute">{desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="first_name" className="text-[14px] font-semibold text-ink">
                  Имя
                </label>
                <Input
                  maxLength={100}
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Иван"
                  aria-invalid={Boolean(errors.first_name)}
                  {...register("first_name")}
                />
                {errors.first_name ? (
                  <p className="text-[13px] text-red-700">{errors.first_name.message}</p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="last_name" className="text-[14px] font-semibold text-ink">
                  Фамилия
                </label>
                <Input
                  maxLength={100}
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Иванов"
                  aria-invalid={Boolean(errors.last_name)}
                  {...register("last_name")}
                />
                {errors.last_name ? (
                  <p className="text-[13px] text-red-700">{errors.last_name.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-[14px] font-semibold text-ink">
                Email
              </label>
              <Input
                maxLength={100}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.tj"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-[13px] text-red-700">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="phone" className="text-[14px] font-semibold text-ink">
                Телефон{" "}
                <span className="font-normal text-mute">(необязательно)</span>
              </label>
              <Input
                maxLength={20}
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+992 90 123 45 67"
                {...register("phone")}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-[14px] font-semibold text-ink">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 8 символов"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-[13px] text-red-700">{errors.password.message}</p>
              ) : (
                <p className="text-[13px] text-mute">
                  Создайте кабинет {role === "customer" ? "покупателя" : "поставщика"}.
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="confirmPassword" className="text-[14px] font-semibold text-ink">
                Подтвердите пароль
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-[13px] text-red-700">{errors.confirmPassword.message}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-12 w-full text-[16px]"
            >
              Зарегистрироваться
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
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <RegisterContent />
    </Suspense>
  )
}
