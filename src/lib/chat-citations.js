// Transform prose nodes only: code blocks, inline code and existing links keep
// their literal contents. Invalid citation numbers remain ordinary text.
export function remarkCitations({ citations = [] } = {}) {
  const allowed = new Set(citations);
  return (tree) => {
    function walk(node) {
      if (!node.children || ["link", "linkReference", "code", "inlineCode"].includes(node.type)) return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text") { walk(child); return [child]; }
        const pieces = [];
        let start = 0;
        for (const match of child.value.matchAll(/\[(\d+)\]/g)) {
          const citation = Number(match[1]);
          if (!allowed.has(citation)) continue;
          if (match.index > start) pieces.push({ type: "text", value: child.value.slice(start, match.index) });
          pieces.push({ type: "link", url: `#dms-citation-${citation}`, children: [{ type: "text", value: String(citation) }] });
          start = match.index + match[0].length;
        }
        if (!pieces.length) return [child];
        if (start < child.value.length) pieces.push({ type: "text", value: child.value.slice(start) });
        return pieces;
      });
    }
    walk(tree);
  };
}

export function escapeSearchText(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim().split(/\s+/).join("\\s+");
}

export function verifiedCitationSource(source, excerpt) {
  if (typeof excerpt !== "string" || !excerpt.trim() || excerpt.length > 1000 || !source.content) return source;
  const match = new RegExp(escapeSearchText(excerpt), "i").exec(source.content);
  // Only highlight a model-selected excerpt when the retrieved source actually
  // contains it. Otherwise preview the full cited passage, without guessing.
  return match ? { ...source, quote: match[0] } : source;
}
