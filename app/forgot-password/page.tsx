"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRightIcon as ArrowRight, EnvelopeOpenIcon as MailCheck } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"

const schema = z.object({
  email: z.string().email("Введите корректный email"),
})

type FormValues = z.infer<typeof schema>

const GENERIC_MESSAGE = "Если аккаунт существует, мы отправили письмо"

export default function ForgotPasswordPage() {
  const useApi = isApiEnabled()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    if (!useApi) {
      setApiError("Восстановление пароля доступно при подключении к API")
      return
    }
    try {
      await authApi.forgotPassword(values.email.trim())
      setSentTo(values.email.trim())
    } catch (err) {
      const message = getApiErrorMessage(err, "Не удалось отправить запрос")
      setApiError(message)
      toast.error(message)
    }
  }

  return (
    <AuthShell>
      {sentTo ? (
        <div className="grid gap-4 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <MailCheck className="size-6" />
          </div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink">
            Проверьте почту
          </h1>
          <p className="text-[15px] text-mute">
            {GENERIC_MESSAGE} на <b className="text-ink">{sentTo}</b>. Ссылка для
            сброса пароля действует ограниченное время. Не пришло письмо —
            проверьте папку «Спам» или повторите запрос через минуту.
          </p>
          <Button asChild className="mt-1 h-12 w-full text-[16px]">
            <Link href="/login">Вернуться ко входу</Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
            Восстановление пароля
          </h1>
          <p className="mb-6 text-[15px] text-mute">
            Укажите email аккаунта — мы отправим ссылку для создания нового пароля.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-[14px] font-semibold text-ink">
                Email
              </label>
              <Input
                id="email"
                type="email"
                maxLength={100}
                autoComplete="email"
                placeholder="you@company.tj"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-[13px] text-red-700">{errors.email.message}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-12 w-full text-[16px]"
            >
              {isSubmitting ? "Отправка..." : "Отправить ссылку"}
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>

            {apiError ? (
              <p className="text-center text-[13px] text-red-700" role="alert">
                {apiError}
              </p>
            ) : null}
          </form>

          <p className="mt-5 text-center text-[14px] text-mute">
            Вспомнили пароль?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Войти
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
