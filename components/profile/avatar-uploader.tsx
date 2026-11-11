"use client"

import { useRef, useState } from "react"
import { CameraIcon, CircleNotchIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { UserAvatar } from "@/components/bm/user-avatar"
import { PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useCropBeforeUpload } from "@/components/ui/image-crop-dialog"
import { myChangesKey, useMyPendingChanges } from "@/components/profile/pending-review-notice"
import { useHydrated } from "@/hooks/use-hydrated"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"
const MAX_BYTES = 5 * 1024 * 1024

/** The person's photo: shown in the menu and next to every message they write. */
export function AvatarUploader() {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const pending = useMyPendingChanges().data
  const pendingPhoto = pending?.media?.avatar_url?.after
  const pendingPhotoSrc = typeof pendingPhoto === "string" ? pendingPhoto : null
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null)
  const name = hydrated && user ? user.name || user.email : ""
  const avatar = hydrated ? user?.avatarUrl : null

  /** Check the picked file, then let the person frame it before it uploads. */
  const pick = (file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Загрузите фото в формате JPG, PNG, WEBP или GIF")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Фото должно быть не больше 5 МБ")
      return
    }
    crop.choose(file)
  }

  const upload = async (file: File) => {
    setBusy("upload")
    try {
      const saved = await authApi.uploadAvatar(file)
      updateProfile({ avatarUrl: saved.avatar_url ?? null })
      await queryClient.invalidateQueries({ queryKey: myChangesKey })
      toast.success(
        saved.pending_changes?.includes("avatar_url")
          ? "Фото отправлено на проверку: его увидят после одобрения администратором"
          : "Фото профиля обновлено",
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось загрузить фото"))
    } finally {
      setBusy(null)
    }
  }

  const crop = useCropBeforeUpload({
    aspect: 1,
    round: true,
    title: "Фото профиля",
    description: "Передвиньте фото и выберите масштаб: в круге — то, что увидят собеседники.",
    confirmLabel: "Сохранить фото",
    onCropped: upload,
  })

  const remove = async () => {
    setBusy("remove")
    try {
      await authApi.deleteAvatar()
      updateProfile({ avatarUrl: null })
      await queryClient.invalidateQueries({ queryKey: myChangesKey })
      toast.success("Фото удалено")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось удалить фото"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageSurface className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
      <div className="relative">
        <UserAvatar src={avatar} name={name || "?"} size={88} className="text-[30px]" />
        {busy === "upload" ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
            <CircleNotchIcon className="size-6 animate-spin text-white" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="grid min-w-0 flex-1 gap-1">
        <b className="text-[16px] text-ink">Фото профиля</b>
        <p className="text-[13.5px] text-mute">
          Его увидят собеседники в сообщениях. JPG, PNG или WEBP до 5 МБ. Новое фото
          появится после проверки администратором.
        </p>
        {pendingPhotoSrc ? (
          <p className="mt-1 flex items-center gap-2 text-[13px] text-amber-800 dark:text-amber-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingPhotoSrc} alt="" className="size-8 rounded-full object-cover ring-2 ring-amber-300" />
            Новое фото на проверке
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Выбрать фото профиля"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) pick(file)
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={!isApiEnabled() || busy != null}
            onClick={() => inputRef.current?.click()}
          >
            <CameraIcon className="size-4" aria-hidden />
            {avatar ? "Сменить фото" : "Загрузить фото"}
          </Button>
          {avatar ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy != null}
              onClick={() => void remove()}
            >
              <TrashIcon className="size-4" aria-hidden /> Удалить
            </Button>
          ) : null}
        </div>
      </div>
      {crop.dialog}
    </PageSurface>
  )
}
