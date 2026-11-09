"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserIcon as User, ListIcon as Menu, XIcon as X, SignOutIcon as LogOut, ShoppingBagIcon as ShoppingBag, GridFourIcon as LayoutGrid } from "@phosphor-icons/react/dist/ssr"
import { MarketplaceSearch } from "@/components/marketplace/marketplace-search"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandLogo } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { useAuthStore, type SessionRole } from "@/lib/store/auth-store"
import { getUserDisplayName } from "@/lib/auth-display"
import { useHydrated } from "@/hooks/use-hydrated"
import { createRfqHref } from "@/lib/create-rfq-href"
import {
  forSuppliersUrl,
  guaranteeUrl,
  performersUrl,
  registerUrl,
} from "@/lib/marketplace-routes"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/bm/user-avatar"
import { CartButton } from "@/components/cart/cart-button"

const getCabinetBase = (role: SessionRole): string => {
  if (role === "supplier") return "/supplier"
  if (role === "admin") return "/admin"
  return "/customer"
}

const getProfileHref = (role: SessionRole): string => {
  if (role === "admin") return "/admin"
  return `${getCabinetBase(role)}/profile`
}

const NAV = [
  {
    label: "Каталог",
    href: "/services",
    match: (p: string) => p.startsWith("/services") || p.startsWith("/categories"),
  },
  {
    label: "Поставщики",
    href: performersUrl(),
    match: (p: string) => p.startsWith("/performers"),
  },
  {
    label: "Как это работает",
    href: guaranteeUrl(),
    match: (p: string) => p.startsWith("/guarantee"),
  },
  {
    label: "Продавцам",
    href: forSuppliersUrl(),
    match: (p: string) => p.startsWith("/for-suppliers"),
  },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const authedUser = hydrated && user ? user : null
  const profileHref = authedUser ? getProfileHref(authedUser.role) : "/login"
  const rfqsHref = authedUser
    ? `${getCabinetBase(authedUser.role)}/rfqs`
    : "/login"
  const rfqHref = createRfqHref()
  const displayName = authedUser ? getUserDisplayName(authedUser) : ""

  const handleLogout = () => {
    void logout()
    setMobileMenuOpen(false)
    router.push("/")
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:gap-3 lg:h-16 lg:gap-6 lg:px-8">
        <span className="shrink-0 sm:hidden">
          <BrandLogo small showWordmark={false} />
        </span>
        <span className="hidden shrink-0 sm:inline">
          <BrandLogo />
        </span>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Разделы"
        >
          {NAV.map((item) => {
            const on = item.match(pathname)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-[14.5px] transition-colors",
                  on
                    ? "font-semibold text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[2px] after:rounded-full after:bg-brand-600"
                    : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <span className="min-w-2 flex-1" aria-hidden="true" />

        <div className="relative hidden w-[240px] shrink-0 xl:block">
          <MarketplaceSearch
            variant="compact"
            className="w-full"
            onNavigate={closeMobileMenu}
          />
        </div>

        {authedUser && (authedUser.role === "customer" || authedUser.capabilities?.buyer) ? (
          <CartButton />
        ) : null}
        <ThemeToggle />

        {authedUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Кабинет"
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg pl-1 pr-3 transition-colors hover:bg-surface-muted"
              >
                <UserAvatar src={authedUser.avatarUrl} name={authedUser.name || authedUser.email} size={32} />
                <span className="hidden text-[14px] font-medium sm:block">
                  Кабинет
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-xs font-normal text-mute">
                    {authedUser.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={getCabinetBase(authedUser.role)} className="cursor-pointer">
                  <LayoutGrid size={15} /> Обзор
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={profileHref} className="cursor-pointer">
                  <User size={15} /> Профиль
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={rfqsHref} className="cursor-pointer">
                  <ShoppingBag size={15} /> Заявки
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut size={15} /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="hidden h-10 shrink-0 items-center rounded-lg px-3 text-[14.5px] font-medium text-ink transition-colors hover:bg-surface-muted sm:inline-flex"
          >
            Войти
          </Link>
        )}

        <Button asChild className="h-10 shrink-0 px-4">
          <Link href={rfqHref}>
            <span className="hidden sm:inline">Разместить заявку</span>
            <span className="sm:hidden">Заявка</span>
          </Link>
        </Button>

        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-canvas lg:hidden"
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-line bg-card lg:hidden">
          <div className="mx-auto grid max-w-[1200px] gap-1 px-4 py-3">
            {!authedUser ? (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium hover:bg-surface-muted"
                >
                  Войти
                </Link>
                <Link
                  href={registerUrl()}
                  onClick={closeMobileMenu}
                  className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium hover:bg-surface-muted"
                >
                  Регистрация
                </Link>
              </>
            ) : (
              <Link
                href={getCabinetBase(authedUser.role)}
                onClick={closeMobileMenu}
                className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium hover:bg-surface-muted"
              >
                Кабинет
              </Link>
            )}
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex h-11 items-center rounded-lg px-3 text-[15px] font-medium hover:bg-surface-muted",
                  item.match(pathname) && "bg-canvas",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2">
              <MarketplaceSearch
                variant="compact"
                className="w-full"
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
