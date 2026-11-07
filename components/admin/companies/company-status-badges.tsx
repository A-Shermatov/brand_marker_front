import { Badge } from "@/components/ui/badge"
import type {
  AdminCompanyOperationalStatus,
  AdminCompanyVerificationStatus,
} from "@/lib/api/admin"
import { cn } from "@/lib/utils"

const verificationMetadata: Record<
  AdminCompanyVerificationStatus,
  { label: string; className: string }
> = {
  verified: {
    label: "Верифицирована",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  pending: {
    label: "Ожидает проверки",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  needs_documents: {
    label: "Нужны документы",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  rejected: {
    label: "Отклонена",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
}

const operationalMetadata: Record<
  AdminCompanyOperationalStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Активна",
    className: "border-info/20 bg-info/10 text-info",
  },
  blocked: {
    label: "Заблокирована",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  deactivated: {
    label: "Деактивирована",
    className: "border-line bg-surface-muted text-mute",
  },
}

export const CompanyVerificationBadge = ({
  status,
  className,
}: {
  status: AdminCompanyVerificationStatus
  className?: string
}) => {
  const metadata = verificationMetadata[status]
  return (
    <Badge variant="outline" className={cn(metadata.className, className)}>
      {metadata.label}
    </Badge>
  )
}

export const CompanyOperationalBadge = ({
  status,
  className,
}: {
  status: AdminCompanyOperationalStatus
  className?: string
}) => {
  const metadata = operationalMetadata[status]
  return (
    <Badge variant="outline" className={cn(metadata.className, className)}>
      {metadata.label}
    </Badge>
  )
}
