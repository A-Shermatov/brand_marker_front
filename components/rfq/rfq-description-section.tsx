type RfqDescriptionSectionProps = {
  description: string | null
}

export const RfqDescriptionSection = ({ description }: RfqDescriptionSectionProps) => (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h2 className="text-base font-bold text-foreground mb-3">Описание</h2>
    {description ? (
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    ) : (
      <p className="text-sm text-muted-foreground">Описание не указано</p>
    )}
  </section>
)
