function textFromNode(node) {
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textFromNode).join("");
}

function slugBase(value) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "section";
}

function visitHeadings(node, callback) {
  if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
    callback(node);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) visitHeadings(child, callback);
  }
}

export function remarkStableHeadingIds() {
  return (tree, file) => {
    const counts = new Map();
    const toc = [];

    visitHeadings(tree, (heading) => {
      const label = textFromNode(heading).trim();
      const base = slugBase(label);
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${String(count + 1)}`;

      heading.data ??= {};
      heading.data.hProperties ??= {};
      heading.data.hProperties.id = id;
      toc.push({ id, label, level: heading.depth });
    });

    file.data.scoutUiToc = toc;
  };
}

function primitiveToEstree(value) {
  if (Array.isArray(value)) {
    return {
      type: "ArrayExpression",
      elements: value.map(primitiveToEstree),
    };
  }
  if (value !== null && typeof value === "object") {
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, item]) => ({
        type: "Property",
        key: { type: "Identifier", name: key },
        computed: false,
        method: false,
        shorthand: false,
        kind: "init",
        value: primitiveToEstree(item),
      })),
    };
  }
  return { type: "Literal", value };
}

export function recmaExportTableOfContents() {
  return (tree, file) => {
    const toc = file.data.scoutUiToc ?? [];
    tree.body.push({
      type: "ExportNamedDeclaration",
      declaration: {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "Identifier", name: "tableOfContents" },
            init: primitiveToEstree(toc),
          },
        ],
      },
      specifiers: [],
      source: null,
    });
  };
}
