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

  test("a newcomer registers, is shown where to start and is led to the first request", async ({ page }) => {
    // An account of its own each run: the guide depends on the cabinet being empty.
    const email = `newcomer.${Date.now().toString(36)}@example.com`
    await page.goto("/register")
    // The form opens on "Компания или ИП": its name is all it asks about the company.
    await page.locator("#company_title").fill("ООО Новичок")
    await page.locator("#first_name").fill("Нигина")
    await page.locator("#last_name").fill("Новая")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill("Newcomer-2026!")
    await page.locator("#confirmPassword").fill("Newcomer-2026!")
    await page.locator('form button[type="submit"]').click()
    await expect(page).toHaveURL(/\/customer$/)

    // No page of zeros: the path to a first deal, with the first step marked as the current one.
    const guide = page.getByRole("region", { name: "Первая сделка: четыре шага" })
    await expect(guide).toBeVisible()
    await expect(guide.getByRole("listitem")).toHaveCount(4)
    await expect(guide.locator('li[aria-current="step"]')).toContainText("Расскажите, что нужно")
    await expect(page.getByText("На гарантии в банке")).toHaveCount(0)

    // The menu names things by what the person does: their requests are "Мои заявки".
    const menu = page.getByRole("navigation", { name: "Меню кабинета" })
    await expect(menu.getByRole("link", { name: "Мои заявки" })).toBeVisible()

    // An empty list explains itself instead of answering "nothing found".
    await menu.getByRole("link", { name: "Мои заявки" }).click()
    await expect(page).toHaveURL(/\/customer\/rfqs$/)
    await expect(page.getByRole("heading", { name: "У вас пока нет заявок" })).toBeVisible()

    await page.goto("/customer")
    await guide.getByRole("link", { name: "Новая заявка" }).click()
    await expect(page).toHaveURL(/\/customer\/rfqs\/new$/)
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
