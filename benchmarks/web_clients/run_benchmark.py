#!/usr/bin/env python3
"""Measure mhttpd page loads and gateway polling under virtual DQM clients."""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import shutil
import statistics
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path


@dataclass
class RequestResult:
    status: int
    latency_ms: float
    size_bytes: int
    error: str = ""


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.paths: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        path = values.get("src") if tag == "script" else values.get("href")
        if path and tag in {"script", "link"}:
            self.paths.append(path)


def request(url: str, timeout: float) -> RequestResult:
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            body = response.read()
            return RequestResult(response.status, (time.perf_counter() - started) * 1000, len(body))
    except urllib.error.HTTPError as error:
        body = error.read()
        return RequestResult(error.code, (time.perf_counter() - started) * 1000, len(body), str(error))
    except Exception as error:  # benchmark must retain all transport failures
        return RequestResult(0, (time.perf_counter() - started) * 1000, 0, str(error))


def get_json(url: str, timeout: float) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.load(response)


def bounded_percentile(values: list[float], percentile: float) -> float:
    if not values:
        return math.nan
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, math.ceil(percentile * len(ordered)) - 1))
    return ordered[index]


def catalog_endpoints(gateway: str, timeout: float, maximum: int) -> list[str]:
    catalog = get_json(f"{gateway}/api/v1/catalog", timeout)
    endpoints: list[str] = []

    seen_detectors: set[str] = set()
    for item in catalog.get("waveforms", []):
        detector = str(item.get("detector", ""))
        if not detector or detector in seen_detectors:
            continue
        seen_detectors.add(detector)
        query = urllib.parse.urlencode({
            "detector": detector,
            "module": item.get("module", 0),
            "submodule": item.get("submodule", 0),
            "channel": item.get("channel", 0),
            "max-samples": 1024,
        })
        endpoints.append(f"{gateway}/api/v1/waveforms?{query}")

    for item in catalog.get("hit-series", []):
        query = urllib.parse.urlencode({
            "detector": item.get("detector", "musip"),
            "module": item.get("module", 0),
            "submodule": item.get("submodule", 0),
            "channel": item.get("channel", 0),
            "max-hits": 256,
        })
        endpoints.append(f"{gateway}/api/v1/hit-series?{query}")
        break

    for item in catalog.get("histograms", []):
        name = item.get("name")
        if name:
            query = urllib.parse.urlencode({"name": name, "max-bins": 256})
            endpoints.append(f"{gateway}/api/v1/histograms?{query}")

    if not endpoints:
        endpoints.append(f"{gateway}/api/v1/health")
    return endpoints[:maximum]


def run_polling_scenario(
    endpoints: list[str], clients: int, interval: float, duration: float, timeout: float
) -> dict:
    barrier = threading.Barrier(clients + 1)

    def virtual_client() -> tuple[list[RequestResult], int, int]:
        results: list[RequestResult] = []
        completed_updates = 0
        late_updates = 0
        barrier.wait()
        started = time.perf_counter()
        deadline = started + duration
        next_poll = started
        while next_poll < deadline:
            remaining = next_poll - time.perf_counter()
            if remaining > 0:
                time.sleep(remaining)
            update_results = [request(endpoint, timeout) for endpoint in endpoints]
            results.extend(update_results)
            completed_updates += 1
            next_poll += interval
            if time.perf_counter() > next_poll:
                late_updates += 1
        remaining = deadline - time.perf_counter()
        if remaining > 0:
            time.sleep(remaining)
        return results, completed_updates, late_updates

    wall_started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=clients) as executor:
        futures = [executor.submit(virtual_client) for _ in range(clients)]
        barrier.wait()
        client_results = [future.result() for future in futures]
    elapsed = time.perf_counter() - wall_started

    results = [item for group, _, _ in client_results for item in group]
    latencies = [item.latency_ms for item in results]
    successful = sum(200 <= item.status < 300 for item in results)
    limited = sum(item.status == 429 for item in results)
    failures = len(results) - successful - limited
    updates = sum(group[1] for group in client_results)
    late = sum(group[2] for group in client_results)
    return {
        "kind": "polling",
        "clients": clients,
        "poll_interval_seconds": interval,
        "endpoints_per_client": len(endpoints),
        "duration_seconds": elapsed,
        "requests": len(results),
        "successful_requests": successful,
        "rate_limited_requests": limited,
        "failed_requests": failures,
        "success_percent": 100 * successful / len(results) if results else 0,
        "request_rate_hz": len(results) / elapsed,
        "successful_request_rate_hz": successful / elapsed,
        "updates_per_client_per_second": updates / clients / elapsed,
        "late_update_percent": 100 * late / updates if updates else 0,
        "response_mib_per_second": sum(item.size_bytes for item in results) / elapsed / 2**20,
        "latency_p50_ms": statistics.median(latencies) if latencies else math.nan,
        "latency_p95_ms": bounded_percentile(latencies, 0.95),
        "latency_p99_ms": bounded_percentile(latencies, 0.99),
    }


