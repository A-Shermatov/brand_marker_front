import { describe, expect, it } from "vitest"
import {
  adminHubHref,
  adminMenuFor,
  allowedAdminTabs,
  canAccessAdminPath,
  getFirstAllowedAdminPath,
} from "@/lib/admin-permissions"
import { HUB_ICONS } from "@/lib/cabinet-icons"
import {
  ADMIN_HUBS,
  ADMIN_HUB_PERMISSIONS,
  ADMIN_SECTION_TITLE,
  ADMIN_SUBTABS,
  groupHubs,
  matchHub,
  matchSubtab,
} from "@/lib/cabinet-nav"
import { accessNote, generatePassword } from "@/lib/staff-access"

const staff = (platformRole: string, permissions: string[]) => ({ platformRole, permissions })

/** What the built-in moderator role holds: checks and moderation, no money, staff or roles. */
const MODERATOR = staff("moderator", [
  "admin_dashboard.view",
  "admin_companies.view",
  "admin_companies.update",
  "admin_catalog.view",
  "admin_catalog.update",
  "admin_reports.view",
  "admin_reports.update",
  "admin_disputes.view",
  "admin_disputes.update",
  "admin_support.view",
  "admin_support.update",
  "admin_users.view",
  "admin_users.update",
  "admin_rfqs.view",
  "admin_proposals.view",
  "admin_contracts.view",
  "platform_settings.view",
])
const SUPERADMIN = staff("superadmin", [])
const labels = (hubs: { label: string }[]) => hubs.map((hub) => hub.label)

describe("the admin menu", () => {
  it("is three groups: what waits, the marketplace, the panel", () => {
    expect(groupHubs(ADMIN_HUBS).map((group) => [group.label, labels(group.hubs)])).toEqual([
      [null, ["Обзор"]],
      ["Требует решения", ["Проверка клиентов", "Товары и услуги", "Жалобы", "Споры", "Поддержка"]],
      ["Площадка", ["Пользователи", "Заявки и сделки", "Переписки", "Деньги"]],
      ["Управление", ["Журнал действий", "Сотрудники и доступ", "Настройки"]],
    ])
  })

  it("names every section, gives it an icon and a line on what it is for", () => {
    for (const hub of ADMIN_HUBS) {
      expect(HUB_ICONS.admin[hub.id], `icon of ${hub.label}`).toBeDefined()
      if (hub.id === "home") continue
      expect(ADMIN_SECTION_TITLE[hub.id]?.title, `title of ${hub.label}`).toBe(hub.label)
      expect(ADMIN_SECTION_TITLE[hub.id]?.description.length).toBeGreaterThan(20)
    }
  })

  it("keeps every page in exactly one section", () => {
    for (const hub of ADMIN_HUBS) {
      for (const tab of ADMIN_SUBTABS[hub.id] ?? []) {
        const path = tab.href.split("?")[0]
        expect(matchHub(ADMIN_HUBS, path, "/admin")?.id, `${tab.label} (${path})`).toBe(hub.id)
      }
      // A section either has tabs that say who may open them, or one right of its own.
      const tabs = ADMIN_SUBTABS[hub.id]
      if (tabs) expect(tabs.every((tab) => tab.permissions?.length)).toBe(true)
      else expect(ADMIN_HUB_PERMISSIONS[hub.id]?.length, `right of ${hub.label}`).toBeGreaterThan(0)
    }
  })

  it("never keeps more than one row of tabs, each tab with a name of its own", () => {
    for (const [hubId, tabs] of Object.entries(ADMIN_SUBTABS)) {
      expect(tabs.length, hubId).toBeGreaterThan(1)
      expect(new Set(tabs.map((tab) => tab.label)).size, hubId).toBe(tabs.length)
      expect(new Set(tabs.map((tab) => tab.href)).size, hubId).toBe(tabs.length)
    }
  })
})

