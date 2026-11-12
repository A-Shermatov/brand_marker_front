import type { Browser, Page } from "@playwright/test"
import { expect, runId, test } from "./support/fixtures"

/** The admin menu, as the administrator of the demo data sees it. */
const MENU: [string | null, string[]][] = [
  [null, ["Обзор"]],
  ["Требует решения", ["Проверка клиентов", "Товары и услуги", "Жалобы", "Споры", "Поддержка"]],
  ["Площадка", ["Пользователи", "Заявки и сделки", "Переписки", "Деньги"]],
  ["Управление", ["Журнал действий", "Сотрудники и доступ", "Настройки"]],
]

const menu = (page: Page) => page.getByRole("navigation", { name: "Админ-навигация" })

/** The names of the menu items (the groups hold them all), without the counters next to them. */
const menuItems = async (page: Page) =>
  (await menu(page).getByRole("group").getByRole("link").allTextContents()).map((text) =>
    text.replace(/\d+$/, "").trim(),
  )

/** A member of staff signs in through the form, in a browser of their own. */
const signInAsStaff = async (browser: Browser, email: string, password: string) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto("/admin/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Пароль").fill(password)
  await page.getByRole("button", { name: "Войти" }).click()
  await expect(page).not.toHaveURL(/\/admin\/login/)
  return { context, page }
}