def page_assets(page_url: str, timeout: float) -> list[str]:
    with urllib.request.urlopen(page_url, timeout=timeout) as response:
        html = response.read().decode("utf-8", errors="replace")
    parser = AssetParser()
    parser.feed(html)
    assets = [page_url]
    for path in parser.paths:
        url = urllib.parse.urljoin(page_url, path)
        if urllib.parse.urlsplit(url).netloc == urllib.parse.urlsplit(page_url).netloc:
            assets.append(url)
    return list(dict.fromkeys(assets))


def run_page_scenario(urls: list[str], clients: int, timeout: float) -> dict:
    barrier = threading.Barrier(clients + 1)

    def load_page() -> list[RequestResult]:
        barrier.wait()
        return [request(url, timeout) for url in urls]

    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=clients) as executor:
        futures = [executor.submit(load_page) for _ in range(clients)]
        barrier.wait()
        groups = [future.result() for future in futures]
    elapsed = time.perf_counter() - started
    results = [item for group in groups for item in group]
    latencies = [sum(item.latency_ms for item in group) for group in groups]
    successful = sum(200 <= item.status < 300 for item in results)
    return {
        "kind": "cold-page-load",
        "clients": clients,
        "poll_interval_seconds": None,
        "endpoints_per_client": len(urls),
        "duration_seconds": elapsed,
        "requests": len(results),
        "successful_requests": successful,
        "rate_limited_requests": 0,
        "failed_requests": len(results) - successful,
        "success_percent": 100 * successful / len(results) if results else 0,
        "request_rate_hz": len(results) / elapsed,
        "successful_request_rate_hz": successful / elapsed,
        "updates_per_client_per_second": clients / elapsed,
        "late_update_percent": 0,
        "response_mib_per_second": sum(item.size_bytes for item in results) / elapsed / 2**20,
        "latency_p50_ms": statistics.median(latencies) if latencies else math.nan,
        "latency_p95_ms": bounded_percentile(latencies, 0.95),
        "latency_p99_ms": bounded_percentile(latencies, 0.99),
    }


