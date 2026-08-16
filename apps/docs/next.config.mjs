import createMdx from "@next/mdx";

import {
  recmaExportTableOfContents,
  remarkStableHeadingIds,
} from "./tooling/mdx-plugins.mjs";

const withMdx = createMdx({
  options: {
    recmaPlugins: [recmaExportTableOfContents],
    remarkPlugins: [remarkStableHeadingIds],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
};

export default withMdx(nextConfig);
