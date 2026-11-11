"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRightIcon as ArrowRight,
  BuildingsIcon as Buildings,
  UserIcon as User,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { BrandLogo } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/store/auth-store"
import type { MarketplaceSessionRole } from "@/lib/store/auth-store"
import { invitationsApi } from "@/lib/api/auth"
import { isApiEnabled } from "@/lib/api/config"
import { getApiErrorMessage } from "@/lib/api/client"
import { companyRoleLabel } from "@/lib/company-team"
import {
  ACCOUNT_TYPE_OPTIONS,
  afterRegisterPath,
  type AccountType,
} from "@/lib/account-type"
import { cn } from "@/lib/utils"

const schema = z
  .object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(8, "Минимум 8 символов"),
    confirmPassword: z.string().min(8, "Минимум 8 символов"),
    first_name: z.string().min(1, "Введите имя"),
    last_name: z.string().min(1, "Введите фамилию"),
    phone: z.string().optional(),
    company_title: z.string().optional(),
    headline: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

const roleCards: {
  role: MarketplaceSessionRole
  title: string
  desc: Record<AccountType, string>
}[] = [
  {
    role: "customer",
    title: "Покупать",
    desc: { company: "для своей компании", individual: "товары и услуги для себя" },
  },
  {
    role: "supplier",
    title: "Продавать",
    desc: { company: "товары и услуги", individual: "свои услуги и работу" },
  },
]