def write_report(output: Path, rows: list[dict], endpoints: list[str], arguments: argparse.Namespace) -> None:
    output.mkdir(parents=True, exist_ok=True)
    (output / "summary.json").write_text(json.dumps({
        "gateway": arguments.gateway_url,
        "mhttpd_page": arguments.mhttpd_url,
        "endpoints": endpoints,
        "scenarios": rows,
        "rate_limit_note": (
            "All local virtual clients share one source IP. HTTP 429 responses measure the "
            "configured per-IP safety policy, not the gateway's processing ceiling."
        ),
    }, indent=2) + "\n", encoding="utf-8")

    with (output / "summary.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        "# DQM web-client benchmark",
        "",
        f"Gateway: `{arguments.gateway_url}`  ",
        f"MIDAS page: `{arguments.mhttpd_url}`  ",
        f"Selected API views per client: {len(endpoints)}",
        "",
        "> All local virtual clients share one source IP. HTTP 429 responses measure the "
        "configured per-IP safety policy, not the gateway's processing ceiling.",
        "",
        "| Workload | Clients | Poll (s) | Success | 429 | p50 (ms) | p95 (ms) | Req/s | MiB/s | Late updates |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in rows:
        poll = "—" if row["poll_interval_seconds"] is None else f'{row["poll_interval_seconds"]:.3g}'
        lines.append(
            f'| {row["kind"]} | {row["clients"]} | {poll} | '
            f'{row["success_percent"]:.1f}% | {row["rate_limited_requests"]} | '
            f'{row["latency_p50_ms"]:.2f} | {row["latency_p95_ms"]:.2f} | '
            f'{row["request_rate_hz"]:.1f} | {row["response_mib_per_second"]:.2f} | '
            f'{row["late_update_percent"]:.1f}% |'
        )
    (output / "benchmark_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    try:
        # Headless benchmark hosts do not need an interactive backend. Limiting
        # BLAS threads also avoids oversubscription (and hangs in some Conda
        # OpenBLAS builds) while rendering the small report figures.
        os.environ.setdefault("MPLBACKEND", "Agg")
        os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
        import matplotlib.pyplot as plt
        from matplotlib.backends.backend_pdf import PdfPages
    except ImportError:
        return

    polling = [row for row in rows if row["kind"] == "polling"]
    with PdfPages(output / "benchmark_report.pdf") as pdf:
        figure, axes = plt.subplots(2, 2, figsize=(11, 8.5))
        for interval in sorted({row["poll_interval_seconds"] for row in polling}, reverse=True):
            group = [row for row in polling if row["poll_interval_seconds"] == interval]
            label = f"{interval:g} s polling"
            axes[0, 0].plot([r["clients"] for r in group], [r["successful_request_rate_hz"] for r in group], marker="o", label=label)
            axes[0, 1].plot([r["clients"] for r in group], [r["latency_p95_ms"] for r in group], marker="o", label=label)
            axes[1, 0].plot([r["clients"] for r in group], [r["success_percent"] for r in group], marker="o", label=label)
            axes[1, 1].plot([r["clients"] for r in group], [r["late_update_percent"] for r in group], marker="o", label=label)
        titles = ["Successful API throughput", "API latency p95", "Successful responses", "Late polling cycles"]
        ylabels = ["requests/s", "ms", "%", "%"]
        for axis, title, ylabel in zip(axes.flat, titles, ylabels):
            axis.set_title(title)
            axis.set_xlabel("concurrent virtual clients")
            axis.set_ylabel(ylabel)
            axis.grid(alpha=0.3)
            axis.legend(fontsize=8)
        figure.suptitle("DQM gateway polling benchmark")
        figure.tight_layout()
        pdf.savefig(figure)
        plt.close(figure)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gateway-url", default="http://127.0.0.1:8080")
    parser.add_argument("--mhttpd-url", default="http://127.0.0.1:8081/DQM")
    parser.add_argument("--clients", type=int, nargs="+", default=[1, 2, 4, 8, 16, 32])
    parser.add_argument("--poll-intervals", type=float, nargs="+", default=[2.0, 1.0, 0.5])
    parser.add_argument("--duration", type=float, default=10.0)
    parser.add_argument("--maximum-endpoints", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=5.0)
    parser.add_argument("--skip-page-load", action="store_true")
    parser.add_argument("--output", type=Path, default=Path(".artifacts/web-client-benchmark/latest"))
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    if arguments.duration <= 0 or any(value <= 0 for value in arguments.poll_intervals):
        raise SystemExit("duration and polling intervals must be positive")
    if any(value <= 0 for value in arguments.clients):
        raise SystemExit("client counts must be positive")

    gateway = arguments.gateway_url.rstrip("/")
    arguments.gateway_url = gateway
    endpoints = catalog_endpoints(gateway, arguments.timeout, arguments.maximum_endpoints)
    rows: list[dict] = []

    if not arguments.skip_page_load:
        assets = page_assets(arguments.mhttpd_url, arguments.timeout)
        for clients in arguments.clients:
            print(f"[benchmark] cold page load: {clients} clients, {len(assets)} assets")
            rows.append(run_page_scenario(assets, clients, arguments.timeout))

    for interval in arguments.poll_intervals:
        for clients in arguments.clients:
            print(f"[benchmark] polling: {clients} clients, {interval:g}s, {len(endpoints)} views")
            rows.append(run_polling_scenario(
                endpoints, clients, interval, arguments.duration, arguments.timeout))

    if arguments.output.exists():
        shutil.rmtree(arguments.output)
    write_report(arguments.output, rows, endpoints, arguments)
    print(f"[benchmark] Report: {arguments.output / 'benchmark_report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
