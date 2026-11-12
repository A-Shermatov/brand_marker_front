import { describe, expect, it } from "vitest"
import { brandNames, outsideReferrer, reportIsDue, reportStamp } from "@/lib/activity/device-report"
import { createTracker, maskPath, pageQuery, type PageEvent } from "@/lib/activity/tracker"
import { describeDevice, getClientReportRows, getCountryLabel } from "@/lib/admin-log-labels"
import { randomId } from "@/lib/device"
import { describePage, formatStay } from "@/lib/page-labels"

const TOKEN = "Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4"

describe("what the site tells the journal about a page", () => {
  it("keeps object ids and hides one-time tokens in the path", () => {
    expect(maskPath("/customer/rfqs/12")).toBe("/customer/rfqs/12")
    expect(maskPath("/customer/rfqs/3f2b1c9e-8a4d-4f6b-9c1e-2d3a4b5c6d7e/edit")).toBe(
      "/customer/rfqs/3f2b1c9e-8a4d-4f6b-9c1e-2d3a4b5c6d7e/edit",
    )
    expect(maskPath(`/invite/${TOKEN}`)).toBe("/invite/***")
    expect(maskPath("/invite/short")).toBe("/invite/***")
    expect(maskPath(`/anything/${TOKEN}`)).toBe("/anything/***")
  })

  it("hides secrets among the search parameters", () => {
    expect(pageQuery("tab=offers&page=2")).toEqual({ tab: "offers", page: "2" })
    expect(pageQuery(`token=${TOKEN}`)).toEqual({ token: "***" })
    expect(pageQuery(`invite=${TOKEN}&role=buyer`)).toEqual({ invite: "***", role: "buyer" })
    expect(pageQuery("reset_token=abc")).toEqual({ reset_token: "***" })
    expect(pageQuery("")).toBeUndefined()
    expect(pageQuery(`q=${"я".repeat(500)}`)?.q).toHaveLength(200)
  })
})

const setup = () => {
  let clock = 0
  const batches: { events: PageEvent[]; final: boolean }[] = []
  let title = "Заявки"
  const tracker = createTracker({
    now: () => clock,
    send: (events, final) => batches.push({ events, final }),
    title: () => title,
    entryReferrer: () => "https://google.com/",
  })
  return {
    tracker,
    batches,
    tick: (ms: number) => {
      clock += ms
    },
    setTitle: (next: string) => {
      title = next
    },
  }
}

describe("which pages a person opens and for how long", () => {
  it("sends a page once, with its title and where the person came from", () => {
    const { tracker, batches, tick } = setup()
    tracker.page("/customer/rfqs", "tab=active")
    // The same page drawn again is not a new view.
    tracker.page("/customer/rfqs", "tab=active")
    tick(1500)
    tracker.flush()

    expect(batches).toHaveLength(1)
    expect(batches[0].final).toBe(false)
    expect(batches[0].events).toEqual([
      {
        type: "view",
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        path: "/customer/rfqs",
        query: { tab: "active" },
        referrer: "https://google.com/",
        title: "Заявки",
        ago_ms: 1500,
      },
    ])
    // Nothing new: nothing is sent.
    tracker.flush()
    expect(batches).toHaveLength(1)
  })

  it("closes the previous page with the time spent on it", () => {
    const { tracker, batches, tick, setTitle } = setup()
    tracker.page("/customer/rfqs")
    tick(1000)
    tracker.flush()
    const first = batches[0].events[0]

    tick(41_000)
    setTitle("Заявка № 12")
    tracker.page("/customer/rfqs/12")
    tracker.flush()

    const [leave, view] = batches[1].events
    expect(leave).toMatchObject({ type: "leave", id: first.id, seconds: 42, active_seconds: 42 })
    expect(view).toMatchObject({
      type: "view",
      path: "/customer/rfqs/12",
      referrer: "/customer/rfqs",
      title: "Заявка № 12",
    })
    // A title belongs to the page that is open now, never to the one just left.
    expect(leave.title).toBeUndefined()
  })

  it("counts only the time the tab was on screen as active", () => {
    const { tracker, batches, tick } = setup()
    tracker.page("/supplier")
    tick(10_000)
    tracker.visibility(true)
    // Going to the background sends what is known so far: the tab may never come back.
    expect(batches).toHaveLength(1)
    expect(batches[0].final).toBe(true)
    expect(batches[0].events.at(-1)).toMatchObject({ type: "leave", seconds: 10, active_seconds: 10 })

    tick(50_000)
    tracker.visibility(false)
    tick(5_000)
    tracker.close()

    expect(batches).toHaveLength(2)
    expect(batches[1].final).toBe(true)
    expect(batches[1].events).toEqual([
      expect.objectContaining({ type: "leave", seconds: 65, active_seconds: 15 }),
    ])
    // After closing there is nothing left to end.
    tracker.close()
    expect(batches).toHaveLength(2)
  })

  it("cuts a long queue into reports the journal accepts", () => {
    const { tracker, batches } = setup()
    for (let i = 0; i < 12; i += 1) tracker.page(`/services/${i}`)
    tracker.flush()
    // 12 views and the 11 pages left behind: 23 events, at most 10 in a report.
    expect(batches.map((batch) => batch.events.length)).toEqual([10, 10, 3])
  })

  it("never puts a one-time token into what it sends", () => {
    const { tracker, batches } = setup()
    tracker.page(`/invite/${TOKEN}`)
    tracker.page("/reset-password", `token=${TOKEN}`)
    tracker.flush()
    expect(JSON.stringify(batches)).not.toContain(TOKEN)
    expect(batches[0].events.map((event) => event.path).filter(Boolean)).toEqual([
      "/invite/***",
      "/reset-password",
    ])
    expect(batches[0].events.at(-1)?.referrer).toBe("/invite/***")
  })
})

