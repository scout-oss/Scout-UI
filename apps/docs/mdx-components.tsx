import Link from "next/link";
import type { ComponentProps, ElementType } from "react";

import { CodeBlock } from "./components/code-block";

type MdxComponents = Record<string, ElementType>;

function MdxAnchor({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) return <Link href={href}>{props.children}</Link>;
  return <a href={href} {...props} />;
}

export function useMDXComponents(components: MdxComponents): MdxComponents {
  return {
    a: MdxAnchor,
    CodeBlock,
    ...components,
  };
}
