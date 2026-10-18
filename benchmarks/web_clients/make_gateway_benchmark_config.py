#!/usr/bin/env python3
"""Create an isolated high-rate gateway config without editing its source tree."""

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--port", type=int, default=8082)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--mhttpd-origin", default="http://127.0.0.1:8081")
    parser.add_argument("--preserve-rate-limits", action="store_true")
    args = parser.parse_args()

    config = json.loads(args.base.read_text(encoding="utf-8"))
    config["server"]["port"] = args.port
    config["server"]["threads"] = args.threads
    origins = set(config["server"].get("allowed-origins", []))
    origins.add(args.mhttpd_origin)
    config["server"]["allowed-origins"] = sorted(origins)
    if not args.preserve_rate_limits:
        config["limits"]["requests-per-second"] = 1_000_000.0
        config["limits"]["request-burst"] = 1_000_000

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
