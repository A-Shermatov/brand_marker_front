import type { Page } from "@playwright/test"
import { accounts } from "./support/accounts"
import { expect, test } from "./support/fixtures"

/**
 * One person, two cabinets. The reliability mark is one for both: the admin
 * gives it once and it shows in the buying and in the selling cabinet. A paid
 * plan belongs to one cabinet: given to the buying one, it is not on in the
 * selling one, which buys its own. And no plan mark stands next to a name.
 */

const diamond = /^Знак надёжности «Алмаз»/
const anyPlanMark = /^Тариф «/

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

test("the mark is shared by both cabinets, a plan belongs to one", async ({ pageAs }) => {
  const admin = await pageAs("admin")
  const asBuyer = await pageAs("bothBuyer")
  const asSupplier = await pageAs("bothSupplier")
  const buyerCabinet = admin.getByRole("radio", { name: "Кабинет покупателя" })
  const supplierCabinet = admin.getByRole("radio", { name: "Кабинет поставщика" })

  await test.step("admin gives the diamond mark, and the business plan to the buying cabinet", async () => {
    await openUser(admin, accounts.both.email)
    await expect(admin.getByText("Виден в профилях покупателя и поставщика")).toBeVisible()

    await buyerCabinet.click()
    await choose(admin, "Тариф", "Бизнес")
    await admin.getByRole("button", { name: /Выдать тариф|Выдать заново/ }).click()
    await expect(admin.getByRole("button", { name: "Снять подписку" })).toBeVisible()
    // The selling cabinet of the same person got nothing.
    await supplierCabinet.click()
    await expect(admin.getByRole("button", { name: "Снять подписку" })).toHaveCount(0)

    await choose(admin, "Уровень знака", "Алмаз")
    await admin.getByPlaceholder("Причина, видна в журнале действий").last().fill("E2E: проверка знаков")
    await admin.getByRole("button", { name: "Сохранить" }).click()
    await expect(mark(admin, diamond)).toBeVisible()
  })

  await test.step("the buying cabinet shows the mark by the name and the plan on its tariff page", async () => {
    await asBuyer.goto("/customer")
    await expect(mark(asBuyer, diamond)).toBeVisible()
    // One mark by the name is enough: a plan is not a second logo there.
    await expect(asBuyer.getByRole("img", { name: anyPlanMark })).toHaveCount(0)

    await asBuyer.getByRole("navigation", { name: "Меню кабинета" }).getByRole("link", { name: "Тариф и надёжность" }).click()
    await expect(asBuyer).toHaveURL(/\/customer\/plan$/)
    await expect(asBuyer.getByTestId("current-plan")).toHaveText("Тариф «Бизнес»")
    await expect(asBuyer.getByText("оформляется и оплачивается отдельно")).toBeVisible()
  })

  await test.step("the selling cabinet shows the same mark and has no plan of its own yet", async () => {
    await asSupplier.goto("/supplier")
    await expect(mark(asSupplier, diamond)).toBeVisible()
    await expect(asSupplier.getByRole("img", { name: anyPlanMark })).toHaveCount(0)

    await asSupplier.goto("/supplier/subscription")
    await expect(asSupplier.getByTestId("current-plan")).toHaveText("Подписка не подключена")
  })

  await test.step("the selling cabinet buys its own plan; the buying one keeps its own", async () => {
    await asSupplier.getByRole("button", { name: "Подключить «Старт»" }).click()
    await expect(asSupplier.getByTestId("current-plan")).toHaveText("Тариф «Старт»")

    await asBuyer.reload()
    await expect(asBuyer.getByTestId("current-plan")).toHaveText("Тариф «Бизнес»")
  })

  await test.step("taking them back: the mark leaves both cabinets, each plan its own", async () => {
    await asSupplier.getByRole("button", { name: "Отменить подписку" }).click()
    await expect(asSupplier.getByTestId("current-plan")).toHaveText("Подписка не подключена")

    await admin.reload()
    await choose(admin, "Уровень знака", "Авто, по сделкам")
    await admin.getByRole("button", { name: "Сохранить" }).click()
    await buyerCabinet.click()
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
    }
    await asBuyer.goto("/customer/plan")
    await expect(asBuyer.getByTestId("current-plan")).toHaveText("Подписка не подключена")
  })
})
