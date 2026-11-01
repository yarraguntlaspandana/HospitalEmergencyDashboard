# Hospital Emergency Network Dashboard

## 1. Folder structure

HospitalEmergencyDashboard/
├── HospitalServer.java
└── web/
    ├── index.html
    ├── style.css
    └── app.js

## 2. Run

Open a terminal inside this folder and run:

javac HospitalServer.java
java HospitalServer

Then open:

http://localhost:8080

## 3. What this first version demonstrates

- Bright light-mode hospital dashboard
- Network topology
- Emergency patient information
- Dijkstra route section
- Framing
- CRC status
- Sliding Window
- Go-Back-N retransmission simulation
- Communication activity log
- Route and transmission status cards

The next development step is to connect the existing HospitalNetwork.java algorithms to the dashboard API so the Java backend controls the real simulation instead of the current frontend demo simulation.
