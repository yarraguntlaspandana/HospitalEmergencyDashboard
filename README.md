# Hospital Emergency Network Dashboard

A Java-based HTTP server that visualises a hospital emergency network, demonstrates Dijkstra shortest-path routing, and simulates data-link layer protocols (CRC, Sliding Window, Go-Back-N) through an interactive browser dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Folder Structure](#folder-structure)
4. [Prerequisites](#prerequisites)
5. [Environment Setup](#environment-setup)
6. [Running the Server](#running-the-server)
7. [API Reference](#api-reference)
8. [Network Topology](#network-topology)
9. [Contributing](#contributing)

---

## Project Overview

This project was built as a Computer Networks course demonstration. It combines:

- A **pure-Java HTTP server** (no external frameworks) that serves static files and exposes a small REST API.
- A **browser dashboard** (HTML + CSS + JS) that communicates with the Java backend to visualise real-time network behaviour.

---

## Features

| Feature | Description |
|---|---|
| Network Topology View | Visual graph of hospital nodes and links |
| Dijkstra Routing | Shortest-path calculation with optional node failure |
| Emergency Patient Info | Live patient status cards |
| Framing | Simulated bit-stuffing / byte-count framing |
| CRC Status | Cyclic Redundancy Check visualisation |
| Sliding Window | Send-window animation |
| Go-Back-N | Retransmission simulation |
| Activity Log | Real-time communication event log |

---

## Folder Structure

```
HospitalEmergencyDashboard/
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
└── HospitalEmergencyDashboard/
    ├── HospitalServer.java       # Java HTTP server + Dijkstra implementation
    ├── README.txt                # Quick-start notes
    └── web/
        ├── index.html            # Dashboard UI
        ├── style.css             # Styles
        └── app.js                # Frontend simulation logic
```

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Java JDK | 11 |
| A modern browser | Chrome 90 / Firefox 88 / Edge 90 |

No build tool or third-party library is required — the server uses only the JDK's built-in `com.sun.net.httpserver` package.

---

## Environment Setup

1. Copy the example env file:
   ```
   copy .env.example .env
   ```
2. Edit `.env` and adjust values if needed (the defaults work out of the box):
   ```
   SERVER_PORT=8080
   SERVER_HOST=localhost
   ```

> **Note:** `.env` is listed in `.gitignore` and will never be committed.

---

## Running the Server

Open a terminal inside the `HospitalEmergencyDashboard/HospitalEmergencyDashboard/` folder:

```bash
# 1. Compile
javac HospitalServer.java

# 2. Run
java HospitalServer
```

Then open your browser at:

```
http://localhost:8080
```

Press `Ctrl + C` to stop the server.

---

## API Reference

### `GET /api/network`

Returns the full node and edge list for the hospital network graph.

**Response:**
```json
{
  "nodes": ["ICU", "Router A", "Router B", "Router C", "Router D", "Emergency Server"],
  "edges": [
    { "from": "ICU", "to": "Router A", "cost": 2 },
    ...
  ]
}
```

---

### `GET /api/route?fail=<nodeName>`

Runs Dijkstra from **ICU** to **Emergency Server**, optionally treating `nodeName` as failed.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `fail` | string | No | Name of the node to exclude from routing |

**Example:**
```
GET /api/route?fail=Router+A
```

**Response:**
```json
{
  "route": "ICU -> Router B -> Router C -> Router D -> Emergency Server",
  "cost": 10,
  "failedNode": "Router A"
}
```

---

## Network Topology

```
ICU ──(2)── Router A ──(6)── Emergency Server
 │               │                    │
(4)            (2)                  (2)
 │               │                    │
Router B ──(2)── ┘           Router D ┘
     │                            │
    (2)                          (2)
     └──────── Router C ──────────┘
```

Default shortest path (no failures): **ICU → Router A → Router B → Router C → Router D → Emergency Server** (cost = 10)

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push the branch: `git push -u origin feature/your-feature`
5. Open a Pull Request against `main`.

Please keep commits focused and write clear commit messages.
