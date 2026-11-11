"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { invitationsApi } from "@/lib/api/auth"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"

export const invitationKeys = {
  mine: ["my-invitations"] as const,
  preview: (token: string) => ["invitation-preview", token] as const,
}

/** Invitations to company teams that wait for my answer. */
export const useMyInvitationsQuery = (enabled = true) =>
  useQuery({
    queryKey: invitationKeys.mine,
    queryFn: () => invitationsApi.mine(),
    enabled: enabled && isApiEnabled(),
    staleTime: 60_000,
  })

export const useInvitationPreviewQuery = (token: string | null) =>
  useQuery({
    queryKey: invitationKeys.preview(token ?? ""),
    queryFn: () => invitationsApi.preview(token!),
    enabled: Boolean(token) && isApiEnabled(),
    retry: false,
  })

const cabinetHome = (role: "customer" | "supplier" | null) =>
  role === "supplier" ? "/supplier" : "/customer"

/**
 * Accept an invitation (from the cabinet by its id, or from the link by its
 * token) and open the company's cabinet. The page is loaded anew, so every
 * list is read for the company and not for the profile the person was in.
 */
export const useAcceptInvitationMutation = () => {
  const qc = useQueryClient()
  const refreshSession = useAuthStore((s) => s.refreshSession)
  return useMutation({
    mutationFn: async (target: { id: number } | { token: string }) => {
      const { company_id } =
        "token" in target
          ? await invitationsApi.acceptByLink(target.token)
          : await invitationsApi.accept(target.id)
      const role = await refreshSession({ companyId: company_id })
      return { companyId: company_id, home: cabinetHome(role) }
    },
    onSuccess: ({ home }) => {
      qc.clear()
      window.location.assign(`${home}?joined=1`)
    },
    meta: { errorMessage: "Не удалось принять приглашение" },
  })
}

export const useDeclineInvitationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (target: { id: number } | { token: string }) =>
      "token" in target
        ? invitationsApi.declineByLink(target.token)
        : invitationsApi.decline(target.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: invitationKeys.mine })
      void qc.invalidateQueries({ queryKey: ["invitation-preview"] })
    },
    meta: {
      successMessage: "Вы отказались от приглашения",
      errorMessage: "Не удалось отказаться от приглашения",
    },
  })
}
