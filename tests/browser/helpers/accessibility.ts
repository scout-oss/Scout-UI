import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

export async function expectNoAxeViolations(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();

  if (results.violations.length > 0) {
    await testInfo.attach("axe-violations.json", {
      body: Buffer.from(JSON.stringify(results.violations, null, 2)),
      contentType: "application/json",
    });
  }

  expect(results.violations).toEqual([]);
}
