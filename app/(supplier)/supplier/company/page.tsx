"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CheckIcon as Check, EyeIcon as Eye, PlusIcon as Plus, StarIcon as Star, TrashIcon as Trash2, UploadSimpleIcon as Upload } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useAddSupplierTeamMemberMutation,
  useRemoveSupplierTeamMemberMutation,
  useSupplierCompaniesQuery,
  useUpdateSupplierCompanyMutation,
  useUpdateSupplierTeamMemberMutation,
} from "@/hooks/api/use-supplier-companies-query"
import { useEnrichReviewParties } from "@/hooks/api/use-enrich-review-parties"
import { supplierCompaniesApi } from "@/lib/api/supplier/companies"
import { getApiErrorMessage } from "@/lib/api/client"
import { publicApi } from "@/lib/api/public"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageCropDialog } from "@/components/ui/image-crop-dialog"
import { PageFrame, PageHeader } from "@/components/layout"
import { ProfileSectionCard } from "@/components/supplier/company/profile-section-card"
import { ReviewsReceivedTable } from "@/components/supplier/finance/reviews-received-table"
import { EmployeeList } from "@/components/cabinet/company/employee-list"
import { InviteEmployeeDialog } from "@/components/cabinet/company/invite-employee-dialog"
import { TeamInvitations } from "@/components/cabinet/company/team-invitations"
import { resolveFileUrl } from "@/lib/file-url"
import { scoreLevel } from "@/lib/catalog-quality-score"
import { performerUrl } from "@/lib/marketplace-routes"
import {
  canManageTeam,
  COMPANY_ROLE_RIGHTS,
  mapCompanyUsersToEmployees,
  myCompanyRole,
  nameFromEmail,
  type CompanyTeamEmployee,
} from "@/lib/company-team"
import {
  DEFAULT_SUPPLIER_PROFILE_EXTRA,
  profileCompleteness,
  readSupplierProfileExtra,
  writeSupplierProfileExtra,
  type SupplierCompanyProfileExtra,
} from "@/lib/mock/supplier-company-profile"
import {
  emptyCompanyWizardInput,
  type CompanyRole,
  type CompanyWithRelations,
} from "@/types"
import { cn } from "@/lib/utils"

const VERIFY_ITEMS = [
  "Свидетельство о регистрации",
  "Справка ИНН",
  "Паспорт директора",
  "Банковский счёт компании",
]

const FACT_FIELDS: {
  key: keyof SupplierCompanyProfileExtra["facts"]
  label: string
  placeholder: string
}[] = [
  { key: "founded", label: "Год основания", placeholder: "2018" },
  { key: "staff", label: "Сотрудников", placeholder: "25" },
  { key: "area", label: "Склад / производство", placeholder: "600 м² склад" },
  { key: "markets", label: "Где работаете", placeholder: "Душанбе, Худжанд" },
  { key: "brands", label: "Бренды и партнёры", placeholder: "Lenovo, Dell" },
]

