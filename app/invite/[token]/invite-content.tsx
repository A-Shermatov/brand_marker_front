"use client"

import Link from "next/link"
import { BuildingsIcon as Buildings } from "@phosphor-icons/react/dist/ssr"
import { BrandLogo } from "@/components/bm"
import { Button } from "@/components/ui/button"
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useInvitationPreviewQuery,
} from "@/hooks/api/use-invitations-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { COMPANY_ROLE_ACCESS, companyRoleLabel, formatInviteDeadline } from "@/lib/company-team"
import { useAuthStore } from "@/lib/store/auth-store"

const GONE_TEXT: Record<string, { title: string; text: string }> = {
  expired: {
    title: "Срок приглашения истёк",
    text: "Попросите руководителя компании отправить приглашение ещё раз.",
  },
  cancelled: {
    title: "Приглашение отменено",
    text: "Компания отменила это приглашение. Если это ошибка, попросите отправить новое.",
  },
  declined: {
    title: "Вы отказались от этого приглашения",
    text: "Если передумали, попросите руководителя компании отправить новое.",
  },
  accepted: {
    title: "Приглашение уже принято",
    text: "Войдите в кабинет — компания есть в списке ваших профилей.",
  },
  missing: {
    title: "Приглашение больше не действует",
    text: "Ссылка устарела или отправлена с ошибкой. Попросите руководителя компании отправить новое приглашение.",
  },
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-brand-field">
    <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-4 lg:px-8">
      <BrandLogo dark />
      <Link href="/" className="text-[14px] font-semibold text-white/85 hover:text-white">
        На главную
      </Link>
    </div>
    <div className="grid flex-1 place-items-center px-4 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-card p-7 shadow-[0_2px_4px_rgb(0_30_90/0.15),0_40px_80px_-30px_rgb(0_25_80/0.6)] sm:p-9">
        {children}
      </div>
    </div>
  </div>
)

/**
 * The page behind an invitation link. It says which company invites and with
 * what access, and takes the person the shortest way: register, sign in, or
 * answer right here when they are already signed in under the invited address.
 */
export const InviteContent = ({ token }: { token: string }) => {
  const hydrated = useHydrated()
  const isReady = useAuthStore((s) => s.isReady)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const preview = useInvitationPreviewQuery(token)
  const accept = useAcceptInvitationMutation()
  const decline = useDeclineInvitationMutation()

  if (!hydrated || !isReady || preview.isLoading) {
    return (
      <Shell>
        <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
      </Shell>
    )
  }

  const invitation = preview.data
  const status = invitation?.status ?? "missing"
  const here = `/invite/${token}`
  const loginHref = `/login?next=${encodeURIComponent(here)}`

  if (!invitation || status !== "pending") {
    const gone = GONE_TEXT[status] ?? GONE_TEXT.missing
    return (
      <Shell>
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink">{gone.title}</h1>
        <p className="mt-2 text-[15px] text-mute">{gone.text}</p>
        <Button asChild className="mt-6 h-11 w-full">
          <Link href={isAuthenticated ? "/" : "/login"}>
            {isAuthenticated ? "На главную" : "Войти в кабинет"}
          </Link>
        </Button>
      </Shell>
    )
  }

  const signedInAs = isAuthenticated && user ? user.email.toLowerCase() : null
  const otherAccount = signedInAs !== null && signedInAs !== invitation.email.toLowerCase()
  const access = COMPANY_ROLE_ACCESS[invitation.role]
  const busy = accept.isPending || decline.isPending

  return (
    <Shell>
      <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Buildings className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink">
        Вас пригласили в компанию «{invitation.company_title}»
      </h1>
      <dl className="mt-4 grid gap-2 text-[14.5px]">
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Уровень доступа</dt>
          <dd className="font-semibold text-ink">{companyRoleLabel(invitation.role)}</dd>
        </div>
        {invitation.invited_by_name ? (
          <div className="flex justify-between gap-4">
            <dt className="text-mute">Пригласил</dt>
            <dd className="text-right text-ink">{invitation.invited_by_name}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Приглашение на адрес</dt>
          <dd className="break-all text-right text-ink">{invitation.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Действует</dt>
          <dd className="text-ink">{formatInviteDeadline(invitation.expires_at)}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-xl bg-surface-muted p-3.5 text-[13.5px] leading-snug text-ink-soft">
        <b className="font-semibold text-ink">Что вы сможете:</b> {access.can}.
        {access.cannot ? (
          <>
            {" "}
            <b className="font-semibold text-ink">Не сможете:</b>{" "}
            {access.cannot.charAt(0).toLowerCase() + access.cannot.slice(1)}.
          </>
        ) : null}
      </p>

      {signedInAs === null ? (
        <div className="mt-6 grid gap-2.5">
          <Button asChild className="h-12 w-full text-[16px]">
            <Link href={`/register?invite=${encodeURIComponent(token)}`}>
              Зарегистрироваться и принять
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href={loginHref}>У меня уже есть кабинет — войти</Link>
          </Button>
        </div>
      ) : otherAccount ? (
        <div className="mt-6 grid gap-3">
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[14px] text-amber-900">
            Приглашение выписано на другой адрес. Сейчас вы вошли как {user?.email}. Войдите под
            адресом {invitation.email}, чтобы принять приглашение.
          </p>
          <Button type="button" className="h-11 w-full" onClick={() => void logout(loginHref)}>
            Выйти и войти под другим адресом
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            className="h-12 text-[16px]"
            disabled={busy}
            onClick={() => accept.mutate({ token })}
          >
            Принять
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-[16px]"
            disabled={busy}
            onClick={() => decline.mutate({ token })}
          >
            Отказаться
          </Button>
        </div>
      )}
    </Shell>
  )
}
