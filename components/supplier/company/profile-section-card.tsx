type ProfileSectionCardProps = {
  step: string
  title: string
  hint: string
  children: React.ReactNode
}

export const ProfileSectionCard = ({
  step,
  title,
  hint,
  children,
}: ProfileSectionCardProps) => (
  <section className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-[13px] font-bold text-ink">
        {step}
      </span>
      <div>
        <b className="block text-[16px]">{title}</b>
        <p className="mt-0.5 text-[13.5px] text-mute">{hint}</p>
      </div>
    </div>
    {children}
  </section>
)