const choiceClass = (active: boolean) =>
  cn(
    "rounded-xl border p-3.5 text-left transition-[border-color,box-shadow,background-color]",
    active
      ? "border-brand-600 bg-brand-50/50 shadow-[0_0_0_1px_var(--brand-600)]"
      : "border-line-strong hover:border-faint",
  )

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registerWithCredentials = useAuthStore((s) => s.registerWithCredentials)
  const inviteToken = searchParams.get("invite")?.trim() || null
  // A link like /register?role=supplier&type=individual opens with that choice made.
  const [role, setRole] = useState<MarketplaceSessionRole>(
    searchParams.get("role") === "supplier" ? "supplier" : "customer",
  )
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get("type") === "individual" ? "individual" : "company",
  )
  const [apiError, setApiError] = useState<string | null>(null)

  const invitation = useQuery({
    queryKey: ["invitation-preview", inviteToken],
    queryFn: () => invitationsApi.preview(inviteToken!),
    enabled: Boolean(inviteToken) && isApiEnabled(),
    retry: false,
  })
  const invite = invitation.data?.status === "pending" ? invitation.data : null
  const inviteGone = Boolean(inviteToken) && !invitation.isLoading && !invite

  const {
    register,
    handleSubmit,
    setError,
    setValue,
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
      company_title: "",
      headline: "",
    },
  })

  useEffect(() => {
    if (invite?.email) setValue("email", invite.email)
  }, [invite?.email, setValue])

  const asCompany = !invite && accountType === "company"
  const asPrivateSupplier = !invite && accountType === "individual" && role === "supplier"

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    const companyTitle = values.company_title?.trim() ?? ""
    if (asCompany && companyTitle.length < 2) {
      setError("company_title", { message: "Введите название компании" })
      return
    }
    try {
      const sessionRole = await registerWithCredentials({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone?.trim() || undefined,
        role,
        accountType,
        companyTitle: asCompany ? companyTitle : undefined,
        headline: asPrivateSupplier ? values.headline?.trim() || undefined : undefined,
        inviteToken: invite ? inviteToken ?? undefined : undefined,
      })
      toast.success(
        invite ? `Вы в команде компании «${invite.company_title}»` : "Регистрация прошла успешно",
      )
      const roleHome = sessionRole === "customer" ? "/customer" : "/supplier"
      const redirect = searchParams.get("redirect")
      const marketplaceRedirect =
        redirect && !redirect.startsWith("/admin") && redirect.startsWith(roleHome)
          ? redirect
          : null
      router.push(
        marketplaceRedirect ||
          afterRegisterPath({ role: sessionRole, accountType, invited: Boolean(invite) }),
      )
    } catch (err) {
      const message = getApiErrorMessage(err, "Ошибка регистрации")
      setApiError(message)
      toast.error(message)
    }
  }

  const loginHref = inviteToken ? `/login?next=${encodeURIComponent(`/invite/${inviteToken}`)}` : "/login"

  return (
    <div className="flex min-h-dvh flex-col bg-brand-field">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-4 lg:px-8">
        <BrandLogo dark />
        <Link
          href="/"
          className="text-[14px] font-semibold text-white/85 hover:text-white"
        >
          На главную
        </Link>
      </div>

      <div className="grid flex-1 place-items-center px-4 py-10">
        <div className="w-full max-w-[460px] rounded-2xl border border-line bg-card p-7 shadow-[0_2px_4px_rgb(0_30_90/0.15),0_40px_80px_-30px_rgb(0_25_80/0.6)] sm:p-9">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-surface-muted p-1">
            <Link
              href={loginHref}
              className="grid h-10 place-items-center rounded-lg text-[15px] font-semibold text-mute transition hover:text-ink"
            >
              Вход
            </Link>
            <span
              aria-current="page"
              className="grid h-10 place-items-center rounded-lg bg-card text-[15px] font-semibold text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
            >
              Регистрация
            </span>
          </div>

          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
            Регистрация в Brand Market
          </h1>

          {invite ? (
            <div
              className="mb-6 mt-3 rounded-xl border border-brand-600/30 bg-brand-50/60 p-4"
              data-testid="invite-notice"
            >
              <p className="text-[15px] font-semibold text-ink">
                Вас пригласили в компанию «{invite.company_title}»
              </p>
              <p className="mt-1 text-[14px] text-ink-soft">
                Уровень доступа: {companyRoleLabel(invite.role).toLowerCase()}.
                {invite.invited_by_name ? ` Пригласил: ${invite.invited_by_name}.` : ""} Заполните
                имя и пароль — и вы сразу попадёте в кабинет компании.
              </p>
            </div>
          ) : (
            <p className="mb-6 text-[15px] text-mute">Для компаний и частных специалистов</p>
          )}

          {inviteGone ? (
            <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[14px] text-amber-900">
              Приглашение больше не действует. Попросите руководителя компании отправить новое —
              или зарегистрируйтесь сами ниже.
            </div>
          ) : null}

          {!invite ? (
            <>
              <fieldset className="mb-4 grid gap-2">
                <legend className="mb-2 text-[14px] font-semibold text-ink">Кто вы?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPE_OPTIONS.map(({ type, title, desc }) => {
                    const Icon = type === "company" ? Buildings : User
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        aria-pressed={accountType === type}
                        className={choiceClass(accountType === type)}
                      >
                        <Icon className="mb-1.5 size-5 text-brand-700" aria-hidden />
                        <b className="block text-[15px] text-ink">{title}</b>
                        <span className="text-[13px] leading-snug text-mute">{desc}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset className="mb-5 grid gap-2">
                <legend className="mb-2 text-[14px] font-semibold text-ink">
                  Что вы хотите делать?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {roleCards.map(({ role: r, title, desc }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-pressed={role === r}
                      className={choiceClass(role === r)}
                    >
                      <b className="block text-[15px] text-ink">{title}</b>
                      <span className="text-[13px] text-mute">{desc[accountType]}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-mute">
                  Второе можно включить позже в кабинете — регистрироваться заново не нужно.
                </p>
              </fieldset>
            </>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            {asCompany ? (
              <div className="grid gap-1.5">
                <label htmlFor="company_title" className="text-[14px] font-semibold text-ink">
                  Название компании
                </label>
                <Input
                  maxLength={200}
                  id="company_title"
                  type="text"
                  autoComplete="organization"
                  placeholder="ООО «Сомон Трейд» или ИП Каримов"
                  aria-invalid={Boolean(errors.company_title)}
                  {...register("company_title")}
                />
                {errors.company_title ? (
                  <p className="text-[13px] text-red-700">{errors.company_title.message}</p>
                ) : (
                  <p className="text-[13px] text-mute">
                    ИНН, реквизиты и документы добавите позже в кабинете.
                  </p>
                )}
              </div>
            ) : null}

            {asPrivateSupplier ? (
              <div className="grid gap-1.5">
                <label htmlFor="headline" className="text-[14px] font-semibold text-ink">
                  Чем вы занимаетесь{" "}
                  <span className="font-normal text-mute">(необязательно)</span>
                </label>
                <Input
                  maxLength={120}
                  id="headline"
                  type="text"
                  placeholder="Программист, дизайнер, электрик…"
                  {...register("headline")}
                />
                <p className="text-[13px] text-mute">
                  Покупатели увидят это на вашей странице. Навыки и портфолио добавите после
                  регистрации.
                </p>
              </div>
            ) : null}

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
                readOnly={Boolean(invite)}
                aria-invalid={Boolean(errors.email)}
                className={invite ? "bg-surface-muted text-mute" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-[13px] text-red-700">{errors.email.message}</p>
              ) : invite ? (
                <p className="text-[13px] text-mute">
                  Приглашение выписано на этот адрес, изменить его нельзя.
                </p>
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
              ) : null}
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
              disabled={isSubmitting || (Boolean(inviteToken) && invitation.isLoading)}
              className="mt-1 h-12 w-full text-[16px]"
            >
              {invite ? "Зарегистрироваться и войти в компанию" : "Зарегистрироваться"}
              <ArrowRight className="size-4" />
            </Button>

            {apiError ? (
              <p role="alert" className="text-center text-[13px] text-red-700">
                {apiError}
              </p>
            ) : null}
          </form>

          <p className="mt-4 text-[12.5px] text-mute">
            Продолжая, вы принимаете условия использования и политику обработки персональных данных.
            Для защиты аккаунтов платформа записывает действия на сайте и сведения об устройстве и браузере.
          </p>

          <p className="mt-5 text-center text-[14px] text-mute">
            Уже есть аккаунт?{" "}
            <Link href={loginHref} className="font-semibold text-brand-700 hover:underline">
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
