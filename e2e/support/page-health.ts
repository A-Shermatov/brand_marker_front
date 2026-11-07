import { expect, type Page } from "@playwright/test"
import { API_URL } from "./accounts"

/**
 * Collects what a visitor would hit as a broken page: uncaught script errors
 * and API answers with a server error. Start it before navigating.
 */
export function watchPageHealth(page: Page) {
  const problems: string[] = []
  page.on("pageerror", (error) => problems.push(`script error: ${error.message}`))
  page.on("response", (response) => {
    if (response.url().startsWith(API_URL) && response.status() >= 500) {
      problems.push(`API ${response.status()}: ${response.request().method()} ${response.url().slice(API_URL.length)}`)
    }
  })
  return {
    /** Problems seen since the last call, which also resets the list. */
    take: () => problems.splice(0),
  }
}

/** Opens a page and checks it rendered: a heading, no crash screen, no script or server errors. */
export async function expectPageOpens(page: Page, path: string, health: ReturnType<typeof watchPageHealth>) {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
  await expect(page.getByText("Application error", { exact: false }), `${path}: crash screen`).toHaveCount(0)
  await expect(page.getByRole("heading").first(), `${path}: no heading`).toBeVisible()
  expect(health.take(), `${path}: errors while loading`).toEqual([])
}
