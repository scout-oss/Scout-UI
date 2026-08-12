/**
 * Scout UI's central performance invariant is that pointer-frequency work never
 * enters React rendering. This rule makes that reviewable automatically rather
 * than by convention: a `useState` setter called inside a high-frequency
 * pointer handler is an error.
 *
 * Required by SCOUT_UI_ENGINEERING_SPEC.md section 31.
 */

/** Events that can fire many times per frame. */
const HIGH_FREQUENCY_EVENTS = new Set([
  "pointermove",
  "pointerrawupdate",
  "mousemove",
  "touchmove",
  "drag",
  "dragover",
  "scroll",
  "wheel",
]);

const HIGH_FREQUENCY_PROPS = new Set([
  "onPointerMove",
  "onPointerMoveCapture",
  "onMouseMove",
  "onMouseMoveCapture",
  "onTouchMove",
  "onTouchMoveCapture",
  "onDrag",
  "onDragOver",
  "onScroll",
  "onWheel",
]);

const HIGH_FREQUENCY_FUNCTION_NAMES =
  /^(?:on|handle)(?:Pointer|Mouse|Touch)(?:Move|RawUpdate)|^(?:on|handle)(?:Drag|Scroll|Wheel)/u;

/** Matches the conventional `setThing` shape of a useState setter. */
const SETTER_NAME = /^set[A-Z]/u;

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

function literalValue(node) {
  return node?.type === "Literal" && typeof node.value === "string"
    ? node.value.toLowerCase()
    : undefined;
}

export const noStateInPointerHandler = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow React state setters inside high-frequency pointer handlers.",
    },
    schema: [],
    messages: {
      stateInPointerHandler:
        "`{{name}}` is a React state setter inside the high-frequency handler `{{handler}}`. Pointer-frequency work must use refs, an imperative engine, and one scheduled animation frame instead.",
    },
  },
  create(context) {
    /** Stack of function nodes with the high-frequency handler name, if any. */
    const stack = [];

    function handlerNameFor(node) {
      const parent = node.parent;

      // addEventListener("pointermove", handler)
      if (
        parent?.type === "CallExpression" &&
        parent.callee.type === "MemberExpression" &&
        parent.callee.property.type === "Identifier" &&
        parent.callee.property.name === "addEventListener" &&
        HIGH_FREQUENCY_EVENTS.has(literalValue(parent.arguments[0]))
      ) {
        return literalValue(parent.arguments[0]);
      }

      // onPointerMove={handler}
      if (
        parent?.type === "JSXExpressionContainer" &&
        parent.parent?.type === "JSXAttribute" &&
        parent.parent.name.type === "JSXIdentifier" &&
        HIGH_FREQUENCY_PROPS.has(parent.parent.name.name)
      ) {
        return parent.parent.name.name;
      }

      // function onPointerMove() {} / const handlePointerMove = () => {}
      const declaredName =
        node.id?.name ??
        (parent?.type === "VariableDeclarator" &&
        parent.id.type === "Identifier"
          ? parent.id.name
          : undefined) ??
        (parent?.type === "Property" && parent.key.type === "Identifier"
          ? parent.key.name
          : undefined);

      return declaredName !== undefined &&
        HIGH_FREQUENCY_FUNCTION_NAMES.test(declaredName)
        ? declaredName
        : undefined;
    }

    function enter(node) {
      stack.push(handlerNameFor(node) ?? stack.at(-1));
    }

    function exit() {
      stack.pop();
    }

    const listeners = {
      CallExpression(node) {
        const handler = stack.at(-1);
        if (
          handler === undefined ||
          node.callee.type !== "Identifier" ||
          !SETTER_NAME.test(node.callee.name)
        ) {
          return;
        }

        context.report({
          data: { handler, name: node.callee.name },
          messageId: "stateInPointerHandler",
          node,
        });
      },
    };

    for (const type of FUNCTION_TYPES) {
      listeners[type] = enter;
      listeners[`${type}:exit`] = exit;
    }

    return listeners;
  },
};

export const scoutUiPlugin = {
  meta: { name: "scout-ui", version: "0.0.0" },
  rules: { "no-state-in-pointer-handler": noStateInPointerHandler },
};
