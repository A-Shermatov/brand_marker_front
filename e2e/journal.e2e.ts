import type { Page } from "@playwright/test"
import { expect, test } from "./support/fixtures"

/** The site tells the journal about a page about a second and a half after it opens. */
const pageReported = (page: Page) =>
  page.waitForResponse(
    (response) => response.url().endsWith("/activity") && response.request().method() === "POST",
  )

/**
 * The journal keeps everything a person does, down to a page they only looked
 * at, with the device it came from. An administrator finds it by the person,
 * opens a row and gets from it to the device and to everybody who used it.
 */
test("the journal shows the pages a person opened, their requests and their device", async ({ pageAs }) => {
  const buyer = await pageAs("buyer")
  let reported = pageReported(buyer)
  await buyer.goto("/customer/rfqs")
  expect((await reported).ok()).toBe(true)
  reported = pageReported(buyer)
  await buyer.goto("/customer/profile?tab=security")
  await expect(buyer.getByRole("button", { name: "Сменить пароль" })).toBeVisible()
  expect((await reported).ok()).toBe(true)

  const admin = await pageAs("admin")
  // A row of the journal opens its details, so it is a button, not a plain table row.
  const rows = admin.getByRole("region", { name: "Записи журнала" }).locator("tbody tr")

  await test.step("pages: what was opened, by the names of the menu", async () => {
    await admin.goto("/admin/logs?view=pages&query=buyer%40example.com")
    await expect(admin.getByRole("tablist", { name: "Что показывать" }).getByRole("tab")).toHaveText([
      "События",
      "Все действия",
      "Страницы",
      "Устройства",
    ])
    const profile = rows.filter({ hasText: "Мой профиль" }).first()
    await expect(profile).toContainText("Кабинет покупателя")
    await expect(profile).toContainText("/customer/profile")
    await expect(profile).toContainText("buyer@example.com")
    await expect(rows.filter({ hasText: "Мои заявки" }).first()).toContainText("/customer/rfqs")
  })

  await test.step("all actions: plain views are there too, each with its device", async () => {
    await admin.goto("/admin/logs?view=http&kind=view&section=rfqs&query=buyer%40example.com")
    const view = rows.filter({ hasText: "Просмотр" }).first()
    await expect(view).toContainText("Заявки")
    await expect(view).toContainText("Успешно")
    await expect(view.getByRole("button", { name: /^Устройство:/ })).toBeVisible()

    await view.click()
    const details = admin.getByRole("dialog", { name: "Подробности записи" })
    await expect(details.getByRole("heading", { name: "Устройство" })).toBeVisible()
    await details.getByText("Технические данные").click()
    await expect(details).toContainText("GET /api/v1/buyer/rfqs")
    await expect(details).toContainText("Номер запроса")
  })

  await test.step("from a row to the device, and to everybody who used it", async () => {
    await admin
      .getByRole("dialog", { name: "Подробности записи" })
      .getByRole("button", { name: "Открыть карточку устройства" })
      .click()
    const card = admin.getByRole("dialog", { name: "Устройство" })
    await expect(card.getByRole("heading", { name: "Аккаунты на этом устройстве" })).toBeVisible()
    await expect(card).toContainText("buyer@example.com")
    // The browser has told about itself, and that a program drives it (this test).
    await expect(card.getByRole("heading", { name: "Что сообщил браузер" })).toBeVisible()
    await expect(card).toContainText("Часовой пояс")
    await expect(card).toContainText("Управляется программой")

    await card.getByRole("link", { name: "Все действия с этого устройства" }).click()
    await expect(admin).toHaveURL(/\/admin\/logs\?view=http&period=all&device=/)
    await expect(admin.getByText(/^Устройство [0-9a-f]{8}…$/)).toBeVisible()
    await expect(rows.first()).toBeVisible()
  })

  await test.step("devices: the registry finds the device by the person", async () => {
    await admin.goto("/admin/logs?view=devices")
    const registry = admin.getByRole("region", { name: "Устройства" })
    const devices = registry.locator("tbody tr")
    await expect(devices.first()).toBeVisible()
    // The list keeps showing what it had until the search comes back.
    const found = admin.waitForResponse(
      (response) => response.url().includes("/admin/devices?") && response.url().includes("query=buyer"),
    )
    await admin.getByLabel("Поиск").fill("buyer@example.com")
    await found
    await expect(registry).toHaveAttribute("aria-busy", "false")
    await devices.first().click()
    const card = admin.getByRole("dialog", { name: "Устройство" })
    await expect(card.getByRole("heading", { name: "Аккаунты на этом устройстве" })).toBeVisible()
    await expect(card).toContainText("buyer@example.com")
  })
})

test("a person's page in the admin lists their devices", async ({ pageAs }) => {
  const supplier = await pageAs("supplier")
  const reported = pageReported(supplier)
  await supplier.goto("/supplier")
  await reported

  const admin = await pageAs("admin")
  // From a row of the journal to the person it is about.
  await admin.goto("/admin/logs?view=pages&query=supplier%40example.com")
  await admin.getByRole("region", { name: "Записи журнала" }).locator("tbody tr").first().click()
  await admin
    .getByRole("dialog", { name: "Подробности записи" })
    .locator('a[href^="/admin/users/"]')
    .click()
  await expect(admin).toHaveURL(/\/admin\/users\/\d+/)
  await admin.getByRole("tab", { name: "Устройства" }).click()
  await expect(admin.getByRole("region", { name: "Устройства" }).locator("tbody tr").first()).toBeVisible()
  await expect(admin.getByRole("link", { name: "Все действия пользователя" })).toHaveAttribute(
    "href",
    /\/admin\/logs\?view=http&period=all&user_id=\d+/,
  )
})
