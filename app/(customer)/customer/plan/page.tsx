import { redirect } from "next/navigation"

// Buyers use the platform for free, like any client: there is no buyer tariff.
// Old links to /customer/plan land on the home page.
export default function CustomerPlanPage() {
  redirect("/customer")
}
