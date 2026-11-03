"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeftIcon as ArrowLeft, ArrowRightIcon as ArrowRight, FileTextIcon as FileText, ImageIcon, CircleNotchIcon as Loader2, TrashIcon as Trash2, UploadSimpleIcon as Upload } from "@phosphor-icons/react/dist/ssr"
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
  useAdminCatalogMediaDeleteMutation,
  useAdminCatalogMediaReorderMutation,
  useAdminCatalogMediaUploadMutation,
} from "@/hooks/api/use-admin-catalog-query"
import type { AdminCatalogDetail } from "@/lib/api/admin"
import { resolveFileUrl } from "@/lib/file-url"

type MediaRow = AdminCatalogDetail["media"][number]

export const CatalogMediaManager = ({ item }: { item: AdminCatalogDetail }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<MediaRow | null>(null)
  const uploadMutation = useAdminCatalogMediaUploadMutation(item.id)
  const deleteMutation = useAdminCatalogMediaDeleteMutation(item.id)
  const reorderMutation = useAdminCatalogMediaReorderMutation(item.id)
  const busy = uploadMutation.isPending || deleteMutation.isPending || reorderMutation.isPending
  const media = item.media

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync(file)
      } catch {
        return
      }
    }
    toast.success(files.length > 1 ? "Файлы загружены" : "Файл загружен")
    if (inputRef.current) inputRef.current.value = ""
  }

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= media.length) return
    const ids = media.map((row) => row.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(target, 0, moved!)
    try {
      await reorderMutation.mutateAsync(ids)
    } catch {
      // error toast via MutationCache
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success("Файл удалён")
      setPendingDelete(null)
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Первое изображение используется как обложка. Порядок меняется стрелками.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload aria-hidden="true" />
          )}
          Загрузить
        </Button>
      </div>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
          Файлы не загружены.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((row, index) => (
            <div key={row.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-video bg-secondary">
                {row.media_type === "image" && row.file_url && row.file_url !== "#" ? (
                  <Image
                    src={resolveFileUrl(row.file_url)}
                    alt={row.file_name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="320px"
                  />
                ) : (
                  <a
                    href={resolveFileUrl(row.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full items-center justify-center text-muted-foreground hover:text-primary"
                  >
                    {row.media_type === "image" ? (
                      <ImageIcon aria-hidden="true" />
                    ) : (
                      <FileText aria-hidden="true" />
                    )}
                  </a>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-card/90 px-2 py-0.5 text-xs font-semibold">
                  {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-1 p-2">
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={row.file_name}>
                  {row.file_name}
                </p>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy || index === 0}
                  aria-label="Переместить левее"
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy || index === media.length - 1}
                  aria-label="Переместить правее"
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={busy}
                  aria-label="Удалить файл"
                  onClick={() => setPendingDelete(row)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить файл?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.file_name} будет удалён из карточки позиции. Действие записывается в журнал.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
