import { describe, expect, it } from "vitest"
import {
  calendarDaysBetween,
  deadlineMoment,
  isDeadlinePassed,
  isValidIsoDateTime,
  joinDateTime,
  maskTimeInput,
  splitDateTime,
  startMoment,
} from "@/lib/iso-date"
import { formatDateSpan, formatIsoDate, formatTimeLeft } from "@/lib/format"
import { validateRfqForm, type RfqFormValues } from "@/lib/schemas/rfq-form"
import { readRfqNeed } from "@/lib/rfq-positions"

describe("a request date with a time of day", () => {
  it("splits and joins a day and a time", () => {
    expect(splitDateTime("2026-11-20T18:30")).toEqual({ date: "2026-11-20", time: "18:30" })
    expect(splitDateTime("2026-11-20")).toEqual({ date: "2026-11-20", time: "" })
    expect(splitDateTime("2026-11-20 18:30:00")).toEqual({ date: "2026-11-20", time: "18:30" })
    expect(splitDateTime("")).toEqual({ date: "", time: "" })
    expect(joinDateTime("2026-11-20", "18:30")).toBe("2026-11-20T18:30")
    expect(joinDateTime("2026-11-20", "")).toBe("2026-11-20")
    expect(joinDateTime("", "18:30")).toBe("")
  })

  it("accepts a day alone or a day with hours and minutes", () => {
    expect(isValidIsoDateTime("2026-11-20")).toBe(true)
    expect(isValidIsoDateTime("2026-11-20T00:00")).toBe(true)
    expect(isValidIsoDateTime("2026-11-20T23:59")).toBe(true)
    expect(isValidIsoDateTime("2026-11-20T24:00")).toBe(false)
    expect(isValidIsoDateTime("2026-11-20T18:60")).toBe(false)
    expect(isValidIsoDateTime("2026-02-30T10:00")).toBe(false)
    expect(isValidIsoDateTime("2026-11-20 18:30")).toBe(false)
    expect(isValidIsoDateTime("2026-11-20T18:30:00")).toBe(false)
    expect(isValidIsoDateTime("20.11.2026")).toBe(false)
  })

  it("shapes a typed time as чч:мм", () => {
    expect(maskTimeInput("1")).toBe("1")
    expect(maskTimeInput("183")).toBe("18:3")
    expect(maskTimeInput("1830")).toBe("18:30")
    expect(maskTimeInput("18:30:59")).toBe("18:30")
    expect(maskTimeInput("ab")).toBe("")
  })

  it("runs out at the given minute, or at the end of the day", () => {
    expect(deadlineMoment("2026-11-20T18:30")).toEqual(new Date(2026, 10, 20, 18, 30))
    expect(deadlineMoment("2026-11-20")).toEqual(new Date(2026, 10, 20, 23, 59, 59, 999))
    expect(deadlineMoment("скоро")).toBeNull()
    expect(startMoment("2026-11-20")).toEqual(new Date(2026, 10, 20, 0, 0))

    expect(isDeadlinePassed("2026-11-20T18:30", new Date(2026, 10, 20, 18, 29))).toBe(false)
    expect(isDeadlinePassed("2026-11-20T18:30", new Date(2026, 10, 20, 18, 31))).toBe(true)
    expect(isDeadlinePassed("2026-11-20", new Date(2026, 10, 20, 22, 0))).toBe(false)
    expect(isDeadlinePassed("2026-11-20", new Date(2026, 10, 21, 0, 1))).toBe(true)
  })

  it("is shown with its time, and without one when none was set", () => {
    expect(formatIsoDate("2026-11-20")).toMatch(/^20 нояб\. 2026/)
    expect(formatIsoDate("2026-11-20")).not.toContain(":")
    expect(formatIsoDate("2026-11-20T18:30")).toMatch(/^20 нояб\. 2026.*, 18:30$/)
    // A timestamp from the database stays a plain day.
    expect(formatIsoDate("2026-11-20T08:15:42.123456+00:00")).not.toContain("08:15")
  })

  it("says how much time is left", () => {
    const now = new Date(2026, 10, 11, 12, 0)
    expect(formatTimeLeft("2026-11-20T18:30", now)).toBe("осталось 9 дней")
    expect(formatTimeLeft("2026-11-11T18:30", now)).toBe("сегодня до 18:30")
    expect(formatTimeLeft("2026-11-11", now)).toBe("сегодня последний день")
    expect(formatTimeLeft("2026-11-11T09:00", now)).toBe("срок истёк")
    expect(formatTimeLeft("", now)).toBe("")
  })

  it("counts the days of the work", () => {
    expect(calendarDaysBetween("2026-11-25", "2026-12-16T09:00")).toBe(21)
    expect(calendarDaysBetween("2026-12-16", "2026-11-25")).toBeNull()
    expect(formatDateSpan("2026-11-25", "2026-12-16T09:00")).toBe("21 день")
    expect(formatDateSpan("2026-11-25T09:00", "2026-11-25T18:00")).toBe("в тот же день")
    expect(formatDateSpan("", "2026-11-25")).toBe("")
  })
})

