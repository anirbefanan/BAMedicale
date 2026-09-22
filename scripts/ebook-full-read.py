"""Deterministic PDF layout extraction; never rewrite source text or source bytes.

Text is reflowed only when its glyphs and reading order are supported. Tables,
figures and uncertain layouts retain exact crops of the existing source render.
"""
import collections
import hashlib
import json
import re
import sys
from pathlib import Path

import pdfplumber
from PIL import Image


def build(source, output):
    source, output = Path(source), Path(output)
    manifest = json.loads((output / "pages.json").read_text(encoding="utf-8"))
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if manifest.get("sourceSha256", digest) != digest:
        raise ValueError("Source integrity mismatch")
    records = []
    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) != len(manifest["pages"]):
            raise ValueError("Source page count mismatch")
        for index, page in enumerate(pdf.pages):
            rendered = Image.open(output / f"page-{index + 1}.png")
            segments = []
            def crop(box, kind="figure", text=""):
                x0, top, x1, bottom = box
                region = (max(0, x0 - 2), max(0, top - 2), min(page.width, x1 + 2), min(page.height, bottom + 2))
                name = f"reading-{index + 1}-{len(segments) + 1}.png"
                image = rendered.crop(tuple(round(v * (rendered.width / page.width if i % 2 == 0 else rendered.height / page.height)) for i, v in enumerate(region)))
                image.save(output / name)
                segments.append({"type": kind, "image": name, "sha256": hashlib.sha256((output / name).read_bytes()).hexdigest(), "width": image.width, "height": image.height, "text": text, "top": top, "bbox": list(box)})

            tables = [t for t in page.find_tables() if len(t.rows) > 1 and max(len(r.cells) for r in t.rows) > 1]
            regions = [t.bbox for t in tables] + [(im["x0"], im["top"], im["x1"], im["bottom"]) for im in page.images]
            for table in tables:
                crop(table.bbox, "table-image")
                cells = table.extract()
                chars = page.crop(table.bbox).chars
                if cells and all(len(row) == len(cells[0]) and all(c is not None for c in row) for row in cells) and not any("Symbol" in c["fontname"] or "(cid:" in c["text"] or "\ufffd" in c["text"] for c in chars):
                    segments[-1]["rows"] = cells
            for im in page.images:
                box = (im["x0"], im["top"], im["x1"], im["bottom"])
                if not any(t.bbox[0] <= box[0] and t.bbox[1] <= box[1] and t.bbox[2] >= box[2] and t.bbox[3] >= box[3] for t in tables):
                    crop(box)
            def inside(word):
                x, y = (word["x0"] + word["x1"]) / 2, (word["top"] + word["bottom"]) / 2
                return any(a <= x <= c and b <= y <= d for a, b, c, d in regions)
            words = page.extract_words(extra_attrs=["fontname", "size"], keep_blank_chars=False)
            body_size = collections.Counter(round(c["size"], 1) for c in page.chars).most_common(1)[0][0] if page.chars else 10
            lines = []
            for word in sorted((w for w in words if not inside(w)), key=lambda w: (round(w["top"] / 3), w["x0"])):
                if not lines or abs(lines[-1][0]["top"] - word["top"]) > 3:
                    lines.append([])
                lines[-1].append(word)
            for line in lines:
                line.sort(key=lambda w: w["x0"])
                text = "".join((" " if n and w["x0"] - line[n-1]["x1"] > w["size"] * .12 else "") + w["text"] for n, w in enumerate(line))
                # Resolve only a bullet actually evidenced by the canonical extraction.
                if text.startswith("(cid:127) ") and "• " + text[10:] in " ".join(manifest["pages"][index]["text"].split()):
                    text = "• " + text[10:]
                box = (min(w["x0"] for w in line), min(w["top"] for w in line), max(w["x1"] for w in line), max(w["bottom"] for w in line))
                size = max(w["size"] for w in line)
                furniture = box[1] < page.height * .055 or box[3] > page.height * .955
                uncertain = "(cid:" in text or "\ufffd" in text or any("Symbol" in w["fontname"] for w in line)
                # Preserve vector diagrams / multi-column text visually, not in a guessed order.
                wide_gap = any(b["x0"] - a["x1"] > 55 for a, b in zip(line, line[1:]))
                if uncertain or (wide_gap and not furniture):
                    crop(box, "source-fragment", "")
                    continue
                kind = "furniture" if furniture else "heading" if size >= body_size * 1.3 else "paragraph"
                if kind == "paragraph" and re.match(r"^(?:[•●]|\d+[.)])\s", text):
                    kind = "list-item"
                elif kind == "paragraph" and len(text) < 180 and all("bold" in w["fontname"].lower() for w in line):
                    kind = "subheading"
                segments.append({"type": kind, "text": text, "size": round(size, 2), "top": box[1], "bbox": list(box)})
            segments.sort(key=lambda s: (s["top"], s["bbox"][0]))
            merged = []
            for s in segments:
                prev = merged[-1] if merged else None
                if prev and (s["type"] == prev["type"] and s["type"] in ("paragraph", "heading") or s["type"] == "paragraph" and prev["type"] == "list-item") and s["size"] == prev["size"] and 0 <= s["bbox"][1] - prev["bbox"][3] < s["size"] * .7:
                    prev["text"] += " " + s["text"]
                    prev["bbox"][0] = min(prev["bbox"][0], s["bbox"][0])
                    prev["bbox"][2] = max(prev["bbox"][2], s["bbox"][2])
                    prev["bbox"][3] = s["bbox"][3]
                else:
                    merged.append(s)
            for n in range(len(merged) - 1, 0, -1):
                caption, figure = merged[n], merged[n - 1]
                if caption["type"] == "paragraph" and figure["type"] == "figure" and re.match(r"^Fig(?:ure)?\.?\s*\d", caption["text"], re.I):
                    figure["caption"] = caption["text"]
                    figure["bbox"] = [min(figure["bbox"][0], caption["bbox"][0]), figure["bbox"][1], max(figure["bbox"][2], caption["bbox"][2]), caption["bbox"][3]]
                    merged.pop(n)
            # A scanned or vector-only page remains complete and readable via source rendering.
            if not words or page.curves:
                segments.clear()
                crop((0, 0, page.width, page.height), "source-fragment")
                merged = segments
            uncovered = [c for c in page.chars if c["text"].strip() and not any(s["bbox"][0] - 1 <= (c["x0"] + c["x1"]) / 2 <= s["bbox"][2] + 1 and s["bbox"][1] - 1 <= (c["top"] + c["bottom"]) / 2 <= s["bbox"][3] + 1 for s in merged)]
            if uncovered:
                raise ValueError(f"Source coverage incomplete on page {index + 1}")
            records.append({"number": index + 1, "coveredCharacters": sum(bool(c["text"].strip()) for c in page.chars), "segments": merged})
    result = {"schemaVersion": 1, "sourceSha256": digest, "extractor": "pdfplumber-0.11.9/source-render", "pages": records}
    (output / "full-read.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    result = build(sys.argv[1], sys.argv[2])
    print(f"Prepared complete reading layout for {len(result['pages'])} source pages")
