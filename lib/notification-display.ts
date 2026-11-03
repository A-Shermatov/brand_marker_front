import { CertificateIcon as FileCheck, FileTextIcon as FileText, HeadsetIcon as Headphones, InfoIcon as Info, ScrollIcon as ScrollText, UsersIcon as Users, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import type { NotificationType } from "@/types/notification"

export const notificationTypeIcon: Record<NotificationType, PhosphorIcon> = {
  order: FileText,
  offer: Users,
  payment: Wallet,
  system: Info,
  rfq: ScrollText,
  contract: FileCheck,
  proposal: Users,
  support: Headphones,
}

export const getNotificationIcon = (type: NotificationType | string): PhosphorIcon =>
  notificationTypeIcon[type as NotificationType] ?? Info
