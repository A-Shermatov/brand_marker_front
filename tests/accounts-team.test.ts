import { describe, expect, it } from "vitest"
import { afterRegisterPath, formatRate, parseSkills } from "@/lib/account-type"
import {
  ASSIGNABLE_COMPANY_ROLES,
  COMPANY_ROLE_ACCESS,
  canManageTeam,
  companyRoleLabel,
  formatInviteDeadline,
  invitationStatusLabel,
  isViewerRole,
  sideRoleLabel,
} from "@/lib/company-team"
import { contactPersonLabel } from "@/components/company/contact-person"
import { profileKindLabel } from "@/components/company/profile-switch-menu"
import { formatReviewAuthor } from "@/lib/review-party"
import { pickActorForRole } from "@/lib/store/auth-store"
import type { ActorSummary } from "@/lib/api/auth"
import { COMPANY_ROLES, type Review } from "@/types"

const actor = (id: number, kind: ActorSummary["kind"], side: ActorSummary["side"], role: string | null = null): ActorSummary => ({
  id,
  kind,
  side,
  display_name: kind === "company" ? "ООО Сомон" : "Алишер Рахимов",
  trust_level: "basic",
  company_id: kind === "company" ? 7 : null,
  verification_status: null,
  company_role: role,
})

describe("where a person lands after registering", () => {
  it("sends a private supplier to their page and everyone else to the cabinet home", () => {
    expect(afterRegisterPath({ role: "supplier", accountType: "individual", invited: false })).toBe(
      "/supplier/profile?welcome=1",
    )
    expect(afterRegisterPath({ role: "supplier", accountType: "company", invited: false })).toBe("/supplier")
    expect(afterRegisterPath({ role: "customer", accountType: "individual", invited: false })).toBe("/customer")
    // An invited employee works for the company: no personal page to fill in first.
    expect(afterRegisterPath({ role: "supplier", accountType: "individual", invited: true })).toBe("/supplier")
  })
})

describe("the profile the cabinet opens in", () => {
  const personal = actor(1, "individual", "supplier")
  const company = actor(2, "company", "supplier", "moderator")
  const buying = actor(3, "company", "buyer", "moderator")

  it("opens in the company for a person who works for one", () => {
    expect(pickActorForRole([personal, company], "supplier", null, true)?.id).toBe(2)
  })

  it("opens in the personal profile for a private person, even with a company", () => {
    expect(pickActorForRole([personal, company], "supplier", null, false)?.id).toBe(1)
  })

  it("keeps the profile the person chose, and never crosses to the other side", () => {
    expect(pickActorForRole([personal, company], "supplier", 1, true)?.id).toBe(1)
    expect(pickActorForRole([personal, company, buying], "supplier", 3, false)?.id).toBe(1)
    expect(pickActorForRole([company], "customer", null, true)).toBeUndefined()
  })

  it("falls back to whatever profile is left on that side", () => {
    expect(pickActorForRole([personal], "supplier", null, true)?.id).toBe(1)
    expect(pickActorForRole([company], "supplier", null, false)?.id).toBe(2)
  })
})

describe("access levels", () => {
  it("has a viewer who can be assigned and manages nothing", () => {
    expect(COMPANY_ROLES).toContain("viewer")
    expect(ASSIGNABLE_COMPANY_ROLES).toEqual(["admin", "moderator", "accountant", "viewer"])
    expect(companyRoleLabel("viewer")).toBe("Наблюдатель")
    expect(isViewerRole("viewer")).toBe(true)
    expect(isViewerRole("moderator")).toBe(false)
    expect(canManageTeam("viewer")).toBe(false)
    expect(canManageTeam("director")).toBe(true)
  })

  it("says in words what every level may and may not do", () => {
    for (const role of COMPANY_ROLES) {
      expect(COMPANY_ROLE_ACCESS[role].can.length).toBeGreaterThan(10)
    }
    expect(COMPANY_ROLE_ACCESS.director.cannot).toBeNull()
    expect(COMPANY_ROLE_ACCESS.viewer.cannot).toMatch(/только просмотр/)
  })

  it("names a side role, a closed side and the company role that applies", () => {
    expect(sideRoleLabel("viewer", "moderator")).toBe("Наблюдатель")
    expect(sideRoleLabel("none", "moderator")).toBe("Нет доступа")
    expect(sideRoleLabel(null, "moderator")).toBe("Менеджер")
  })
})

describe("invitations", () => {
  it("names every state the director can see", () => {
    expect(invitationStatusLabel("pending")).toBe("Приглашён, ждём ответа")
    expect(invitationStatusLabel("expired")).toBe("Срок приглашения истёк")
    expect(invitationStatusLabel("declined")).toBe("Отказался")
    expect(invitationStatusLabel("something-new")).toBe("something-new")
  })

  it("shows the last day in words and survives a broken date", () => {
    expect(formatInviteDeadline("2026-11-25T10:00:00Z")).toBe("до 25 ноября")
    expect(formatInviteDeadline("not a date")).toBe("")
  })
})

describe("who the other side sees", () => {
  it("names the contact person with their role, or without it once they left", () => {
    expect(contactPersonLabel("Алишер Рахимов", "moderator")).toBe("Алишер Рахимов, менеджер")
    expect(contactPersonLabel("Алишер Рахимов", null)).toBe("Алишер Рахимов")
    expect(contactPersonLabel("  ", "director")).toBe("")
    expect(contactPersonLabel(null, null)).toBe("")
  })

  it("tells a personal profile from a company one in the switcher", () => {
    expect(profileKindLabel(actor(1, "individual", "buyer"))).toBe("Личный профиль")
    expect(profileKindLabel(actor(2, "company", "buyer", "viewer"))).toBe("Компания · наблюдатель")
    expect(profileKindLabel(actor(2, "company", "buyer"))).toBe("Компания")
  })

  it("signs a review with the employee, and drops the role when they have left the company", () => {
    const review = {
      reviewer: { actor_id: 2, kind: "company", display_name: "ООО Сомон", company_title: "ООО Сомон", user_name: null },
      author: { user_id: 5, name: "Алишер Рахимов", role: "moderator", company_title: "ООО Сомон" },
    } as unknown as Review
    expect(formatReviewAuthor(review, "Покупатель")).toEqual({
      primary: "Алишер Рахимов",
      secondary: "Менеджер, ООО Сомон",
    })
    const afterLeaving = { ...review, author: { ...review.author!, role: null } } as Review
    expect(formatReviewAuthor(afterLeaving, "Покупатель")).toEqual({
      primary: "Алишер Рахимов",
      secondary: "ООО Сомон",
    })
  })
})

describe("a private person's page", () => {
  it("formats the rate per hour and per project, and hides an empty one", () => {
    expect(formatRate(180, "TJS", "hour")).toBe("180 TJS / час")
    expect(formatRate(2000, "USD", "project")).toMatch(/^от 2\s000 USD за проект$/)
    expect(formatRate(null, "TJS", "hour")).toBeNull()
    expect(formatRate(0, "TJS", "hour")).toBeNull()
  })

  it("turns typed skills into a clean list without repeats", () => {
    expect(parseSkills("Python,  FastAPI ; python\nTelegram-боты,, ")).toEqual([
      "Python",
      "FastAPI",
      "Telegram-боты",
    ])
    expect(parseSkills("a,b,c", 2)).toEqual(["a", "b"])
    expect(parseSkills("")).toEqual([])
  })
})