describe("the request form", () => {
  const now = new Date(2026, 10, 11, 12, 0)
  const product: RfqFormValues = {
    type: "product",
    title: "ПК",
    category_id: "it",
    description: "Ноутбук — 25 шт",
    budget_type: "open",
    budget_from: "",
    budget_to: "",
    currency: "TJS",
    deadline: "2026-11-20T18:30",
    visibility: "public",
    quantity: "25",
    delivery_country: "Таджикистан",
    delivery_city: "Душанбе",
    delivery_address: "Душанбе, ул. Айни 48",
    delivery_date: "2026-12-21",
  }
  const service: RfqFormValues = {
    type: "service",
    title: "Сайт",
    category_id: "it",
    description: "Нужен сайт-каталог на 30 товаров.",
    budget_type: "open",
    budget_from: "",
    budget_to: "",
    currency: "TJS",
    deadline: "2026-11-20",
    visibility: "public",
    project_duration: "21 день",
    start_date: "2026-11-25",
    delivery_date: "2026-12-16T09:00",
    team_size_required: "",
    experience_required: "",
  }

  it("takes a title of any length", () => {
    expect(validateRfqForm(product, now)).toEqual({})
    expect(validateRfqForm({ ...product, title: "Я" }, now)).toEqual({})
    expect(validateRfqForm({ ...product, title: "Ноутбуки ".repeat(40) }, now)).toEqual({})
    expect(validateRfqForm(service, now)).toEqual({})
  })

  it("still asks for a title", () => {
    expect(validateRfqForm({ ...product, title: "" }, now).title).toBeTruthy()
    expect(validateRfqForm({ ...product, title: "   " }, now).title).toBeTruthy()
  })

  it("asks for both deadlines", () => {
    expect(validateRfqForm({ ...product, deadline: "" }, now).deadline).toContain("дедлайн заявки")
    expect(validateRfqForm({ ...product, delivery_date: "" }, now).delivery_date).toContain("дедлайн поставки")
    expect(validateRfqForm({ ...service, delivery_date: "" }, now).delivery_date).toContain("дедлайн работы")
    expect(validateRfqForm({ ...product, deadline: "2026-11-20T25:00" }, now).deadline).toBeTruthy()
  })

  it("does not take a deadline that has already passed", () => {
    expect(validateRfqForm({ ...product, deadline: "2026-11-11T11:00" }, now).deadline).toContain("уже прошёл")
    // Today without a time lasts to the end of the day.
    expect(validateRfqForm({ ...product, deadline: "2026-11-11" }, now).deadline).toBeUndefined()
  })

  it("keeps the dates in order", () => {
    expect(validateRfqForm({ ...product, delivery_date: "2026-11-19" }, now).delivery_date).toContain(
      "раньше дедлайна заявки",
    )
    expect(
      validateRfqForm({ ...service, start_date: "2026-12-20", delivery_date: "2026-12-16" }, now).delivery_date,
    ).toContain("раньше начала работы")
    // The work may start and end on the same day.
    expect(
      validateRfqForm({ ...service, start_date: "2026-12-16", delivery_date: "2026-12-16T18:00" }, now).delivery_date,
    ).toBeUndefined()
  })
})

describe("what a request asks for", () => {
  it("reads the positions of the goods form", () => {
    const need = readRfqNeed({
      type: "product",
      title: "ПК",
      quantity: 26,
      description: "Ноутбук 15″, Core i5 — 25 шт\nМышь — 1 шт\n\nГарантия не меньше года.",
    })
    expect(need.positions).toEqual([
      { name: "Ноутбук 15″, Core i5", amount: "25 шт" },
      { name: "Мышь", amount: "1 шт" },
    ])
    expect(need.text).toBe("Гарантия не меньше года.")
  })

  it("falls back to the title for goods described in free words", () => {
    const need = readRfqNeed({
      type: "product",
      title: "Закупка рабочих ноутбуков",
      quantity: 2,
      description: "Просим предложить цену и срок.",
    })
    expect(need.positions).toEqual([{ name: "Закупка рабочих ноутбуков", amount: "2 шт" }])
    expect(need.text).toBe("Просим предложить цену и срок.")
  })

  it("gives a service its description and no positions", () => {
    const need = readRfqNeed({ type: "service", title: "Сайт", description: " Нужен сайт. " })
    expect(need).toEqual({ positions: [], text: "Нужен сайт." })
  })
})
