import type { Browser, Page } from "@playwright/test"
import { API_URL, accounts } from "./support/accounts"
import { expect, runId, test } from "./support/fixtures"
import { signIn, signInAdmin } from "./support/login"
import { approveProfileChanges } from "./support/moderation"

const PASSWORD = "Team-E2E-2026!"

/** A page in a browser of its own: a different person on a different device. */
async function newPerson(browser: Browser): Promise<Page> {
  const context = await browser.newContext()
  return context.newPage()
}

/** Fills the common part of the registration form and submits it. */
async function fillRegistration(page: Page, person: { first: string; last: string; email?: string }) {
  await page.locator("#first_name").fill(person.first)
  await page.locator("#last_name").fill(person.last)
  if (person.email) await page.locator("#email").fill(person.email)
  await page.locator("#password").fill(PASSWORD)
  await page.locator("#confirmPassword").fill(PASSWORD)
  await page.locator('form button[type="submit"]').click()
}

/**
 * Calls the API as the person signed in on the page, with the profile they
 * work from: what a script could do behind the buttons the page hides.
 */
async function apiAs(page: Page, method: string, path: string, body?: unknown): Promise<number> {
  return page.evaluate(
    async ({ api, method, path, body }) => {
      const res = await fetch(`${api}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bm-access-token")}`,
          "X-Actor-Id": localStorage.getItem("bm-actor-id") ?? "",
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      return res.status
    },
    { api: API_URL, method, path, body },
  )
}

const draftRequest = (title: string) => ({
  type: "service",
  title,
  category_id: "it",
  budget_type: "open",
  currency: "TJS",
  deadline: "2027-12-31",
  visibility: "public",
  status: "draft",
  project_duration: "2 недели",
  start_date: "2027-01-15",
})

/**
 * A company's team from the first day to the last: the director registers the
 * company and invites a colleague who has no account yet; the colleague signs
 * up from the link and works as a manager; the director narrows the access to
 * "view only" and finally removes the person.
 */
test("a director invites an employee, changes the access and takes it away", async ({ browser, page: director }) => {
  test.setTimeout(240_000)
  const company = `ООО Команда ${runId}`
  const employeeEmail = `manager.${runId}@example.com`
  const requestTitle = `Заявка менеджера ${runId}`
  let inviteLink = ""

  await test.step("the director registers a company: its name is enough", async () => {
    await director.goto("/register")
    await expect(director.getByRole("button", { name: /Компания или ИП/ })).toHaveAttribute("aria-pressed", "true")
    await director.locator("#company_title").fill(company)
    await fillRegistration(director, { first: "Фаррух", last: "Директоров", email: `director.${runId}@example.com` })
    await expect(director).toHaveURL(/\/customer$/)
    // The cabinet opens in the company, not in a personal profile.
    await expect(director.getByTestId("active-profile")).toHaveText(company)
  })

  await test.step("the director invites a colleague by email as a manager", async () => {
    await director.goto("/customer/company")
    await director.getByRole("button", { name: "Пригласить сотрудника" }).first().click()
    const dialog = director.getByRole("dialog")
    await dialog.getByLabel("Email").fill(employeeEmail)
    await dialog.getByLabel("Уровень доступа").selectOption({ label: "Менеджер" })
    await dialog.getByRole("button", { name: "Отправить приглашение" }).click()

    await expect(dialog.getByRole("heading", { name: "Приглашение отправлено" })).toBeVisible()
    inviteLink = await dialog.getByLabel("Ссылка-приглашение").inputValue()
    expect(inviteLink).toMatch(/\/invite\/[\w-]+$/)
    await dialog.getByRole("button", { name: "Готово" }).click()

    // Nobody joined yet: the person waits in "Приглашения", the team is the director alone.
    const invitations = director.getByRole("region", { name: "Приглашения" })
    await expect(invitations.getByRole("listitem")).toContainText(employeeEmail)
    await expect(invitations.getByRole("listitem")).toContainText("Менеджер · Приглашён, ждём ответа")

    // A second invitation to the same address is refused with a clear reason.
    await director.getByRole("button", { name: "Пригласить сотрудника" }).first().click()
    await dialog.getByLabel("Email").fill(employeeEmail)
    await dialog.getByRole("button", { name: "Отправить приглашение" }).click()
    await expect(dialog.getByRole("alert")).toContainText("уже отправлено")
    await dialog.getByRole("button", { name: "Отмена" }).click()
  })

  const employee = await newPerson(browser)

  await test.step("the colleague opens the link and registers straight into the company", async () => {
    await employee.goto(inviteLink)
    await expect(employee.getByRole("heading", { level: 1 })).toContainText(`Вас пригласили в компанию «${company}»`)
    await expect(employee.getByText("Менеджер", { exact: true })).toBeVisible()
    await employee.getByRole("link", { name: "Зарегистрироваться и принять" }).click()

    await expect(employee.getByTestId("invite-notice")).toContainText(company)
    // The address comes from the invitation and cannot be changed.
    await expect(employee.locator("#email")).toHaveValue(employeeEmail)
    await expect(employee.locator("#email")).toHaveAttribute("readonly", "")
    await fillRegistration(employee, { first: "Алишер", last: "Менеджеров" })

    await expect(employee).toHaveURL(/\/customer$/)
    await expect(employee.getByTestId("active-profile")).toHaveText(company)
  })

  await test.step("the manager does what a manager may: writes a request for the company", async () => {
    expect(await apiAs(employee, "POST", "/buyer/rfqs/", draftRequest(requestTitle))).toBe(200)
    await employee.goto("/customer/rfqs")
    await expect(employee.getByRole("main")).toContainText(requestTitle)
    // The director sees it too: the request belongs to the company.
    await director.goto("/customer/rfqs")
    await expect(director.getByRole("main")).toContainText(requestTitle)
  })

  await test.step("the manager cannot manage the team: no button, and the API refuses", async () => {
    await employee.goto("/customer/company")
    const team = employee.getByRole("main")
    await expect(team).toContainText("Фаррух Директоров")
    await expect(team).toContainText("Алишер Менеджеров")
    await expect(employee.getByRole("button", { name: "Пригласить сотрудника" })).toHaveCount(0)
    await expect(team).toContainText("Изменять роли может только руководитель или администратор компании")

    const companyId = await employee.evaluate(() => {
      const session = JSON.parse(localStorage.getItem("bm-auth") ?? "{}")
      return session?.state?.user?.activeCompanyId as number
    })
    expect(
      await apiAs(employee, "POST", `/buyer/companies/${companyId}/team`, {
        email: `intruder.${runId}@example.com`,
        role: "admin",
      }),
    ).toBe(403)
    expect(await apiAs(employee, "PATCH", `/buyer/companies/${companyId}`, { description: "взлом" })).toBe(403)
  })

  await test.step("the director narrows the access to view only", async () => {
    await director.goto("/customer/company")
    const row = director.getByRole("listitem").filter({ hasText: "Алишер Менеджеров" })
    await row.getByLabel("Роль").selectOption({ label: "Наблюдатель" })
    await expect(row).toContainText("Только просмотр")

    await employee.goto("/customer")
    await expect(employee.getByTestId("viewer-notice")).toContainText("доступ только для просмотра")
    // Still sees the company's requests, but can no longer write one.
    await employee.goto("/customer/rfqs")
    await expect(employee.getByRole("main")).toContainText(requestTitle)
    expect(await apiAs(employee, "POST", "/buyer/rfqs/", draftRequest(`Не выйдет ${runId}`))).toBe(403)
  })

  await test.step("the director takes the access away; the employee is told and put in their own profile", async () => {
    await director.goto("/customer/company")
    await director.getByRole("button", { name: "Убрать из компании: Алишер Менеджеров" }).click()
    const confirm = director.getByRole("dialog")
    await expect(confirm).toContainText("сразу потеряет доступ")
    await confirm.getByRole("button", { name: "Убрать из компании" }).click()
    await expect(director.getByRole("main").getByText("Алишер Менеджеров")).toHaveCount(0)

    // The very next page the employee opens says why, and the cabinet becomes their own.
    await employee.goto("/customer/rfqs")
    await expect(employee.getByText(`У вас больше нет доступа к компании «${company}»`)).toBeVisible()
    await expect(employee).toHaveURL(/\/customer\?left=1$/)
    await expect(employee.getByTestId("active-profile")).toHaveText("Личный профиль")
    await employee.goto("/customer/rfqs")
    await expect(employee.getByRole("main")).not.toContainText(requestTitle)
  })

  await employee.context().close()
})

/**
 * A private person: registers as a freelancer, fills in the page buyers will
 * see and finds it open to everyone, signed in or not.
 */
test("a freelancer registers, fills in their page and it opens to the public", async ({ browser, page }) => {
  test.setTimeout(180_000)
  const surname = `Фрилансов${runId}`
  const skill = `Навык-${runId}`

  await test.step("registers as a private person who sells their work", async () => {
    await page.goto("/register")
    await page.getByRole("button", { name: /Частное лицо/ }).click()
    await page.getByRole("button", { name: /Продавать/ }).click()
    // A private person is not asked for a company.
    await expect(page.locator("#company_title")).toHaveCount(0)
    await page.locator("#headline").fill("Программист: сайты и боты")
    await fillRegistration(page, { first: "Рустам", last: surname, email: `freelancer.${runId}@example.com` })
    // Straight to the page buyers will see: it starts almost empty.
    await expect(page).toHaveURL(/\/supplier\/profile\?welcome=1$/)
    await expect(page.getByTestId("active-profile")).toHaveText("Личный профиль")
  })

  let publicPath = ""
  await test.step("fills in the page: about, skills, rate, a piece of work", async () => {
    const form = page.getByRole("form", { name: "Моя страничка" })
    await expect(form.getByLabel("Чем вы занимаетесь")).toHaveValue("Программист: сайты и боты")
    await expect(form.getByLabel("Принимаю заказы как частное лицо")).toBeChecked()
    await form.getByLabel("О себе").fill("Делаю сайты для малого бизнеса, сдаю работу по этапам.")
    await form.getByLabel("Навыки").fill(`Python, Next.js, ${skill}`)
    await form.getByLabel("Город").fill("Худжанд")
    await form.getByLabel("Сумма").fill("200")
    await form.getByLabel("За что").selectOption({ label: "за час" })
    await form.getByRole("button", { name: "Добавить работу" }).click()
    await form.getByLabel("Название работы 1").fill("Сайт для автосервиса")
    await form.getByLabel("Описание работы 1").fill("Запись на ремонт и напоминания клиентам.")
    await form.getByRole("button", { name: "Сохранить страничку" }).click()
    // What the public sees waits for an admin.
    await expect(page.getByText(/Страница отправлена на проверку/)).toBeVisible()
    const admin = await newPerson(browser)
    await signInAdmin(admin, accounts.admin)
    await approveProfileChanges(admin, new RegExp(`Рустам ${surname}`))
    await admin.context().close()

    const href = await form.getByRole("link", { name: "Как видят меня другие" }).getAttribute("href")
    expect(href).toMatch(/^\/performers\/\d+/)
    publicPath = href!.split("?")[0]
  })

  await test.step("a guest opens the page and sees a person, not a company", async () => {
    const guest = await newPerson(browser)
    await guest.goto(publicPath)
    await expect(guest.getByRole("heading", { level: 1 })).toContainText(`Рустам ${surname}`)
    await expect(guest.getByTestId("person-headline")).toHaveText("Программист: сайты и боты")
    const main = guest.getByRole("main")
    await expect(main.getByText("Частное лицо", { exact: true })).toBeVisible()
    await expect(main).toContainText("Делаю сайты для малого бизнеса")
    await expect(main.getByLabel("Навыки")).toContainText(skill)
    await expect(main).toContainText("Худжанд")
    await expect(main).toContainText(/200\sTJS \/ час/)
    await expect(guest.getByRole("heading", { name: "Портфолио" })).toBeVisible()
    await expect(main).toContainText("Сайт для автосервиса")

    // And the freelancer is listed among suppliers, found by a skill.
    const res = await guest.request.get(`${API_URL}/public/suppliers`, { params: { q: skill } })
    const found = (await res.json()).items as { display_name: string; kind: string }[]
    expect(found.map((s) => [s.display_name, s.kind])).toEqual([[`Рустам ${surname}`, "individual"]])
    await guest.context().close()
  })
})

/** The demo team from the seed: who is who shows at once after signing in. */
test("demo employees land in their company with the access they were given", async ({ browser }) => {
  const viewer = await newPerson(browser)
  await signIn(viewer, { email: "viewer@example.com", password: "Viewer123!" }, "supplier")
  await expect(viewer.getByTestId("active-profile")).toHaveText("ТехноСнаб")
  await expect(viewer.getByTestId("viewer-notice")).toBeVisible()
  await viewer.goto("/supplier/team")
  const team = viewer.getByRole("main")
  await expect(team).toContainText("Алишер Рахимов")
  await expect(team).toContainText("Зарина Каримова")
  await expect(viewer.getByRole("button", { name: "Пригласить сотрудника" })).toHaveCount(0)
  await viewer.context().close()

  // The company's director still signs in as before.
  const owner = await newPerson(browser)
  await signIn(owner, accounts.supplier, "supplier")
  await owner.goto("/supplier/team")
  await expect(owner.getByRole("button", { name: "Пригласить сотрудника" }).first()).toBeVisible()
  await owner.context().close()
})