describe("which tab an address belongs to", () => {
  const tabOf = (hubId: string, pathname: string, search = "") =>
    matchSubtab(ADMIN_SUBTABS[hubId], pathname, search)?.id

  it("reads the tab from the search parameters", () => {
    expect(tabOf("verif", "/admin/verification")).toBe("suppliers")
    expect(tabOf("verif", "/admin/verification", "tab=buyers")).toBe("buyers")
    expect(tabOf("verif", "/admin/verification", "tab=individuals")).toBe("individuals")
    expect(tabOf("verif", "/admin/verification", "tab=changes&status=approved")).toBe("changes")
    expect(tabOf("staff", "/admin/staff", "tab=roles")).toBe("roles")
  })

  it("tells the tabs of «Деньги» apart, filters of a list included", () => {
    expect(tabOf("money", "/admin/finance")).toBe("ledger")
    // «view=payouts» is a filter of the payments list, not a tab.
    expect(tabOf("money", "/admin/finance", "view=payouts")).toBe("ledger")
    expect(tabOf("money", "/admin/finance", "tab=escrow")).toBe("escrow")
    expect(tabOf("money", "/admin/finance", "view=billing")).toBe("billing")
    expect(tabOf("money", "/admin/finance", "tab=merchants&page=2")).toBe("merchants")
    expect(tabOf("money", "/admin/gateway-logs")).toBe("bank")
    // A payment opened from the list still belongs to the list.
    expect(tabOf("money", "/admin/finance/12")).toBe("ledger")
  })

  it("follows pages that have an address of their own", () => {
    expect(tabOf("users", "/admin/companies/7")).toBe("companies")
    expect(tabOf("users", "/admin/trust")).toBe("trust")
    expect(tabOf("deals", "/admin/contracts")).toBe("contracts")
    expect(tabOf("settings", "/admin/telegram")).toBe("telegram")
  })
})

describe("what a member of staff sees", () => {
  it("shows a superadmin everything", () => {
    expect(labels(adminMenuFor(SUPERADMIN))).toEqual(labels(ADMIN_HUBS))
    expect(getFirstAllowedAdminPath(SUPERADMIN)).toBe("/admin")
  })

  it("keeps money, staff and the journal away from a moderator", () => {
    const menu = labels(adminMenuFor(MODERATOR))
    expect(menu).toEqual([
      "Обзор",
      "Проверка клиентов",
      "Товары и услуги",
      "Жалобы",
      "Споры",
      "Поддержка",
      "Пользователи",
      "Заявки и сделки",
      "Переписки",
      "Настройки",
    ])
    for (const path of ["/admin/staff", "/admin/staff?tab=roles", "/admin/finance", "/admin/logs", "/admin/gateway-logs"]) {
      expect(canAccessAdminPath(MODERATOR, path), path).toBe(false)
    }
    expect(canAccessAdminPath(MODERATOR, "/admin/verification?tab=changes")).toBe(true)
  })

  it("opens a section on the first tab the person may see", () => {
    const companiesOnly = staff("moderator", ["admin_companies.view"])
    const users = ADMIN_HUBS.find((hub) => hub.id === "users")!
    expect(adminHubHref(companiesOnly, users)).toBe("/admin/companies")
    expect(allowedAdminTabs(companiesOnly, "users").map((tab) => tab.label)).toEqual([
      "Компании",
      "Знак надёжности",
    ])
    // Categories are part of the catalogue: somebody who moderates it gets that tab of the settings.
    const catalogOnly = staff("moderator", ["admin_catalog.view"])
    expect(adminHubHref(catalogOnly, ADMIN_HUBS.find((hub) => hub.id === "settings")!)).toBe("/admin/categories")
    expect(labels(adminMenuFor(catalogOnly))).toEqual(["Товары и услуги", "Настройки"])
  })

  it("lands a person on the first page that is theirs, or nowhere", () => {
    expect(getFirstAllowedAdminPath(staff("moderator", ["admin_disputes.view"]))).toBe("/admin/disputes")
    expect(getFirstAllowedAdminPath(staff("moderator", ["roles.manage"]))).toBe("/admin/staff?tab=roles")
    expect(getFirstAllowedAdminPath(staff("moderator", []))).toBeNull()
  })

  it("gives everybody their own account page", () => {
    expect(canAccessAdminPath(staff("moderator", []), "/admin/account")).toBe(true)
    expect(canAccessAdminPath(null, "/admin/account")).toBe(false)
  })
})

describe("handing access over to a new member of staff", () => {
  it("makes a password that survives being read aloud", () => {
    const password = generatePassword()
    expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{14}$/)
    expect(generatePassword()).not.toBe(password)
    // Every letter comes from the number it is given.
    expect(generatePassword(() => 0)).toBe("A".repeat(14))
  })

  it("writes the note to pass on", () => {
    const note = accessNote(
      { name: "Мадина", email: "madina@example.com", password: "Secret12345", role: "Модератор" },
      "https://brand.tj",
    )
    expect(note.split("\n")).toEqual([
      "Мадина, вам открыт доступ к панели управления Brand Market (Модератор).",
      "Вход: https://brand.tj/admin/login",
      "Email: madina@example.com",
      "Пароль: Secret12345",
      "После первого входа смените пароль: меню профиля → «Мой аккаунт».",
    ])
  })
})
