"use client"

import { useState } from "react"
import {
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  DotsThreeVerticalIcon,
  ProhibitIcon,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useArchiveRfqMutation, useCloseRfqMutation } from "@/hooks/api/use-rfqs-query"
import { isApiEnabled } from "@/lib/api/config"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { cn } from "@/lib/utils"
import type { RfqWithRelations } from "@/types"

const CANCELLABLE = ["draft", "published", "receiving_proposals"]
const ARCHIVABLE = ["draft", "cancelled", "expired", "completed"]
const REASONS = ["Нашли поставщика сами", "Больше не нужно", "Изменились условия", "Слишком дорого"]

export const isArchivedRfq = (rfq: RfqWithRelations) =>
  Boolean(rfq.archived_at) || rfq.status === "archived"
/** A request can be cancelled while nobody has been chosen yet. */
export const canCancelRfq = (rfq: RfqWithRelations) =>
  !isArchivedRfq(rfq) && CANCELLABLE.includes(rfq.status)
/** It goes to the archive once nothing is happening on it any more. */
export const canArchiveRfq = (rfq: RfqWithRelations) =>
  !isArchivedRfq(rfq) && ARCHIVABLE.includes(rfq.status)

/** Cancel with an optional reason; the suppliers who answered receive it. */
export function CancelRfqDialog({
  open,
  onOpenChange,
  title,
  hasOffers,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  hasOffers: boolean
  pending?: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Отменить заявку?</DialogTitle>
          <DialogDescription>
            «{title}». Поставщики больше не смогут присылать предложения.
            {hasOffers ? " Те, кто уже ответил, получат уведомление с вашей причиной." : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <span className="text-[14px] font-semibold text-ink">Причина (необязательно)</span>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={reason === preset}
                onClick={() => setReason(reason === preset ? "" : preset)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  reason === preset
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-line text-ink-soft hover:border-line-strong",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, 500))}
            placeholder="Или напишите своими словами"
            aria-label="Причина отмены"
            rows={2}
          />
          <p className="text-[12.5px] text-mute">
            Отменённая заявка попадёт во «Закрытые» — оттуда её можно убрать в архив.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Не отменять
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              onConfirm(reason)
              setReason("")
            }}
          >
            Отменить заявку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** What the buyer can do with a request: cancel it, archive it, bring it back. */
export function useRfqManage(rfq: RfqWithRelations) {
  const useApi = isApiEnabled()
  const closeLocal = useRfqsStore((s) => s.closeRfq)
  const closeMutation = useCloseRfqMutation()
  const archiveMutation = useArchiveRfqMutation()
  const [cancelOpen, setCancelOpen] = useState(false)

  const cancel = (reason: string) => {
    if (!useApi) {
      closeLocal(rfq.id)
      setCancelOpen(false)
      return
    }
    closeMutation.mutate(
      { id: rfq.id, reason },
      { onSuccess: () => setCancelOpen(false) },
    )
  }
  const archive = (archived: boolean) =>
    archiveMutation.mutate(
      { id: rfq.id, archived },
      {
        onSuccess: () =>
          toast.success(archived ? "Заявка в архиве" : "Заявка возвращена из архива"),
      },
    )

  return {
    canCancel: canCancelRfq(rfq),
    canArchive: useApi && canArchiveRfq(rfq),
    canRestore: useApi && isArchivedRfq(rfq),
    archived: isArchivedRfq(rfq),
    busy: closeMutation.isPending || archiveMutation.isPending,
    cancelOpen,
    setCancelOpen,
    cancel,
    archive,
  }
}

/** The "⋯" menu on a request card. */
export function RfqActionsMenu({ rfq, offers }: { rfq: RfqWithRelations; offers: number }) {
  const manage = useRfqManage(rfq)
  if (!manage.canCancel && !manage.canArchive && !manage.canRestore) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Действия с заявкой «${rfq.title}»`}
            className="grid size-9 place-items-center rounded-lg text-mute transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <DotsThreeVerticalIcon weight="bold" className="size-5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {manage.canCancel ? (
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => manage.setCancelOpen(true)}
            >
              <ProhibitIcon size={16} aria-hidden /> Отменить заявку
            </DropdownMenuItem>
          ) : null}
          {manage.canArchive ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => manage.archive(true)}>
              <ArchiveIcon size={16} aria-hidden /> В архив
            </DropdownMenuItem>
          ) : null}
          {manage.canRestore ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => manage.archive(false)}>
              <ArrowCounterClockwiseIcon size={16} aria-hidden /> Вернуть из архива
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <CancelRfqDialog
        open={manage.cancelOpen}
        onOpenChange={manage.setCancelOpen}
        title={rfq.title}
        hasOffers={offers > 0}
        pending={manage.busy}
        onConfirm={manage.cancel}
      />
    </>
  )
}

/** The same actions as buttons, on the request's own page. */
export function RfqManageButtons({ rfq, offers }: { rfq: RfqWithRelations; offers: number }) {
  const manage = useRfqManage(rfq)
  if (!manage.canCancel && !manage.canArchive && !manage.canRestore) return null
  return (
    <div className="flex flex-wrap gap-2">
      {manage.canCancel ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
          disabled={manage.busy}
          onClick={() => manage.setCancelOpen(true)}
        >
          <ProhibitIcon size={16} aria-hidden /> Отменить заявку
        </Button>
      ) : null}
      {manage.canArchive ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          disabled={manage.busy}
          onClick={() => manage.archive(true)}
        >
          <ArchiveIcon size={16} aria-hidden /> В архив
        </Button>
      ) : null}
      {manage.canRestore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          disabled={manage.busy}
          onClick={() => manage.archive(false)}
        >
          <ArrowCounterClockwiseIcon size={16} aria-hidden /> Вернуть из архива
        </Button>
      ) : null}
      <CancelRfqDialog
        open={manage.cancelOpen}
        onOpenChange={manage.setCancelOpen}
        title={rfq.title}
        hasOffers={offers > 0}
        pending={manage.busy}
        onConfirm={manage.cancel}
      />
    </div>
  )
}
