"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SignOutIcon as LogOut, UserIcon as User, CaretDownIcon as ChevronDown, StorefrontIcon as Store } from "@phosphor-icons/react/dist/ssr"
import { CabinetSearch } from "@/components/layout/cabinet-search"
import { NotificationsPopover } from "@/components/notifications/notifications-popover"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandLogo } from "@/components/bm"
import CustomerSidebar from "@/components/cabinet/sidebar"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getUserDisplayName, getUserInitials } from "@/lib/auth-display"
import { cn } from "@/lib/utils"
import { RAIL_SURFACE } from "@/components/layout/cabinet-sidebar-parts"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/bm/user-avatar"
import { CartButton } from "@/components/cart/cart-button"

export default function CustomerTopbar({
  moreOpen,
  onMoreOpenChange,
}: {
  moreOpen?: boolean
  onMoreOpenChange?: (open: boolean) => void
}) {
  const router = useRouter()
  const hydrated = useHydrated()
  const [internalOpen, setInternalOpen] = useState(false)
  const mobileOpen = moreOpen ?? internalOpen
  const setMobileOpen = onMoreOpenChange ?? setInternalOpen
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const switchSessionRole = useAuthStore((s) => s.switchSessionRole)
  const displayName = hydrated && user ? getUserDisplayName(user) : "Гость"
  const initials = hydrated && user ? getUserInitials(user) : ""

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-[60px] border-b border-line bg-card/90 backdrop-blur-md">
        <div className="flex h-full items-center gap-3 px-4 lg:gap-4 lg:px-8">
          <BrandLogo small showWordmark className="shrink-0 lg:hidden" />
          <CabinetSearch target="/customer/rfqs" placeholder="Поиск по вашим заявкам" />
          <span className="flex-1" />
          <CartButton withLabel />
          <ThemeToggle />
          <NotificationsPopover role="buyer" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-lg pl-1 pr-2 hover:bg-surface-muted"
                aria-label="Аккаунт"
              >
                {initials ? (
                  <UserAvatar src={hydrated ? user?.avatarUrl : null} name={displayName} size={32} />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-surface-muted text-ink ring-1 ring-line">
                    <User size={15} />
                  </span>
                )}
                <span className="hidden text-[14px] font-medium md:block">
                  {displayName.split(" ")[0]}
                </span>
                <ChevronDown className="hidden size-4 text-mute md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-xs font-normal text-mute">
                    {hydrated && user ? user.email : ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/customer/profile" className="cursor-pointer">
                  <User size={15} /> Профиль
                </Link>
              </DropdownMenuItem>
              {hydrated && user?.role === "customer" ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    void (async () => {
                      await switchSessionRole("supplier")
                      router.push("/supplier")
                    })()
                  }}
                >
                  <Store size={15} /> Перейти к продажам
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut size={15} /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className={cn("w-80 max-w-[88vw] border-0 p-0", RAIL_SURFACE)}>
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <CustomerSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
