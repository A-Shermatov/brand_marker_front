import type { BuyerRfqStatusFilter } from "@/lib/buyer-rfq-display"
import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type { RfqCreate, RfqUpdate, RfqWithRelations } from "@/types"
import { apiFetch } from "./client"
import { toRfqPayload } from "./rfq-payload"

const PREFIX = "/buyer/rfqs"

export const rfqsApi = {
  list: (
    filter: BuyerRfqStatusFilter = "all",
    params: PageParams & { q?: string; type?: string } = {},
  ) =>
    apiFetch<Page<RfqWithRelations>>(
      `${PREFIX}/${buildPageQuery({
        ...params,
        tab: filter !== "all" ? filter : undefined,
      })}`,
    ),

  get: (id: string) => apiFetch<RfqWithRelations>(`${PREFIX}/${id}`),

  create: (data: RfqCreate) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/`, {
      method: "POST",
      body: JSON.stringify(toRfqPayload(data)),
    }),

  update: (id: string, data: RfqUpdate) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  publish: (id: string) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}/publish`, { method: "POST" }),

  /** Cancel the request; suppliers who answered are told, with the reason if given. */
  close: (id: string, reason?: string) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ reason: reason?.trim() || null }),
    }),

  /** Put a finished request away, or bring it back. */
  archive: (id: string, archived: boolean) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}/${archived ? "archive" : "unarchive"}`, {
      method: "POST",
    }),

  invite: (id: string, supplierIds: number[]) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}/invite`, {
      method: "POST",
      body: JSON.stringify({ supplier_ids: supplierIds }),
    }),

  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<RfqWithRelations>(`${PREFIX}/${id}/attachments`, {
      method: "POST",
      body: form,
    })
  },

  deleteAttachment: (id: string, attachmentId: string | number) =>
    apiFetch<RfqWithRelations>(`${PREFIX}/${id}/attachments/${attachmentId}`, {
      method: "DELETE",
    }),
}
