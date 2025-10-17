from pathlib import Path

path = Path(r"apps/web/src/app/driver/[jobId]/page.tsx")
text = path.read_text(encoding="utf-8-sig")
path.write_text(text, encoding="utf-8")
