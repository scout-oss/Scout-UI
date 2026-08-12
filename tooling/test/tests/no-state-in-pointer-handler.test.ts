import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noStateInPointerHandler } from "../../eslint/no-state-in-pointer-handler.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    parserOptions: { ecmaFeatures: { jsx: true } },
    sourceType: "module",
  },
});

describe("scout-ui/no-state-in-pointer-handler", () => {
  it("permits refs and frame scheduling but rejects state setters", () => {
    ruleTester.run("no-state-in-pointer-handler", noStateInPointerHandler, {
      invalid: [
        {
          code: `function onPointerMove(event) { setPosition(event.clientX); }`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
        {
          code: `const handlePointerMove = () => { setActive(true); };`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
        {
          code: `element.addEventListener("pointermove", (event) => { setSample(event); });`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
        {
          code: `const node = <div onPointerMove={() => { setHovered(true); }} />;`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
        {
          code: `element.addEventListener("wheel", () => { setZoom(2); });`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
        {
          // Nested closures inherit the handler context.
          code: `function onPointerMove() { requestAnimationFrame(() => { setFrame(1); }); }`,
          errors: [{ messageId: "stateInPointerHandler" }],
        },
      ],
      valid: [
        // The sanctioned pattern: capture into a ref, schedule one frame.
        `function onPointerMove(event) { sampleRef.current = event.clientX; schedule(); }`,
        // Low-frequency semantic handlers may still use state.
        `function onPointerUp() { setOpen(true); }`,
        `const node = <button onClick={() => { setOpen(true); }} />;`,
        `element.addEventListener("pointerdown", () => { setPressed(true); });`,
        // A non-setter call inside a high-frequency handler is fine.
        `function onPointerMove() { settleEngine(); }`,
        // Leaving the handler scope clears the context.
        `function onPointerMove() {} function onSubmit() { setSaved(true); }`,
      ],
    });
  });
});
