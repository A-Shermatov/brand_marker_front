import { CabinetBreadcrumbs } from "@/components/layout/section-hub"
import { RAIL_SURFACE } from "@/components/layout/cabinet-sidebar-parts"
import { cn } from "@/lib/utils"

type CabinetShellProps = {
  sidebar: React.ReactNode
  topbar: React.ReactNode
  children: React.ReactNode
  mobileNav?: React.ReactNode
  /** Optional section hub (H1 + subtabs) rendered above page content */
  sectionHub?: React.ReactNode
}

/**
 * Cabinet frame: the white menu rail on the left, the working area on
 * the right. Pages below a section list get a trail above their title.
 */
export const CabinetShell = ({
  sidebar,
  topbar,
  children,
  mobileNav,
  sectionHub,
}: CabinetShellProps) => {
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-[256px] shrink-0 overflow-y-auto border-r border-line scroll-rail lg:block",
          RAIL_SURFACE,
        )}
      >
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {topbar}
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-5 lg:px-8 lg:py-7">
          <CabinetBreadcrumbs />
          {sectionHub}
          {children}
        </main>
      </div>
      {mobileNav}
    </div>
  )
}