export default function SupplierCompanyPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const getMyCompany = useCompaniesStore((s) => s.getMyCompany)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const updateLocal = useCompaniesStore((s) => s.updateCompany)
  const getContract = useContractsStore((s) => s.getContract)

  const { data: apiCompanies, isLoading } = useSupplierCompaniesQuery(
    hydrated && useApi,
  )
  const updateMutation = useUpdateSupplierCompanyMutation()
  const addMember = useAddSupplierTeamMemberMutation()
  const updateMember = useUpdateSupplierTeamMemberMutation()
  const removeMember = useRemoveSupplierTeamMemberMutation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [localEmployees, setLocalEmployees] = useState<CompanyTeamEmployee[]>(
    [],
  )

  const company: CompanyWithRelations | null = useMemo(() => {
    if (useApi) {
      const items = (apiCompanies?.items ?? []) as CompanyWithRelations[]
      const activeId = user?.activeCompanyId ?? user?.companyId
      return items.find((c) => c.id === activeId) ?? items[0] ?? null
    }
    if (!hydrated) return null
    return getMyCompany(actorId) ?? null
  }, [
    useApi,
    apiCompanies,
    hydrated,
    getMyCompany,
    actorId,
    user?.activeCompanyId,
    user?.companyId,
  ])

  const employees = useMemo(() => {
    if (useApi && company) {
      return mapCompanyUsersToEmployees(company.company_users ?? [], user?.userId)
    }
    if (localEmployees.length > 0) return localEmployees
    if (company) {
      return mapCompanyUsersToEmployees(company.company_users ?? [], user?.userId)
    }
    return []
  }, [useApi, company, user?.userId, localEmployees])

  const myRole =
    myCompanyRole(company?.company_users ?? [], user?.userId) ??
    employees.find((e) => e.me)?.role ??
    null
  const canManage = canManageTeam(myRole)
  const teamBusy =
    addMember.isPending || updateMember.isPending || removeMember.isPending

  const { data: apiReviewsPage } = useQuery({
    queryKey: ["company-reviews", company?.id],
    queryFn: () => publicApi.companyReviews(company!.id),
    enabled: hydrated && useApi && Boolean(company?.id),
  })

  const rawReviews = useApi
    ? (apiReviewsPage?.items ?? [])
    : hydrated
      ? (company?.reviews ?? [])
      : []
  const reviews = useEnrichReviewParties(rawReviews, hydrated && useApi)

  const getReviewerName = (reviewerActorId: number) =>
    getCompany(reviewerActorId)?.title ?? `Участник #${reviewerActorId}`

  const getContractTitle = (contractId: number) =>
    getContract(contractId)?.title ?? `Сделка #${contractId}`

  const [about, setAbout] = useState("")
  const [city, setCity] = useState("")
  const [logo, setLogo] = useState("")
  const [cover, setCover] = useState("")
  const [imageBusy, setImageBusy] = useState<"logo" | "cover" | null>(null)
  const [extra, setExtra] = useState<SupplierCompanyProfileExtra>(
    DEFAULT_SUPPLIER_PROFILE_EXTRA,
  )
  const [saving, setSaving] = useState(false)
  const [photoCrop, setPhotoCrop] = useState<{
    src: string
    name: string
    queue: File[]
  } | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    if (!company) return
    setAbout(company.description ?? "")
    setCity(company.city ?? "")
    setLogo(company.logo ?? "")
    setCover(company.cover ?? "")
    const fromProfile = company.profile
    if (useApi && fromProfile) {
      const gallery = Array.isArray(fromProfile.gallery)
        ? fromProfile.gallery.map((g) => ({
            src: g.src,
            name: g.name || "photo",
          }))
        : []
      setExtra({
        photos: gallery,
        facts: {
          founded:
            fromProfile.founded_year != null
              ? String(fromProfile.founded_year)
              : "",
          staff:
            fromProfile.employees_count != null
              ? String(fromProfile.employees_count)
              : "",
          area: fromProfile.warehouse_area ?? "",
          markets: fromProfile.markets ?? company.city ?? "",
          brands: fromProfile.brands ?? "",
        },
        clients: fromProfile.notable_clients ?? "",
        certs: company.certificates.map((c) => c.title),
      })
      return
    }
    const stored = readSupplierProfileExtra(company.id)
    setExtra({
      ...stored,
      facts: {
        founded:
          stored.facts.founded ||
          (fromProfile?.founded_year != null
            ? String(fromProfile.founded_year)
            : ""),
        staff:
          stored.facts.staff ||
          (fromProfile?.employees_count != null
            ? String(fromProfile.employees_count)
            : ""),
        area: stored.facts.area,
        markets: stored.facts.markets || company.city || "",
        brands: stored.facts.brands,
      },
      certs:
        stored.certs.length > 0
          ? stored.certs
          : company.certificates.map((c) => c.title),
    })
  }, [company, useApi])

  const completeness = profileCompleteness(about, extra)
  const level = scoreLevel(completeness)
  const verified = company?.verification_status === "verified"
  const publicActorId =
    user?.actors.find(
      (a) => a.side === "supplier" && a.company_id === company?.id,
    )?.id ??
    (actorId || company?.id || 0)
  const publicHref = `${performerUrl(publicActorId)}?guest=1`

  const handleRoleChange = async (userId: number, role: CompanyRole) => {
    const target = employees.find((e) => e.userId === userId)
    if (!target || target.role === role) return
    if (useApi && company) {
      try {
        await updateMember.mutateAsync({
          companyId: company.id,
          targetUserId: userId,
          data: { role },
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось изменить роль"))
      }
      return
    }
    setLocalEmployees((prev) => {
      const base =
        prev.length > 0
          ? prev
          : mapCompanyUsersToEmployees(company?.company_users ?? [], user?.userId)
      return base.map((e) =>
        e.userId !== userId
          ? e
          : { ...e, role, rights: COMPANY_ROLE_RIGHTS[role] },
      )
    })
    toast.success("Роль обновлена")
  }

  const handleRemove = async (userId: number) => {
    if (useApi && company) {
      try {
        await removeMember.mutateAsync({
          companyId: company.id,
          targetUserId: userId,
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось удалить сотрудника"))
      }
      return
    }
    setLocalEmployees((prev) => {
      const base =
        prev.length > 0
          ? prev
          : mapCompanyUsersToEmployees(company?.company_users ?? [], user?.userId)
      return base.filter((e) => e.userId !== userId)
    })
    toast.success("Сотрудник удалён")
  }

  /** Logo and cover go through the same upload; the page keeps the link until "Save". */
  const handleBrandImage = async (kind: "logo" | "cover", file: File | undefined) => {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Загрузите картинку в формате JPG, PNG или WEBP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Картинка должна быть не больше 5 МБ")
      return
    }
    if (!useApi) {
      const local = URL.createObjectURL(file)
      if (kind === "logo") setLogo(local)
      else setCover(local)
      return
    }
    setImageBusy(kind)
    try {
      const res = await supplierCompaniesApi.uploadLogo(file)
      if (kind === "logo") setLogo(res.logo)
      else setCover(res.logo)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось загрузить картинку"))
    } finally {
      setImageBusy(null)
    }
  }

  const handleInvite = async (data: { email: string; role: CompanyRole }) => {
    if (useApi && company) {
      // The dialog shows what went wrong (already invited, already in the team).
      return addMember.mutateAsync({
        companyId: company.id,
        data: { email: data.email, role: data.role },
      })
    }
    const employee: CompanyTeamEmployee = {
      userId: Date.now(),
      membershipId: Date.now(),
      name: nameFromEmail(data.email),
      email: data.email,
      role: data.role,
      rights: COMPANY_ROLE_RIGHTS[data.role],
    }
    setLocalEmployees((prev) => {
      const base =
        prev.length > 0
          ? prev
          : mapCompanyUsersToEmployees(company?.company_users ?? [], user?.userId)
      return [...base, employee]
    })
    toast.success("Сотрудник добавлен")
  }

  const openPhotoCrop = (files: FileList | null) => {
    if (!files) return
    const remaining = Math.max(0, 12 - extra.photos.length)
    const selected = Array.from(files)
      .filter((f) => /^image\//.test(f.type))
      .slice(0, remaining)
    if (!selected.length) {
      if (extra.photos.length >= 12) {
        toast.error("Можно загрузить не больше 12 фото")
      }
      return
    }
    const [first, ...rest] = selected
    setPhotoCrop({
      src: URL.createObjectURL(first),
      name: first.name,
      queue: rest,
    })
  }

  const appendCroppedPhoto = async (file: File) => {
    setPhotoUploading(true)
    try {
      if (useApi) {
        const res = await supplierCompaniesApi.uploadLogo(file)
        setExtra((prev) => ({
          ...prev,
          photos: [...prev.photos, { src: res.logo, name: file.name }].slice(
            0,
            12,
          ),
        }))
      } else {
        setExtra((prev) => ({
          ...prev,
          photos: [
            ...prev.photos,
            { src: URL.createObjectURL(file), name: file.name },
          ].slice(0, 12),
        }))
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось загрузить фото"))
      throw err
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleCroppedPhoto = async (file: File) => {
    const current = photoCrop
    const slotsAfter = 12 - extra.photos.length - 1
    await appendCroppedPhoto(file)
    if (current?.src.startsWith("blob:")) URL.revokeObjectURL(current.src)

    const next = current?.queue ?? []
    if (next.length > 0 && slotsAfter > 0) {
      const [first, ...rest] = next
      setPhotoCrop({
        src: URL.createObjectURL(first),
        name: first.name,
        queue: rest,
      })
      return
    }
    setPhotoCrop(null)
  }

  const handlePhotoCropOpenChange = (open: boolean) => {
    if (open) return
    if (photoCrop?.src.startsWith("blob:")) URL.revokeObjectURL(photoCrop.src)
    setPhotoCrop(null)
  }

  const handleCerts = async (files: FileList | null) => {
    if (!files || !company) return
    const selected = Array.from(files)
    if (!selected.length) return

    if (useApi) {
      try {
        const titles: string[] = []
        const today = new Date().toISOString().slice(0, 10)
        for (const file of selected) {
          const uploaded = await supplierCompaniesApi.uploadCertificateFile(file)
          await supplierCompaniesApi.addCertificate(company.id, {
            title: file.name.replace(/\.[^.]+$/, "") || file.name,
            issuer: company.title,
            issue_date: today,
            file_url: uploaded.file_url,
          })
          titles.push(file.name)
        }
        setExtra((prev) => ({ ...prev, certs: [...prev.certs, ...titles] }))
        toast.success("Сертификаты загружены")
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось загрузить сертификат"))
      }
      return
    }

    setExtra((prev) => ({
      ...prev,
      certs: [...prev.certs, ...selected.map((f) => f.name)],
    }))
  }

  const handleSave = async () => {
    if (!company) {
      toast.error("Сначала создайте компанию")
      return
    }
    setSaving(true)
    if (!useApi) writeSupplierProfileExtra(company.id, extra)
    try {
      if (useApi) {
        const base = emptyCompanyWizardInput()
        await updateMutation.mutateAsync({
          companyId: company.id,
          data: {
            ...base,
            title: company.title,
            legal_name: company.legal_name ?? "",
            tax_number: company.tax_number ?? "",
            description: about,
            logo,
            cover,
            country: company.country ?? "",
            city,
            address: company.address ?? "",
            website: company.website ?? "",
            founded_year: extra.facts.founded,
            employees_count: extra.facts.staff,
            annual_revenue_range:
              company.profile?.annual_revenue_range ?? "",
            languages: company.profile?.languages ?? [],
            industries: company.profile?.industries ?? [],
            category_ids: company.categories.map((c) => c.category_id),
            certificates: company.certificates.map((c) => ({
              title: c.title,
              issuer: c.issuer,
              issue_date: c.issue_date,
              expiry_date: c.expiry_date ?? "",
              file_url: c.file_url,
            })),
            team: [],
            actor_types: company.actor_types?.length
              ? company.actor_types
              : ["supplier"],
            warehouse_area: extra.facts.area || null,
            markets: extra.facts.markets || null,
            brands: extra.facts.brands || null,
            notable_clients: extra.clients || null,
            gallery: extra.photos.map((p) => ({ src: p.src, name: p.name })),
          },
        })
      } else if (updateLocal) {
        updateLocal(company.id, {
          description: about,
          city,
        })
      }
      toast.success("Страница компании сохранена")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось сохранить"))
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame>
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-canvas" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-96 animate-pulse rounded-2xl bg-canvas" />
          <div className="h-64 animate-pulse rounded-2xl bg-canvas" />
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Страница компании"
        description="Расскажите о компании — покупатели чаще выбирают тех, кого «видно»"
        actions={
          <div className="flex flex-wrap gap-2">
            {company && canManage ? (
              <Button
                type="button"
                size="lg"
                disabled={teamBusy}
                onClick={() => setInviteOpen(true)}
              >
                <Plus size={16} />
                Пригласить сотрудника
              </Button>
            ) : null}
            <Button asChild variant="outline" size="lg">
              <Link href={publicHref} target="_blank" rel="noreferrer">
                <Eye size={16} />
                Посмотреть как гость
              </Link>
            </Button>
          </div>
        }
      />

      {!company ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <b className="text-[17px]">Компания ещё не создана</b>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-mute">
            Создайте профиль компании, чтобы заполнить страницу и работать с
            заказами на площадке.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/supplier/company/new">
              <Plus size={16} />
              Создать компанию
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5">
            <ProfileSectionCard
              step="1"
              title="О компании"
              hint="Чем занимаетесь, для кого и почему с вами удобно"
            >
              <div className="mb-5 grid gap-3">
                <span className="text-[14px] font-medium">Логотип и обложка</span>
                <div className="relative overflow-hidden rounded-xl border border-line">
                  <div className="relative h-28 bg-brand-field sm:h-32">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveFileUrl(cover) || cover}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                        data-testid="cover-preview"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-end gap-3 px-4 pb-4">
                    <div className="-mt-9 grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-xl border-4 border-card bg-surface-muted text-[12px] text-mute">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveFileUrl(logo) || logo} alt="" className="size-full object-cover" />
                      ) : (
                        "Логотип"
                      )}
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button asChild variant="outline" size="sm" disabled={imageBusy !== null}>
                          <label className="cursor-pointer">
                            <Upload aria-hidden />
                            {imageBusy === "logo" ? "Загрузка…" : logo ? "Заменить логотип" : "Загрузить логотип"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                void handleBrandImage("logo", e.target.files?.[0])
                                e.target.value = ""
                              }}
                            />
                          </label>
                        </Button>
                        <Button asChild variant="outline" size="sm" disabled={imageBusy !== null}>
                          <label className="cursor-pointer">
                            <Upload aria-hidden />
                            {imageBusy === "cover" ? "Загрузка…" : cover ? "Заменить обложку" : "Загрузить обложку"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              data-testid="cover-input"
                              onChange={(e) => {
                                void handleBrandImage("cover", e.target.files?.[0])
                                e.target.value = ""
                              }}
                            />
                          </label>
                        </Button>
                        {cover ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setCover("")}>
                            Убрать обложку
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="text-[13px] text-mute">
                  {canManage
                    ? "Обложка — широкая картинка вверху страницы компании: склад, продукция или фирменный фон. Лучше всего смотрится 1600×400."
                    : "Оформлять страницу компании могут руководитель и администратор."}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cp-about">Описание</Label>
                <textarea
                  id="cp-about"
                  rows={5}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="min-h-[120px] w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
                  placeholder="3–5 предложений: что продаёте, сколько лет на рынке, какие гарантии и сроки"
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cp-city">Город отгрузки</Label>
                  <Input
                    maxLength={50}
                    id="cp-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cp-year">Год основания</Label>
                  <Input
                    maxLength={4}
                    id="cp-year"
                    className="tnum"
                    value={extra.facts.founded}
                    onChange={(e) =>
                      setExtra((prev) => ({
                        ...prev,
                        facts: { ...prev.facts, founded: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard
              step="2"
              title="Команда"
              hint="Роли и доступ к кабинету. Руководителя компании изменить нельзя."
            >
              <div className="grid gap-4">
                <EmployeeList
                  employees={employees}
                  canManage={canManage}
                  busy={teamBusy}
                  onInviteClick={() => setInviteOpen(true)}
                  onChangeRole={(userId, role) =>
                    void handleRoleChange(userId, role)
                  }
                  onRemove={(userId) => void handleRemove(userId)}
                />
                {useApi ? (
                  <TeamInvitations side="supplier" companyId={company.id} canManage={canManage} />
                ) : null}
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard
              step="3"
              title="Фото компании"
              hint="Склад, офис, производство, команда, доставка — до 12 фото"
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {extra.photos.map((photo, index) => (
                  <div
                    key={`${photo.name}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt=""
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-card/95 text-red-600 shadow"
                      aria-label="Удалить"
                      onClick={() =>
                        setExtra((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {extra.photos.length < 12 ? (
                  <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line-strong text-center hover:border-brand-600">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        openPhotoCrop(e.target.files)
                        e.target.value = ""
                      }}
                    />
                    <span className="grid justify-items-center gap-1">
                      <Plus className="size-6 text-brand-700" />
                      <span className="text-[13px] font-semibold">
                        Добавить фото
                      </span>
                    </span>
                  </label>
                ) : null}
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard
              step="4"
              title="Факты о компании"
              hint="Короткие цифры, которым доверяют"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {FACT_FIELDS.map((field) => (
                  <div key={field.key} className="grid gap-2">
                    <Label htmlFor={`cpf-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`cpf-${field.key}`}
                      placeholder={field.placeholder}
                      value={extra.facts[field.key]}
                      onChange={(e) =>
                        setExtra((prev) => ({
                          ...prev,
                          facts: {
                            ...prev.facts,
                            [field.key]: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="cp-cl">Ключевые клиенты</Label>
                  <Input
                    id="cp-cl"
                    value={extra.clients}
                    onChange={(e) =>
                      setExtra((prev) => ({ ...prev, clients: e.target.value }))
                    }
                    placeholder="С разрешения клиентов"
                  />
                </div>
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard
              step="5"
              title="Сертификаты компании"
              hint="Дилерские свидетельства, лицензии, ISO"
            >
              <div className="grid gap-2">
                {extra.certs.map((cert, index) => (
                  <div
                    key={`${cert}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-line px-4 py-3"
                  >
                    <Upload className="size-5 text-mute" aria-hidden />
                    <span className="flex-1 text-[14.5px]">{cert}</span>
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      aria-label="Удалить"
                      onClick={() =>
                        setExtra((prev) => ({
                          ...prev,
                          certs: prev.certs.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-4 hover:border-brand-600">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      void handleCerts(e.target.files)
                      e.target.value = ""
                    }}
                  />
                  <Upload className="size-5 text-mute" aria-hidden />
                  <b className="text-[14px]">Загрузить документы</b>
                </label>
              </div>
            </ProfileSectionCard>

            <div
              id="reviews"
              className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <Star className="size-4 text-mute" aria-hidden />
                <b className="text-[15px]">Полученные отзывы</b>
                {reviews.length > 0 ? (
                  <span className="text-[13px] text-mute">· {reviews.length}</span>
                ) : null}
              </div>
              <ReviewsReceivedTable
                reviews={reviews}
                getReviewerName={getReviewerName}
                getContractTitle={getContractTitle}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="lg"
                className="h-12 px-6"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                Сохранить страницу
              </Button>
            </div>
          </div>

          <aside className="grid gap-4 lg:sticky lg:top-[92px]">
            <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
              <span className="text-[14px] font-semibold">Проверка компании</span>
              <div className="mt-2">
                {verified ? (
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                    <Check className="size-4" aria-hidden />
                    Проверенная компания
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold text-amber-700">
                    На проверке
                  </span>
                )}
              </div>
              <ul className="mt-3 grid gap-2 text-[14px]">
                {VERIFY_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-brand-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-mute">
                {verified
                  ? "Проверено администратором площадки."
                  : "Документы появятся здесь после проверки."}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
              <span className="text-[14px] font-semibold">
                Заполненность страницы
              </span>
              <b
                className={cn(
                  "mt-1 block text-[28px] font-bold",
                  level.textClass,
                )}
              >
                {completeness}%
              </b>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn("h-full", level.barClass)}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] text-mute">
                {extra.photos.length < 3
                  ? "Добавьте хотя бы 3 фото компании — это +20%"
                  : "Отлично! Страница заполнена."}
              </p>
            </div>
          </aside>
        </div>
      )}

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        busy={teamBusy}
        onInvite={handleInvite}
      />

      <ImageCropDialog
        open={Boolean(photoCrop)}
        imageSrc={photoCrop?.src ?? null}
        fileName={photoCrop?.name}
        aspect={4 / 3}
        title="Границы фото компании"
        description="Настройте рамку 4∶3 — так фото будет выглядеть в профиле. Перетащите изображение и измените масштаб."
        confirmLabel="Добавить фото"
        busy={photoUploading}
        onOpenChange={handlePhotoCropOpenChange}
        onConfirm={handleCroppedPhoto}
      />
    </PageFrame>
  )
}
