import test from "node:test";
import assert from "node:assert/strict";
import { remarkCitations, escapeSearchText, verifiedCitationSource } from "../src/lib/chat-citations.js";

test("numbered citations become links only when present in the retrieved sources", () => {
  const tree = { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value: "Deadline [1], evidence [2], unsupported [9]." }] }] };
  remarkCitations({ citations: [1, 2] })(tree);
  const nodes = tree.children[0].children;
  assert.deepEqual(nodes.filter((node) => node.type === "link").map((node) => node.url), ["#dms-citation-1", "#dms-citation-2"]);
  assert.equal(nodes.at(-1).value, ", unsupported [9].");
});

test("code, existing Markdown links and references are never rewritten", () => {
  const tree = { type: "root", children: [
    { type: "code", value: "[1]" },
    { type: "paragraph", children: [
      { type: "inlineCode", value: "[1]" },
      { type: "link", url: "https://example.com", children: [{ type: "text", value: "[1]" }] },
      { type: "linkReference", identifier: "source", children: [{ type: "text", value: "[1]" }] },
    ] },
  ] };
  const original = structuredClone(tree);
  remarkCitations({ citations: [1] })(tree);
  assert.deepEqual(tree, original);
});

test("PDF highlight search handles regex punctuation and line wrapping literally", () => {
  const regex = new RegExp(escapeSearchText("Cost: $50.00 (net) [approved]"), "i");
  assert.equal(regex.test("Cost: $50.00\n(net) [approved]"), true);
  assert.equal(regex.test("Cost: $50000 (net) approved"), false);
});


test("inline citation highlights only an excerpt verified in that source", () => {
  const source = { content: "Overview of the agreement.\nRenewal is due on 30 November 2026.", quote: "Overview of the agreement.\nRenewal is due on 30 November 2026." };
  assert.equal(verifiedCitationSource(source, "Renewal is due on 30 November 2026.").quote, "Renewal is due on 30 November 2026.");
  assert.equal(verifiedCitationSource(source, "Renewal is due on 1 January 2027."), source);
  assert.equal(verifiedCitationSource(source, undefined), source);
});
