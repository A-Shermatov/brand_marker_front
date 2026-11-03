import { MonitorIcon as Monitor, MegaphoneIcon as Megaphone, ScalesIcon as Scale, ChartBarIcon as BarChart2, TruckIcon as Truck, HardHatIcon as HardHat, PaletteIcon as Palette, UserCheckIcon as UserCheck, ChartLineIcon as LineChart, LockIcon as Lock, GlobeHemisphereWestIcon as Globe2, BookOpenIcon as BookOpen, TrendUpIcon as TrendingUp, BriefcaseIcon as Briefcase, PackageIcon as Package } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

export const iconMap: Record<string, PhosphorIcon> = {
  Monitor,
  Megaphone,
  Scale,
  BarChart2,
  Truck,
  HardHat,
  Palette,
  UserCheck,
  LineChart,
  Lock,
  Globe2,
  BookOpen,
  TrendingUp,
  Briefcase,
}

export const getIcon = (name: string): PhosphorIcon => iconMap[name] ?? Package
