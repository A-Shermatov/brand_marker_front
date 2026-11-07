import type { Page } from "@playwright/test"
import { accounts } from "./support/accounts"
import { expect, test } from "./support/fixtures"

/**
 * One person, two profiles: a mark and a plan the admin gives show in the
 * buying and in the selling cabinet alike, and taking them back removes them
 * from both.
 */

const diamond = /^Знак надёжности «Алмаз»/
const business = /^Тариф «Бизнес»/

/** A mark drawn on the page: role img with its hint as the name. */
const mark = (page: Page, name: RegExp) => page.getByRole("img", { name }).filter({ visible: true }).first()

async function openUser(admin: Page, email: string) {
  await admin.goto("/admin/users")
  await admin.getByRole("searchbox", { name: "Поиск пользователей" }).fill(email)
  await admin.getByRole("row", { name: new RegExp(email) }).getByRole("link", { name: "Открыть →" }).click()
  await expect(admin).toHaveURL(/\/admin\/users\/\d+$/)
  await expect(admin.getByRole("heading", { name: "Знак надёжности" })).toBeVisible()
}

async function choose(page: Page, combobox: string, option: string) {
  await page.getByRole("combobox", { name: combobox }).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

test("a mark and a plan given by the admin show on the buying and the selling profile", async ({ pageAs }) => {
  const admin = await pageAs("admin")
  const asBuyer = await pageAs("bothBuyer")
  const asSupplier = await pageAs("bothSupplier")

  await test.step("admin gives the diamond mark and the business plan", async () => {
    await openUser(admin, accounts.both.email)
    await expect(admin.getByText("Виден в профилях покупателя и поставщика")).toBeVisible()

    await choose(admin, "Тариф", "Бизнес")
    await admin.getByRole("button", { name: /Выдать тариф|Выдать заново/ }).click()
    await expect(admin.getByRole("button", { name: "Снять подписку" })).toBeVisible()

    await choose(admin, "Уровень знака", "Алмаз")
    await admin.getByPlaceholder("Причина, видна в журнале действий").last().fill("E2E: проверка знаков")
    await admin.getByRole("button", { name: "Сохранить" }).click()
    await expect(mark(admin, diamond)).toBeVisible()
  })

  await test.step("the buying cabinet shows both", async () => {
    await asBuyer.goto("/customer")
    await expect(mark(asBuyer, diamond)).toBeVisible()
    await expect(mark(asBuyer, business)).toBeVisible()
  })

  await test.step("the selling cabinet shows both", async () => {
    await asSupplier.goto("/supplier")
    await expect(mark(asSupplier, diamond)).toBeVisible()
    await expect(mark(asSupplier, business)).toBeVisible()
  })

  await test.step("taking them back removes them from both cabinets", async () => {
    await admin.reload()
    await choose(admin, "Уровень знака", "Авто, по сделкам")
    await admin.getByRole("button", { name: "Сохранить" }).click()
    await admin.getByRole("button", { name: "Снять подписку" }).click()
    await expect(admin.getByRole("button", { name: "Снять подписку" })).toHaveCount(0)
    await expect(admin.getByRole("img", { name: diamond })).toHaveCount(0)

    for (const [page, path] of [
      [asBuyer, "/customer"],
      [asSupplier, "/supplier"],
    ] as const) {
      await page.goto(path)
      // Checking for absence: first let the profile and its marks finish loading.
      await page.waitForLoadState("networkidle")
      await expect(page.getByRole("img", { name: diamond })).toHaveCount(0)
      await expect(page.getByRole("img", { name: business })).toHaveCount(0)
    }
  })
})
