type CabinetShellProps = {
  sidebar: React.ReactNode
  topbar: React.ReactNode
  children: React.ReactNode
  mobileNav?: React.ReactNode
  /** Optional section hub (H1 + subtabs) rendered above page content */
  sectionHub?: React.ReactNode
}

/** Full-height white rail layout from BrendMarket-v7.1 cabinet chrome. */
export const CabinetShell = ({
  sidebar,
  topbar,
  children,
  mobileNav,
  sectionHub,
}: CabinetShellProps) => {
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 overflow-y-auto border-r border-line bg-white scroll-thin lg:block">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {topbar}
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-5 lg:px-8 lg:py-7">
          {sectionHub}
          {children}
        </main>
      </div>
      {mobileNav}
    </div>
  )
}