describe("how a page is named in the journal", () => {
  it("uses the names of the menu", () => {
    expect(describePage("/customer/rfqs/12")).toEqual({
      area: "Кабинет покупателя",
      name: "Мои заявки",
      detail: "№ 12",
    })
    expect(describePage("/customer/rfqs/new")).toMatchObject({ name: "Мои заявки", detail: "создание" })
    expect(describePage("/customer/rfqs/12/proposals").detail).toBe("№ 12 · предложения")
    expect(describePage("/supplier")).toMatchObject({ area: "Кабинет поставщика", name: "Главная" })
    expect(describePage("/supplier/rfqs?response=open").name).toBe("Заявки покупателей")
    expect(describePage("/admin/logs")).toMatchObject({ area: "Админка", name: "Журнал действий" })
    expect(describePage("/customer/notifications").name).toBe("Уведомления")
  })

  it("names the public pages and survives an unknown one", () => {
    expect(describePage("/")).toEqual({ area: "Сайт", name: "Главная страница", detail: undefined })
    expect(describePage("/services/7")).toMatchObject({ name: "Каталог услуг", detail: "№ 7" })
    expect(describePage("/invite/***").name).toBe("Приглашение в компанию")
    expect(describePage("/something-new").name).toBe("/something-new")
  })

  it("says how long a page stayed open", () => {
    expect(formatStay(null)).toBe("—")
    expect(formatStay(0)).toBe("0 с")
    expect(formatStay(59)).toBe("59 с")
    expect(formatStay(125)).toBe("2 мин 5 с")
    expect(formatStay(3725)).toBe("1 ч 2 мин")
  })
})

describe("what a browser reports about itself", () => {
  it("names the browser without the placeholder brand", () => {
    expect(
      brandNames([
        { brand: "Not_A Brand", version: "8" },
        { brand: "Chromium", version: "142.0.7444.60" },
        { brand: "Microsoft Edge", version: "142.0.3595.53" },
      ]),
    ).toEqual(["Chromium 142", "Microsoft Edge 142"])
    expect(brandNames(undefined)).toEqual([])
  })

  it("keeps where the visitor came from, without the query", () => {
    expect(outsideReferrer("https://google.com/search?q=secret", "https://brand.tj")).toBe(
      "https://google.com/search",
    )
    expect(outsideReferrer("https://brand.tj/customer", "https://brand.tj")).toBeUndefined()
    expect(outsideReferrer("", "https://brand.tj")).toBeUndefined()
    expect(outsideReferrer("not a url", "https://brand.tj")).toBeUndefined()
  })

  it("reports again only when something changed or a week passed", () => {
    const report = { platform: "Windows", screen_width: 1920, screen_height: 1080 }
    const stamp = reportStamp(report, "Chrome/142")
    const now = Date.UTC(2026, 10, 11)
    expect(reportIsDue(null, stamp, now)).toBe(true)
    expect(reportIsDue({ stamp, at: now - 60_000 }, stamp, now)).toBe(false)
    expect(reportIsDue({ stamp, at: now - 8 * 24 * 3600 * 1000 }, stamp, now)).toBe(true)
    // A browser update or another screen is news.
    expect(reportStamp(report, "Chrome/143")).not.toBe(stamp)
    expect(reportStamp({ ...report, screen_width: 2560 }, "Chrome/142")).not.toBe(stamp)
  })

  it("makes ids the API accepts, also without crypto.randomUUID", () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    expect(randomId()).toMatch(uuid)
    const original = crypto.randomUUID
    // A page opened over plain http has no randomUUID.
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true })
    try {
      expect(randomId()).toMatch(uuid)
      expect(randomId()).not.toBe(randomId())
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true })
    }
  })
})

describe("how a device is shown to an administrator", () => {
  it("joins the system and the browser", () => {
    expect(describeDevice({ os: "Windows 11", browser: "Chrome 142" })).toBe("Windows 11 · Chrome 142")
    expect(describeDevice({ os: null, browser: "curl 8.5" })).toBe("curl 8.5")
    expect(describeDevice({ os: null, browser: null })).toBe("Устройство не определено")
  })

  it("names countries, and the Tor network", () => {
    expect(getCountryLabel("TJ")).toBe("Таджикистан")
    expect(getCountryLabel("T1")).toBe("Сеть Tor")
    expect(getCountryLabel(null)).toBeNull()
  })

  it("lays out the browser's report in a fixed order, in plain words", () => {
    const rows = getClientReportRows({
      gpu: "ANGLE (NVIDIA RTX 3060)",
      screen_width: 1920,
      screen_height: 1080,
      webdriver: false,
      languages: ["ru-RU", "en"],
      platform: "Windows",
      brands: [],
      something_new: "ignored",
    })
    expect(rows).toEqual([
      { label: "Система", value: "Windows" },
      { label: "Языки", value: "ru-RU, en" },
      { label: "Экран", value: "1920 × 1080" },
      { label: "Видеокарта", value: "ANGLE (NVIDIA RTX 3060)" },
      { label: "Управляется программой", value: "Нет" },
    ])
  })
})
