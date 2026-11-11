import type { ProductRfqCreate, RfqCreate, ServiceRfqCreate } from "@/types"

/** Payload sent to backend — without client-only fields */
export type ApiRfqPayload = Omit<ProductRfqCreate | ServiceRfqCreate, "actor_id" | "created_by">

/** Strip client-only fields before sending to backend */
export const toRfqPayload = (input: RfqCreate): ApiRfqPayload => {
  const {
    actor_id: _a,
    created_by: _c,
    status,
    invited_supplier_ids,
    ...rest
  } = input as RfqCreate & { actor_id?: string; created_by?: string }

  const base = {
    title: rest.title,
    description: rest.description,
    category_id: rest.category_id,
    budget_type: rest.budget_type,
    budget_from: rest.budget_from,
    budget_to: rest.budget_to,
    currency: rest.currency,
    deadline: rest.deadline,
    visibility: rest.visibility,
    ...(status ? { status } : {}),
    ...(invited_supplier_ids?.length ? { invited_supplier_ids } : {}),
  }

  if (input.type === "product") {
    return {
      type: "product",
      ...base,
      quantity: input.quantity,
      delivery_country: input.delivery_country,
      delivery_city: input.delivery_city,
      delivery_address: input.delivery_address ?? null,
      delivery_date: input.delivery_date,
    } as ApiRfqPayload
  }

  return {
    type: "service",
    ...base,
    project_duration: input.project_duration,
    start_date: input.start_date,
    delivery_date: input.delivery_date ?? null,
    team_size_required: input.team_size_required ?? null,
    experience_required: input.experience_required ?? null,
  } as ApiRfqPayload
}
