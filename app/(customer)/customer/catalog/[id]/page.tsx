import { notFound } from "next/navigation"
import { ServiceDetailContent } from "@/app/services/[id]/service-detail-content"

type CabinetProductPageProps = {
  params: Promise<{ id: string }>
}

/** A catalog item opened from the buyer's cabinet: same page, cabinet frame. */
export default async function CabinetProductPage({ params }: CabinetProductPageProps) {
  const { id } = await params
  const itemId = Number(id)
  if (!Number.isInteger(itemId) || itemId <= 0) notFound()

  return <ServiceDetailContent serviceId={itemId} variant="cabinet" />
}
