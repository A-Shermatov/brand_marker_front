import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import {
  BankIcon,
  BuildingsIcon,
  ChatsCircleIcon,
  ClipboardTextIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  HandshakeIcon,
  HouseIcon,
  ScalesIcon,
  SealCheckIcon,
  ShoppingCartIcon,
  SquaresFourIcon,
  StorefrontIcon,
  TrayIcon,
  UsersIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"
import type { CabinetRole } from "@/lib/cabinet-nav"

/**
 * One icon per cabinet section, shared by the menu and the section header,
 * so a section is recognised by the same picture wherever it shows.
 */
export const HUB_ICONS: Record<CabinetRole, Record<string, PhosphorIcon>> = {
  buyer: {
    home: HouseIcon,
    rfqs: ClipboardTextIcon,
    deals: HandshakeIcon,
    suppliers: BuildingsIcon,
    messages: ChatsCircleIcon,
    catalog: ShoppingCartIcon,
    company: UsersThreeIcon,
  },
  supplier: {
    home: HouseIcon,
    leads: TrayIcon,
    deals: HandshakeIcon,
    products: StorefrontIcon,
    messages: ChatsCircleIcon,
    tariff: SealCheckIcon,
    company: BuildingsIcon,
  },
  admin: {
    home: SquaresFourIcon,
    verif: SealCheckIcon,
    disputes: ScalesIcon,
    payouts: BankIcon,
    users: UsersIcon,
    audit: ClockCounterClockwiseIcon,
    cats: GearSixIcon,
  },
}
