"use client"

import {
  PURCHASE_RULE_LABELS,
  type PurchaseRuleId,
  type PurchaseRules,
} from "@/lib/mock/buyer-employees"

type PurchaseRulesCardProps = {
  rules: PurchaseRules
  onChange: (id: PurchaseRuleId, checked: boolean) => void
}

export const PurchaseRulesCard = ({ rules, onChange }: PurchaseRulesCardProps) => (
  <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
    <span className="text-[13px] font-semibold text-mute">Правила закупок</span>
    <div className="mt-3 grid gap-3">
      {(Object.keys(PURCHASE_RULE_LABELS) as PurchaseRuleId[]).map((id) => (
        <label
          key={id}
          className="flex items-start gap-3 text-[14.5px] text-ink"
        >
          <input
            type="checkbox"
            checked={rules[id]}
            onChange={(e) => onChange(id, e.target.checked)}
            className="mt-0.5 size-5 accent-[#0E8A5E]"
          />
          <span>{PURCHASE_RULE_LABELS[id]}</span>
        </label>
      ))}
    </div>
  </section>
)
