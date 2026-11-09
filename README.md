# DQM Webpage Frontend

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React Version](https://img.shields.io/badge/react-19.1.0-blue)](https://react.dev/)
[![Node.js Version](https://img.shields.io/badge/node-%3E=16.0.0-green)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-%3E=8.0.0-orange)](https://www.npmjs.com/)

## Overview

The **DQM Webpage Frontend** is a React-based dashboard for **dynamic data quality monitoring (DQM)**.
It supports plugin-based figures (plots, tables, labels, etc.), tabbed layouts, and persistent configurations.

The frontend connects to the `dqm_gateway` HTTP API to display selected live
products without sending every product to every browser.

---

## Quick Start

```bash
# Clone repo
git clone https://github.com/jaca230/DQM_webpage.git
cd DQM_webpage/frontend

# Install the locked dependencies
npm ci

# Run development server
npm start
```

By default, the app runs at [http://localhost:3000](http://localhost:3000).

For production builds:

```bash
npm run build
```

Run the tests with:

```bash
CI=true npm test -- --runInBand
```

## MIDAS custom page

The production React bundle can be served directly by `mhttpd`; no second
frontend web server is required. The page appears as **DQM** in the MIDAS menu,
uses the normal MIDAS header/navigation, and continues to request bounded views
from `dqm_gateway`.

Build, register, and launch the page in an existing experiment:

```sh
export MIDASSYS=/home/jack/software/midas
export MIDAS_EXPTAB=/path/to/exptab

./scripts/midas/launch.sh \
  --experiment EXPERIMENT_NAME \
  --gateway-url http://127.0.0.1:8000
```

The launcher runs the production build and ODB registration before starting
`mhttpd`. Use `--skip-build` when only restarting an unchanged page. The lower
level `build_custom_page.sh`, `configure_custom_page.sh`, and `run_mhttpd.sh`
commands remain available for debugging individual steps.

The configuration command creates:

```text
/Custom/Path  = <this repository>/build
/Custom/DQM&  = index.html
```

`/Custom/Path` is shared by every MIDAS custom page. If an experiment already
uses a different directory, copy or symlink this build into that directory
instead of replacing the established path.

Open [http://127.0.0.1:8080/DQM](http://127.0.0.1:8080/DQM). For a remote
browser, pass the externally reachable gateway URL to the configuration script;
the browser must not be configured with `127.0.0.1` unless it runs on the DAQ
host. Add the corresponding `mhttpd` origin, such as
`http://daq-host:8080`, to the gateway's exact `allowed-origins` list.

Port 8080 is not forwarded to another server. It is the default HTTP listener
for `mhttpd`, which serves the MIDAS interface and the DQM production bundle.
The gateway remains a separate process on port 8000.

For the existing full detector demo, use four terminals:

```sh
# Terminal 0: isolated MIDAS experiment, acquisition, and four frontends
cd /home/jack/cpp_projects/midas_stuff/midas_publisher
python3 benchmarks/rate_tests/run_midas_demo.py

# Terminal 1: publisher and publisher-owned Gaudi sidecar
cd /home/jack/cpp_projects/midas_stuff/midas_publisher
./scripts/run.sh --config config/examples/online_demo.json \
  --experiment ZMQ_PUBLISHER_DEMO \
  --exptab .artifacts/midas-demo/experiment/exptab

# Terminal 2: gateway; its default config includes the local mhttpd origin
cd /home/jack/cpp_projects/dqm_gateway
./scripts/run.sh

# Terminal 3: build, register, and run the MIDAS-hosted dashboard
cd /home/jack/large_projects/DQM_webpage/frontend
export MIDASSYS=/home/jack/software/midas
export MIDAS_EXPTAB=/home/jack/cpp_projects/midas_stuff/midas_publisher/.artifacts/midas-demo/experiment/exptab
./scripts/midas/launch.sh \
  --experiment ZMQ_PUBLISHER_DEMO \
  --gateway-url http://127.0.0.1:8000 \
  --no-hostlist
```

For a local-only test where MIDAS host access control has not been configured:

```sh
./scripts/midas/launch.sh --experiment EXPERIMENT_NAME --no-hostlist
```

Do not use `--no-hostlist` on an exposed DAQ network.

## Web-client benchmark

The benchmark discovers real waveform, hit-series, and histogram selections
from the gateway catalog. It measures concurrent cold loads of the `mhttpd`
page and continuous polling by virtual dashboard clients. Reports are replaced
in `.artifacts/web-client-benchmark/latest` so test runs do not accumulate.
It measures HTTP serving and update delivery, not browser Plotly rendering or
GPU performance; use it to size `mhttpd` and the gateway independently of a
particular operator workstation.

With the full pipeline, gateway, and `mhttpd` running:

```sh
python3 benchmarks/web_clients/run_benchmark.py \
  --gateway-url http://127.0.0.1:8000 \
  --mhttpd-url http://127.0.0.1:8080/DQM \
  --clients 1 2 4 8 16 32 \
  --poll-intervals 2 1 0.5 \
  --duration 10
```

The production gateway deliberately rate-limits each source IP. Local virtual
clients all share one IP, so HTTP 429 responses show where that safety policy
engages, not the server's raw capacity. To measure capacity separately, run the
gateway-owned high-limit configuration on port 8082:

```sh
cd /home/jack/cpp_projects/dqm_gateway
./scripts/run.sh --config config/benchmark.json --port 8082

cd /home/jack/large_projects/DQM_webpage/frontend
python3 benchmarks/web_clients/run_benchmark.py \
  --gateway-url http://127.0.0.1:8082 \
  --mhttpd-url http://127.0.0.1:8080/DQM
```

The high-limit configuration is a benchmark fixture only. Keep the production
throttles enabled for actual clients.

## Built-in detector waveforms

SAMPIC, HDSoC, and WFD5 waveform figures are built into the frontend
while their online interfaces are being developed. The default Detector
Overview contains those three traces and a separate MuSiP
hit-energy-versus-time scatter plot because MuSiP produces hits, not sampled
waveforms. The default layout queries the local DQM gateway's `/waveforms` and
`/hit-series` endpoints. There is no browser-side simulated fallback: before
the first valid response, an unavailable selection reports that no live data
was found.

Layouts saved by an older checkout take precedence over the default. Use
**Manage layout → Reset to default** once if the Detector Overview is not
visible.

The preferred payload is detector-independent:

```json
{
  "detector": "sampic",
  "waveforms": [
    {
      "module": 0,
      "submodule": 0,
      "channel": 3,
      "samples": [12, 13, 18, 42]
    }
  ]
}
```

The adapter also accepts the existing WFD5 `data.arr[].trace` representation.
Detector coordinates, channel, maximum returned samples, and polling interval
are configurable per figure. SAMPIC exposes crate/FEB/chip/channel, WFD5
exposes crate/AMC/channel, and HDSoC exposes board/channel. MuSiP's bounded
hit-series endpoint exposes producer group/channel and explicit hit times.
Waveform color is available under each figure's advanced settings.

## Built-in histograms

The histogram figures read one named histogram from the runtime-configured
gateway `/api/v1/histograms` endpoint and request only the configured maximum
number of bins. Detector pulse-integral figures select either an explicitly
labeled global distribution or a module/submodule/channel distribution. The
default Pulse Integrals tab starts with the global SAMPIC, HDSoC, WFD5, and
MuSiP distributions produced by the online Gaudi job.
It displays `No live histogram found` when the gateway has no matching data.
Reset a previously saved layout to the default once to add this new tab.
Histogram figures independently support linear or logarithmic energy and count
axes. All live plots retain the last valid response if a later request is empty
or unavailable. Figure settings independently control the Gaudi product
generation time and the browser fetch time as relative ages, timestamps, or
hidden labels.

## ATAR monitoring

The default layout includes ATAR Channels, Event, and Trends tabs. Their ten
figures correspond to the collaborator demonstrator views: occupancy,
hits/event, baseline, noise, waveforms, hit positions, charge depth,
persistence, charge against amplitude, and amplitude by channel. Each figure
requests one bounded view from `/api/v1/atar`; the browser does not download the
other accumulated ATAR products.

## Documentation

Full documentation, including:

* **Installation & Deployment**
* **Dashboard Layout**
* **Figures**
* **Plugin System**
* **UI Tutorial**

See the [Wiki](https://github.com/jaca230/DQM_webpage/wiki)

## License

MIT License — see [LICENSE](LICENSE).
