import { describe, expect, it } from "vitest"
import { PROFILE_TABS, isProfileTab, profileProgress, profileSteps } from "@/lib/profile-completeness"

describe("what makes a profile complete", () => {
  const empty = { hasPhoto: false, hasPhone: false, verified: false }

  it("lists only the steps that apply to the person", () => {
    // A buyer while the Telegram bot is off and the sign-in state is not known yet.
    expect(profileSteps(empty).map((step) => step.id)).toEqual(["photo", "phone", "verify"])
    // A private seller with everything on offer.
    expect(
      profileSteps({ ...empty, pageFilled: false, twoFactor: false, telegramLinked: false }).map((step) => step.id),
    ).toEqual(["photo", "phone", "page", "verify", "security", "telegram"])
  })

  it("opens the tab each step is done on", () => {
    const steps = profileSteps({ ...empty, pageFilled: false, twoFactor: false, telegramLinked: false })
    expect(Object.fromEntries(steps.map((step) => [step.id, step.tab]))).toEqual({
      photo: "main",
      phone: "main",
      page: "page",
      verify: "verify",
      security: "security",
      telegram: "telegram",
    })
    expect(steps.every((step) => isProfileTab(step.tab))).toBe(true)
    expect(PROFILE_TABS.map((tab) => tab.label)).toEqual([
      "Основное",
      "Моя страничка",
      "Проверка",
      "Безопасность",
      "Telegram",
    ])
  })

  it("counts what is done and offers the next two things", () => {
    const steps = profileSteps({ hasPhoto: true, hasPhone: false, verified: false, twoFactor: false })
    const progress = profileProgress(steps)
    expect(progress).toMatchObject({ done: 1, total: 4, percent: 25 })
    expect(progress.next.map((step) => step.label)).toEqual(["Указать телефон", "Пройти проверку"])
  })

  it("is complete when nothing is left", () => {
    const steps = profileSteps({
      hasPhoto: true,
      hasPhone: true,
      verified: true,
      twoFactor: true,
      pageFilled: true,
      telegramLinked: true,
    })
    expect(profileProgress(steps)).toMatchObject({ done: 6, total: 6, percent: 100, next: [] })
  })

  it("knows its tabs", () => {
    expect(isProfileTab("security")).toBe(true)
    expect(isProfileTab("billing")).toBe(false)
    expect(isProfileTab(null)).toBe(false)
  })
})
