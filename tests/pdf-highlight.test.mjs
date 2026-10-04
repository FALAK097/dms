import test from "node:test";
import assert from "node:assert/strict";
import { matchOcrWords, ocrWords } from "../src/lib/pdf-highlight.js";

const words = ["Annual", "agreement", "Renewal:", "30", "November", "2026."].map((text, index) => ({
  text, bbox: { x0: index * 20, y0: 40, x1: index * 20 + 18, y1: 50 },
}));

test("OCR highlights only the complete cited phrase, using page-relative boxes", () => {
  const boxes = matchOcrWords(words, "renewal 30 November 2026", 200, 100, 2);
  assert.equal(boxes.length, 4);
  assert.deepEqual(boxes[0], { pageIndex: 2, left: 20, top: 40, width: 9, height: 10 });
  assert.equal(boxes.at(-1).left, 50);
});

test("OCR never highlights a partial or fabricated passage", () => {
  assert.deepEqual(matchOcrWords(words, "Renewal 30 December 2026", 200, 100, 0), []);
  assert.deepEqual(matchOcrWords(words, "", 200, 100, 0), []);
});

test("OCR coordinates reject invalid dimensions and clip to the rendered page", () => {
  assert.deepEqual(matchOcrWords(words, "Annual", 0, 100, 0), []);
  assert.deepEqual(matchOcrWords([{ text: "Annual", bbox: { x0: -10, y0: -5, x1: 210, y1: 110 } }], "Annual", 200, 100, 0), [{ pageIndex: 0, left: 0, top: 0, width: 100, height: 100 }]);
  assert.deepEqual(matchOcrWords([{ text: "Annual", bbox: { x0: NaN, y0: 0, x1: 10, y1: 10 } }], "Annual", 200, 100, 0), []);
});

test("Tesseract block output supplies word boxes across lines", () => {
  assert.deepEqual(ocrWords({ blocks: [{ paragraphs: [{ lines: [{ words: words.slice(0, 2) }, { words: words.slice(2) }] }] }] }), words);
  assert.deepEqual(ocrWords({ blocks: null }), []);
});
