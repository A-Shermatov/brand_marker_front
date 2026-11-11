import type { Page } from "@playwright/test"
import { expect } from "./fixtures"

/**
 * Profile changes wait for an admin. The admin opens the queue, picks the
 * person or company by name and approves.
 */
export async function approveProfileChanges(admin: Page, who: string | RegExp) {
  await admin.goto("/admin/verification?tab=changes")
  await admin.getByRole("button", { name: who }).first().click()
  await admin.getByRole("button", { name: "Одобрить" }).click()
  await expect(admin.getByText("Изменения применены")).toBeVisible()
}
