import type { RfqRequirement } from "@/lib/rfq-requirements"

type RfqRequirementsSectionProps = {
  requirements: RfqRequirement[]
}

export const RfqRequirementsSection = ({ requirements }: RfqRequirementsSectionProps) => (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h2 className="text-base font-bold text-foreground mb-4">Требования</h2>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {requirements.map((req) => (
        <div key={req.label}>
          <dt className="text-xs text-muted-foreground">{req.label}</dt>
          <dd className="text-sm font-semibold text-foreground mt-0.5">{req.value}</dd>
        </div>
      ))}
    </dl>
  </section>
)
