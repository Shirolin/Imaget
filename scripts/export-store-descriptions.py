"""Export paste-ready plain-text store descriptions from descriptions.md.

descriptions.md stays the single source of truth; this only extracts each
fenced ```text block verbatim so it can be pasted into the CWS dashboard
without any risk of dragging the fence markers along.

Usage:
  python scripts/export-store-descriptions.py                 # all 14 languages
  python scripts/export-store-descriptions.py uk ru it id     # only the named ones
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "marketing" / "design-source" / "descriptions.md"
OUT_DIR = ROOT / "marketing" / "store-assets" / "paste-ready"

raw = SRC.read_text(encoding="utf-8")
sections = re.split(r"^## \d+\. ", raw, flags=re.M)[1:]

wanted = sys.argv[1:]
OUT_DIR.mkdir(parents=True, exist_ok=True)

written = []
for sec in sections:
    head = sec.splitlines()[0].strip()
    m = re.search(r"\(([a-zA-Z_]+)\)", head)
    if not m:
        continue
    code = m.group(1)
    if wanted and code not in wanted:
        continue
    body = re.search(r"```text\n(.*?)```", sec, re.S)
    if not body:
        print(f"  !! {code}: no ```text block found")
        continue
    text = body.group(1)
    # Preserve the content byte-for-byte apart from the trailing newline that
    # the fence itself owns.
    (OUT_DIR / f"{code}.txt").write_text(text.rstrip("\n") + "\n", encoding="utf-8")
    written.append((code, len(text.rstrip("\n")), head))

print(f"wrote {len(written)} file(s) to {OUT_DIR.relative_to(ROOT)}")
for code, n, head in written:
    print(f"  {code:6s} {n:5d} chars   ({head})")
