from pathlib import Path

path = Path(r"apps/web/src/app/driver/[jobId]/page.tsx")
raw = path.read_bytes()
print(raw[:20])
