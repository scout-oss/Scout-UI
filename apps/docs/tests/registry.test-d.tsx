import type { DocsPackageName, RegistryDefinition } from "../lib/registry";
import { createRegistry } from "../lib/registry";

const packageName: DocsPackageName = "@scout-ui/react";
void packageName;

// @ts-expect-error package names remain limited to publishable Scout UI packages.
const invalidPackageName: DocsPackageName = "@scout-ui/stickers";
void invalidPackageName;

const registry = createRegistry([
  {
    slug: "typed-fixture",
    name: "Typed fixture",
    packageName: "@scout-ui/react",
    status: "alpha",
    fixtureOnly: true,
  },
] as const);

const inferred: true | undefined = registry.get("typed-fixture")?.fixtureOnly;
void inferred;

const validDefinition: RegistryDefinition = {
  slug: "valid",
  name: "Valid",
  packageName: "@scout-ui/sticker-trail",
  status: "beta",
};
void validDefinition;

const invalidStatus: RegistryDefinition = {
  slug: "invalid",
  name: "Invalid",
  packageName: "@scout-ui/react",
  // @ts-expect-error registry status is a closed alpha/beta/stable union.
  status: "experimental",
};
void invalidStatus;
