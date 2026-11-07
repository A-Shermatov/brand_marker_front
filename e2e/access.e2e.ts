import { accounts } from "./support/accounts"
import { expect, test } from "./support/fixtures"
import { signIn } from "./support/login"

test.describe("sign-in and access", () => {
  test("a guest is sent to sign in and comes back to the page they opened", async ({ page }) => {
    await page.goto("/customer/contracts")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomer%2Fcontracts/)

    await page.getByLabel("Email").fill(accounts.buyer.email)
    await page.getByLabel("Пароль").fill(accounts.buyer.password)
    await page.getByRole("button", { name: "Войти", exact: true }).click()
    await expect(page).toHaveURL(/\/customer\/contracts$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("a wrong password keeps the door closed", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(accounts.buyer.email)
    await page.getByLabel("Пароль").fill("not-the-password")
    await page.getByRole("button", { name: "Войти", exact: true }).click()

    await expect(page.locator("form p.text-red-700")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    await page.goto("/customer")
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  test("each marketplace role stays in its own cabinet", async ({ pageAs }) => {
    const buyer = await pageAs("buyer")
    await buyer.goto("/supplier/finance")
    await expect(buyer).toHaveURL(/\/customer$/)

    const supplier = await pageAs("supplier")
    await supplier.goto("/customer/payments")
    await expect(supplier).toHaveURL(/\/supplier$/)
  })

  test("the admin panel is closed to marketplace users", async ({ pageAs }) => {
    const buyer = await pageAs("buyer")
    await buyer.goto("/admin/users")
    await expect(buyer).toHaveURL(/\/admin\/login/)
    await expect(buyer.getByRole("button", { name: "Войти в панель" })).toBeVisible()
  })

  test("the admin lands in the panel, not in a marketplace cabinet", async ({ pageAs }) => {
    const admin = await pageAs("admin")
    await admin.goto("/customer")
    await expect(admin).toHaveURL(/\/admin$/)
  })

  test("signing out ends the session", async ({ page }) => {
    // A session of its own: signing out revokes its tokens, not the shared ones.
    await signIn(page, accounts.supplier, "supplier")
    await page.getByRole("button", { name: "Аккаунт" }).click()
    await page.getByRole("menuitem", { name: "Выйти" }).click()
    await expect(page).toHaveURL(/\/(login)?(\?|$)/)

    await page.goto("/supplier")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fsupplier/)
  })
})
