import { expect, type Page } from "@playwright/test"
import type { Account, SessionRole } from "./accounts"

/** Signs in through the marketplace login form, as a buyer or a supplier. */
export async function signIn(page: Page, account: Account, role: SessionRole) {
  await page.goto("/login")
  await page.getByRole("button", { name: role === "supplier" ? /Продавать/ : /Покупать/ }).click()
  await page.getByLabel("Email").fill(account.email)
  await page.getByLabel("Пароль").fill(account.password)
  await page.getByRole("button", { name: "Войти", exact: true }).click()
  await expect(page).toHaveURL(role === "supplier" ? /\/supplier(\/|$)/ : /\/customer(\/|$)/)
}

/** Signs in through the admin panel login form. */
export async function signInAdmin(page: Page, account: Account) {
  await page.goto("/admin/login")
  await page.getByLabel("Email").fill(account.email)
  await page.getByLabel("Пароль").fill(account.password)
  await page.getByRole("button", { name: "Войти в панель" }).click()
  await expect(page).toHaveURL(/\/admin(\/|$)(?!login)/)
}
