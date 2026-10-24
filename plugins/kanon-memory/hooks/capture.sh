#!/usr/bin/env bash
# Stop/PreCompact: copy cited auto-memory facts into a candidates file outside the repo.
# Never blocks the session; a missing python3 or any failure is a silent no-op.
[ -t 0 ] && exit 0
command -v python3 >/dev/null 2>&1 || exit 0
python3 "$(dirname "$0")/../lib/capture.py" --hook >/dev/null 2>&1
exit 0
