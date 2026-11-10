"use client"

import { statusPillClass } from "@/components/ui/status-badge"
import { CheckIcon as Check, PackageIcon as Package, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations } from "@/types"
import {
  getSubmissionTypeLabel,
  workSubmissionStatusMeta,
} from "@/lib/contract-display"
import { formatIsoDate } from "@/lib/format"
import {
  normalizeSubmissionAssets,
  SubmissionAssetsList,
} from "@/components/contracts/submission-assets-list"

type BuyerContractSubmissionsPanelProps = {
  contract: ContractWithRelations
  onApprove: (submissionId: number) => void
  onReject: (submissionId: number) => void
  busy?: boolean
}

export const BuyerContractSubmissionsPanel = ({
  contract,
  onApprove,
  onReject,
  busy = false,
}: BuyerContractSubmissionsPanelProps) => {
  const submissions = [...contract.submissions].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Package size={16} className="text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Сдача работы</h2>
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Поставщик ещё не сдал работу
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const meta = workSubmissionStatusMeta[submission.status]
            const assets = normalizeSubmissionAssets(submission)
            const canReview = submission.status === "pending"

            return (
              <div key={submission.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {getSubmissionTypeLabel(submission.type)} ·{" "}
                      {formatIsoDate(
                        submission.submitted_at.split("T")[0] ?? submission.submitted_at,
                      )}
                    </p>
                    <p className="text-sm text-foreground mt-1">{submission.note}</p>
                  </div>
                  <span
                    className={`${statusPillClass} flex-shrink-0 ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>

                <SubmissionAssetsList assets={assets} />

                {canReview && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => onApprove(submission.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      aria-label="Принять сдачу"
                    >
                      <Check size={14} />
                      Принять
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(submission.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border text-xs font-bold hover:bg-secondary disabled:opacity-50 transition-colors"
                      aria-label="Отклонить сдачу"
                    >
                      <X size={14} />
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