test("the admin panel has one place for everything", async ({ pageAs }) => {
  const admin = await pageAs("admin")
  await admin.goto("/admin")

  await test.step("the menu: three groups, every section named by what is done there", async () => {
    for (const [group, items] of MENU) {
      if (!group) continue
      await expect(menu(admin).getByRole("group", { name: group }).getByRole("link")).toHaveText(
        items.map((item) => new RegExp(`^${item}\\d*$`)),
      )
    }
    expect(await menuItems(admin)).toEqual(MENU.flatMap(([, items]) => items))
  })

  await test.step("the overview shows the queues with the numbers of the menu", async () => {
    const queues = admin.getByRole("region", { name: "Требует решения" })
    await expect(queues.getByRole("link")).toHaveCount(7)
    const inMenu = (await menu(admin).getByRole("link", { name: /^Жалобы/ }).textContent())?.match(/\d+$/)?.[0]
    await expect(queues.getByRole("link", { name: /Жалобы/ })).toContainText(inMenu ?? "0")
  })

  await test.step("a section keeps one row of tabs, and the address remembers the tab", async () => {
    await menu(admin).getByRole("link", { name: /^Проверка клиентов/ }).click()
    const tabs = admin.getByRole("tablist", { name: "Проверка клиентов" })
    await expect(tabs.getByRole("tab")).toHaveText([
      /^Компании-поставщики/,
      /^Компании-покупатели/,
      /^Частные лица/,
      /^Изменения профилей/,
    ])
    await tabs.getByRole("tab", { name: /^Частные лица/ }).click()
    await expect(admin).toHaveURL(/\/admin\/verification\?tab=individuals$/)
    await expect(tabs.getByRole("tab", { name: /^Частные лица/ })).toHaveAttribute("aria-selected", "true")

    await menu(admin).getByRole("link", { name: /^Деньги/ }).click()
    await expect(admin.getByRole("tablist", { name: "Деньги" }).getByRole("tab")).toHaveText([
      "Платежи",
      "На гарантии",
      "Подписки и доходы",
      "Счета продавцов",
      "Обмен с банком",
    ])
    // What the page can do is in sight: the export used to be hidden here.
    await expect(admin.getByRole("button", { name: "Экспорт" })).toBeVisible()
  })

  await test.step("addresses from before the menu changed still lead to the right page", async () => {
    await admin.goto("/admin/moderation?tab=rfqs")
    await expect(admin).toHaveURL(/\/admin\/rfqs$/)
    await expect(admin.getByRole("tablist", { name: "Заявки и сделки" }).getByRole("tab", { name: "Заявки" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    await admin.goto("/admin/disputes?tab=contracts")
    await expect(admin).toHaveURL(/\/admin\/contracts$/)
    await admin.goto("/admin/roles")
    await expect(admin).toHaveURL(/\/admin\/staff\?tab=roles$/)
  })

  await test.step("the administrator's own password is not among the marketplace settings", async () => {
    await admin.goto("/admin/settings")
    await expect(admin.getByRole("form", { name: "Настройки комиссии" })).toBeVisible()
    await expect(admin.getByRole("button", { name: "Сменить пароль" })).toHaveCount(0)
    await admin.getByRole("button", { name: "Открыть меню профиля" }).click()
    await admin.getByRole("menuitem", { name: /Мой аккаунт/ }).click()
    await expect(admin).toHaveURL(/\/admin\/account$/)
    await expect(admin.getByRole("button", { name: "Сменить пароль" })).toBeVisible()
  })
})

test("the administrator gives a moderator access, widens it and takes it away", async ({ pageAs, browser }) => {
  test.setTimeout(180_000)
  const email = `moderator-${runId}@example.com`
  const admin = await pageAs("admin")
  let password = ""

  await test.step("adds the moderator and gets what to hand over", async () => {
    await admin.goto("/admin/staff")
    await admin.getByRole("button", { name: "Добавить сотрудника" }).first().click()
    const form = admin.getByRole("dialog", { name: "Новый сотрудник" })
    await form.getByLabel("Email").fill(email)
    await form.getByLabel("Имя").fill("Мадина")
    await form.getByLabel("Фамилия").fill("Проверяющая")
    await form.getByRole("combobox", { name: "Роль" }).click()
    await admin.getByRole("option", { name: "Модератор" }).click()
    await form.getByRole("button", { name: "Придумать" }).click()
    await form.getByRole("button", { name: "Добавить сотрудника" }).click()

    const handover = admin.getByRole("alertdialog", { name: "Сотрудник добавлен" })
    await expect(handover).toContainText(email)
    await expect(handover).toContainText("/admin/login")
    password = (await handover.getByTestId("new-staff-password").innerText()).trim()
    expect(password).toMatch(/^[A-Za-z0-9]{14}$/)
    await handover.getByRole("button", { name: "Готово" }).click()
    await expect(admin.getByRole("row").filter({ hasText: email })).toContainText("Модератор")
  })

  const { context, page: moderator } = await signInAsStaff(browser, email, password)

  await test.step("the moderator sees the checks, and neither money nor staff", async () => {
    await expect(menu(moderator).getByRole("link", { name: /^Проверка клиентов/ })).toBeVisible()
    const items = await menuItems(moderator)
    expect(items).toEqual(expect.arrayContaining(["Товары и услуги", "Жалобы", "Споры", "Поддержка"]))
    for (const closed of ["Деньги", "Сотрудники и доступ", "Журнал действий"]) expect(items).not.toContain(closed)
    // The overview offers no way into what is closed.
    await expect(moderator.getByRole("region", { name: "Требует решения" }).getByRole("link", { name: /Выплаты/ })).toHaveCount(0)
    // Knowing the address does not help.
    await moderator.goto("/admin/finance")
    await expect(moderator).toHaveURL(/\/admin$/)
  })

  await test.step("the administrator lets the role see money, and it stays so", async () => {
    await admin.goto("/admin/staff?tab=roles")
    await admin.getByRole("list", { name: "Роли сотрудников" }).getByText("Модератор", { exact: true }).click()
    const right = admin.getByRole("checkbox", { name: "Деньги: Просмотр" })
    await expect(right).not.toBeChecked()
    await right.check()
    await admin.getByRole("button", { name: "Сохранить" }).click()
    await expect(admin.getByRole("button", { name: "Сохранить" })).toBeDisabled()

    await moderator.goto("/admin")
    await expect(menu(moderator).getByRole("link", { name: /^Деньги/ })).toBeVisible()
    await menu(moderator).getByRole("link", { name: /^Деньги/ }).click()
    await expect(moderator.getByRole("tablist", { name: "Деньги" })).toBeVisible()
  })

  await test.step("blocked, the moderator is out of the panel", async () => {
    await admin.goto("/admin/staff")
    await admin.getByRole("button", { name: "Заблокировать: Мадина Проверяющая" }).click()
    await admin.getByRole("alertdialog").getByRole("button", { name: "Заблокировать" }).click()
    await expect(admin.getByRole("row").filter({ hasText: email })).toContainText("Заблокирован")

    await moderator.goto("/admin/verification")
    await expect(moderator).toHaveURL(/\/admin\/login/, { timeout: 30_000 })
  })

  await context.close()
})

test("the administrator's everyday actions go through", async ({ pageAs }) => {
  const admin = await pageAs("admin")

  await test.step("approves a position that waits for moderation", async () => {
    await admin.goto("/admin/catalog?status=pending_review")
    const waiting = admin.locator("main tbody tr").first()
    await expect(waiting).toContainText("На модерации")
    await waiting.getByRole("link").first().click()
    await expect(admin).toHaveURL(/\/admin\/catalog\/\d+$/)
    await admin.getByRole("button", { name: "Одобрить" }).click()
    await admin.getByRole("dialog", { name: "Одобрить позицию?" }).getByRole("button", { name: "Одобрить" }).click()
    await expect(admin.getByRole("button", { name: "Одобрить" })).toHaveCount(0)
    await expect(admin.getByRole("main")).toContainText("Активна")
  })

  await test.step("adds a category to the catalogue", async () => {
    const name = `Проверка ${runId}`
    await admin.goto("/admin/categories")
    await admin.getByRole("button", { name: "Добавить категорию" }).click()
    const form = admin.getByRole("dialog", { name: "Новая категория" })
    await form.getByLabel("Название").fill(name)
    await form.getByRole("button", { name: "Создать" }).click()
    await expect(form).toHaveCount(0)
    await expect(admin.getByRole("list", { name: "Дерево категорий" })).toContainText(name)
  })

  await test.step("changes the commission of the marketplace", async () => {
    await admin.goto("/admin/settings")
    const form = admin.getByRole("form", { name: "Настройки комиссии" })
    const percent = form.getByLabel("Процент комиссии, %")
    const before = await percent.inputValue()
    const after = before === "7" ? "6" : "7"
    await percent.fill(after)
    await form.getByRole("button", { name: "Сохранить" }).click()
    await admin.reload()
    await expect(admin.getByRole("form", { name: "Настройки комиссии" }).getByLabel("Процент комиссии, %")).toHaveValue(after)
    // Put back, so other scenarios count with the usual commission.
    const again = admin.getByRole("form", { name: "Настройки комиссии" })
    await again.getByLabel("Процент комиссии, %").fill(before)
    await again.getByRole("button", { name: "Сохранить" }).click()
    await admin.reload()
    await expect(admin.getByRole("form", { name: "Настройки комиссии" }).getByLabel("Процент комиссии, %")).toHaveValue(before)
  })

  await test.step("answers a person who wrote to support", async () => {
    await admin.goto("/admin/support")
    const reply = `Ответ поддержки ${runId}`
    await admin.getByPlaceholder("Сообщение").fill(reply)
    await admin.getByPlaceholder("Сообщение").press("Enter")
    await expect(admin.getByRole("main")).toContainText(reply)
  })

  await test.step("reads a deal's chat with every message under its author's side", async () => {
    await admin.goto("/admin/chats")
    await admin.locator("main").getByRole("button").filter({ hasText: "↔" }).first().click()
    const chat = admin.locator("main")
    await expect(chat.getByPlaceholder(/Сообщение от модератора/)).toBeVisible()
    // The parties' own messages are not signed «Модератор».
    const authors = await chat.locator("span.font-bold").allTextContents()
    expect(authors.length).toBeGreaterThan(0)
    expect(authors.every((author) => author.startsWith("Модератор"))).toBe(false)
  })
})
