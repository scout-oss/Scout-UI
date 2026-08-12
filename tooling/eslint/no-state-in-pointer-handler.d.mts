import type { Rule } from "eslint";

/**
 * The rule itself is authored in plain JavaScript because ESLint flat configs
 * are JavaScript. These declarations let the rule's own tests typecheck under
 * the repository's strict settings.
 */
export declare const noStateInPointerHandler: Rule.RuleModule;

export declare const scoutUiPlugin: {
  meta: { name: string; version: string };
  rules: Record<string, Rule.RuleModule>;
};
