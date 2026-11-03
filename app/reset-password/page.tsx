"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Минимум 8 символов")
      .max(128, "Максимум 128 символов"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  })

type FormValues = z.infer<typeof schema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const useApi = isApiEnabled()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    if (!useApi) {
      setApiError("Восстановление пароля доступно при подключении к API")
      return
    }
    try {
      await authApi.resetPassword(token, values.password)
      toast.success("Пароль изменён. Войдите с новым паролем")
      router.replace("/login")
    } catch (err) {
      const message = getApiErrorMessage(err, "Не удалось изменить пароль")
      setApiError(message)
      toast.error(message)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <div className="grid gap-4 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink">
            Ссылка недействительна
          </h1>
          <p className="text-[15px] text-mute">
            В ссылке нет токена восстановления. Запросите новое письмо.
          </p>
          <Button asChild className="mt-1 h-12 w-full text-[16px]">
            <Link href="/forgot-password">Запросить ссылку</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
        Новый пароль
      </h1>
      <p className="mb-6 text-[15px] text-mute">
        Придумайте пароль не короче 8 символов.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div className="grid gap-1.5">
          <label htmlFor="new-password" className="text-[14px] font-semibold text-ink">
            Новый пароль
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-[13px] text-red-700">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="confirm-password" className="text-[14px] font-semibold text-ink">
            Повторите пароль
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.confirm)}
            {...register("confirm")}
          />
          {errors.confirm ? (
            <p className="text-[13px] text-red-700">{errors.confirm.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-12 w-full text-[16px]"
        >
          {isSubmitting ? "Сохранение..." : "Сохранить пароль"}
          {!isSubmitting ? <ArrowRight className="size-4" /> : null}
        </Button>

        {apiError ? (
          <p className="text-center text-[13px] text-red-700" role="alert">
            {apiError}{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Запросить новую ссылку
            </Link>
          </p>
        ) : null}
      </form>

      <p className="mt-5 text-center text-[14px] text-mute">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
