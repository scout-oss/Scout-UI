import { expect, type Page, type TestInfo } from "@playwright/test";

export function captureBrowserDiagnostics(page: Page): {
  expectClean: (testInfo: TestInfo) => Promise<void>;
} {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.stack ?? error.message}`);
  });

  return {
    async expectClean(testInfo) {
      if (errors.length > 0) {
        await testInfo.attach("browser-errors.txt", {
          body: Buffer.from(errors.join("\n\n")),
          contentType: "text/plain",
        });
      }

      expect(errors).toEqual([]);
    },
  };
}
