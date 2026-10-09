// OCR coordinates are in raster pixels; the viewer uses percentages so boxes
// stay aligned when the page is resized, zoomed or rotated.
export function matchOcrWords(words, quote, width, height, pageIndex) {
  if (!(width > 0 && height > 0)) return [];
  const tokens = (text) => text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const wanted = tokens(quote);
  if (!wanted.length) return [];
  const indexed = words.flatMap((word, index) => tokens(word.text).map((text) => ({ text, index })));
  for (let start = 0; start <= indexed.length - wanted.length; start++) {
    if (!wanted.every((token, offset) => token === indexed[start + offset].text)) continue;
    const indices = [...new Set(indexed.slice(start, start + wanted.length).map(({ index }) => index))];
    return indices.flatMap((index) => {
      const box = words[index].bbox;
      if (!box || ![box.x0, box.y0, box.x1, box.y1].every(Number.isFinite)) return [];
      const x0 = Math.max(0, Math.min(width, box.x0));
      const y0 = Math.max(0, Math.min(height, box.y0));
      const x1 = Math.max(x0, Math.min(width, box.x1));
      const y1 = Math.max(y0, Math.min(height, box.y1));
      return x1 > x0 && y1 > y0 ? [{ pageIndex, left: x0 / width * 100, top: y0 / height * 100, width: (x1 - x0) / width * 100, height: (y1 - y0) / height * 100 }] : [];
    });
  }
  return [];
}

export function ocrWords(data) {
  return (data.blocks || []).flatMap((block) => (block.paragraphs || []).flatMap((paragraph) => (paragraph.lines || []).flatMap((line) => line.words || [])));
}

function abortable(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Passage search stopped", "AbortError"));
    if (signal.aborted) { promise.catch(() => {}); abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

// This runs only when native PDF text search misses. No document pixels leave
// the browser: the worker downloads its engine/language model, not the PDF.
export async function findScannedPassage(doc, quote, { signal, onProgress, initialPage = 1 }) {
  const { createWorker } = await import("tesseract.js");
  if (signal.aborted) return [];
  // Keep initialization's eventual worker observable even if Stop is pressed
  // while the engine is downloading, so it is terminated rather than leaked.
  const pendingWorker = createWorker("eng", 1, { errorHandler: () => {} });
  pendingWorker.then((worker) => { if (signal.aborted) void worker.terminate(); }, () => {});
  const worker = await abortable(pendingWorker, signal);
  let terminated = false;
  const abort = () => { if (!terminated) { terminated = true; void worker.terminate(); } };
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) return [];
    const start = Number.isInteger(initialPage) && initialPage >= 1 && initialPage <= doc.numPages ? initialPage : 1;
    const pageOrder = Array.from({ length: doc.numPages }, (_, index) => (start - 1 + index) % doc.numPages + 1);
    for (const number of pageOrder) {
      if (signal.aborted) return [];
      onProgress(number, doc.numPages);
      const page = await abortable(doc.getPage(number), signal);
      const base = page.getViewport({ scale: 1 });
      // Bound memory on unusually large PDF pages; process one raster at a time.
      const scale = Math.min(2, Math.sqrt(4_000_000 / (base.width * base.height)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      let render;
      const cancelRender = () => render?.cancel();
      signal.addEventListener("abort", cancelRender, { once: true });
      try {
        render = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        await abortable(render.promise, signal);
        if (signal.aborted) return [];
        const { data } = await abortable(worker.recognize(canvas, {}, { blocks: true }), signal);
        if (signal.aborted) return [];
        const boxes = matchOcrWords(ocrWords(data), quote, canvas.width, canvas.height, number - 1);
        if (boxes.length) return boxes;
      } finally {
        signal.removeEventListener("abort", cancelRender);
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    return [];
  } finally {
    signal.removeEventListener("abort", abort);
    if (!terminated) { terminated = true; await worker.terminate(); }
  }
}
