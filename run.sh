#!/usr/bin/env bash
# Build Night Museum: rebuild from hub/scan.py (read-only), serve on :4263 under nohup, run the smoke test.
#   ./run.sh           build + serve + smoke test
#   ./run.sh --quick   build + serve
#   ./run.sh --shots   build + serve + screenshots + smoke test
set -euo pipefail
cd "$(dirname "$0")"
nice -n 10 python3 build.py
mkdir -p data
if [[ -f data/server.pid ]] && kill -0 "$(cat data/server.pid)" 2>/dev/null; then echo "already serving on :${MUSEUM_PORT:-4263} (pid $(cat data/server.pid))"; else
  nohup nice -n 10 python3 server.py > data/server.log 2>&1 &
  echo $! > data/server.pid; sleep 1; echo "serving http://127.0.0.1:${MUSEUM_PORT:-4263}/ (pid $!)"; fi
if [[ "${1:-}" == "--shots" ]]; then ./screenshot.sh; fi
if [[ "${1:-}" != "--quick" ]]; then python3 tests/smoke_test.py; fi
