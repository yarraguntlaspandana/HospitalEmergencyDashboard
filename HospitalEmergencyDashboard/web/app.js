// =====================================================
// HOSPITAL EMERGENCY NETWORK
// app.js
// =====================================================

let transmissionRunning = false;
let retransmissionCount = 0;
let deliveredPackets = 0;

const totalFrames = 4;


// =====================================================
// ERROR SIMULATION
// =====================================================

function getFailedFrame() {

    const mode =
        document.getElementById("errorMode").value;

    if (mode === "none") {
        return -1;
    }

    if (mode === "random") {
        return Math.floor(
            Math.random() * totalFrames
        );
    }

    if (mode === "choose") {

        return parseInt(
            document.getElementById("failedFrame").value
        );
    }

    return -1;
}


// =====================================================
// FRAME SELECTION
// =====================================================

function toggleFrameSelect() {

    const mode =
        document.getElementById("errorMode").value;

    const frameSelect =
        document.getElementById("failedFrame");

    if (mode === "choose") {

        frameSelect.style.display = "block";

    } else {

        frameSelect.style.display = "none";
    }
}


// =====================================================
// START TRANSMISSION
// =====================================================

function startTransmission() {

    if (transmissionRunning) {
        return;
    }

    transmissionRunning = true;

    resetFramesOnly();

    const status =
        document.getElementById("transmissionStatus");

    if (status) {

        status.innerText = "TRANSMITTING";

        status.className = "sending-badge";
    }


    const patientIdElement =
        document.getElementById("patientId");

    const patientNameElement =
        document.getElementById("patientName");

    const heartRateElement =
        document.getElementById("heartRate");

    const temperatureElement =
        document.getElementById("temperature");

    const priorityElement =
        document.getElementById("priority");


    const patientId =
        patientIdElement
            ? patientIdElement.value.trim()
            : "";

    const patientName =
        patientNameElement
            ? patientNameElement.value.trim()
            : "";

    const heartRate =
        heartRateElement
            ? heartRateElement.value.trim()
            : "";

    const temperature =
        temperatureElement
            ? temperatureElement.value.trim()
            : "";

    const priority =
        priorityElement
            ? priorityElement.value
            : "Emergency";


    if (
        patientId === "" ||
        patientName === "" ||
        heartRate === "" ||
        temperature === ""
    ) {

        alert(
            "Please enter all patient details."
        );

        transmissionRunning = false;

        return;
    }


    addLog(
        "Starting patient data transmission.",
        "info"
    );

    addLog(
        "Patient " +
        patientId +
        " → Emergency Server",
        "info"
    );

    addLog(
        "Patient Name: " +
        patientName,
        "info"
    );

    addLog(
        "Heart Rate: " +
        heartRate +
        " BPM | Temperature: " +
        temperature +
        " °C",
        "info"
    );

    addLog(
        "Priority: " +
        priority,
        priority === "Emergency"
            ? "warning"
            : "info"
    );

    addLog(
        "Applying CRC error detection.",
        "info"
    );


    const failedFrame =
        getFailedFrame();


    if (failedFrame === -1) {

        addLog(
            "Error simulation: No Error.",
            "success"
        );

    } else {

        addLog(
            "Error simulation enabled for F" +
            (failedFrame + 1) +
            ".",
            "warning"
        );
    }


    sendFrame(
        0,
        failedFrame
    );
}


// =====================================================
// SEND FRAME
// =====================================================

function sendFrame(
    index,
    failedFrame
) {

    if (index >= totalFrames) {

        finishTransmission();

        return;
    }


    const frame =
        document.getElementById(
            "frame" + index
        );


    if (!frame) {

        sendFrame(
            index + 1,
            failedFrame
        );

        return;
    }


    const status =
        frame.querySelector(
            ".frame-status"
        );


    frame.classList.add(
        "sending"
    );


    if (status) {

        status.innerText =
            "Sending...";
    }


    setTimeout(function () {

        frame.classList.remove(
            "sending"
        );


        if (index === failedFrame) {

            frame.classList.add(
                "failed"
            );


            if (status) {

                status.innerText =
                    "CRC Error ✕";
            }


            addLog(
                "F" +
                (index + 1) +
                " corrupted. CRC verification failed.",
                "error"
            );


            sendRemainingAfterError(
                index + 1,
                failedFrame
            );


            return;
        }


        frame.classList.add(
            "success"
        );


        if (status) {

            status.innerText =
                "Delivered ✓";
        }


        addLog(
            "F" +
            (index + 1) +
            " received successfully. CRC verified.",
            "success"
        );


        updateProgress(
            index + 1
        );


        setTimeout(function () {

            sendFrame(
                index + 1,
                failedFrame
            );

        }, 500);

    }, 700);
}


// =====================================================
// SEND REMAINING FRAMES
// =====================================================

function sendRemainingAfterError(
    startIndex,
    failedFrame
) {

    if (startIndex >= totalFrames) {

        startGoBackN(
            failedFrame
        );

        return;
    }


    const frame =
        document.getElementById(
            "frame" + startIndex
        );


    if (!frame) {

        sendRemainingAfterError(
            startIndex + 1,
            failedFrame
        );

        return;
    }


    const status =
        frame.querySelector(
            ".frame-status"
        );


    frame.classList.add(
        "sending"
    );


    if (status) {

        status.innerText =
            "Sent / Waiting";
    }


    addLog(
        "F" +
        (startIndex + 1) +
        " sent but waiting for previous frame.",
        "warning"
    );


    setTimeout(function () {

        frame.classList.remove(
            "sending"
        );

        frame.classList.add(
            "waiting"
        );


        if (status) {

            status.innerText =
                "Waiting";
        }


        sendRemainingAfterError(
            startIndex + 1,
            failedFrame
        );

    }, 500);
}


// =====================================================
// GO-BACK-N
// =====================================================

function startGoBackN(
    failedFrame
) {

    addLog(
        "Go-Back-N triggered from F" +
        (failedFrame + 1) +
        ".",
        "warning"
    );


    const status =
        document.getElementById(
            "transmissionStatus"
        );


    if (status) {

        status.innerText =
            "GO-BACK-N";
    }


    setTimeout(function () {

        retransmissionCount++;


        const retransmissionElement =
            document.getElementById(
                "retransmissions"
            );


        if (retransmissionElement) {

            retransmissionElement.innerText =
                retransmissionCount;
        }


        addLog(
            "Retransmitting from F" +
            (failedFrame + 1) +
            " onward.",
            "info"
        );


        retransmitFrame(
            failedFrame
        );

    }, 1000);
}


// =====================================================
// RETRANSMIT FRAME
// =====================================================

function retransmitFrame(
    index
) {

    if (index >= totalFrames) {

        finishTransmission();

        return;
    }


    const frame =
        document.getElementById(
            "frame" + index
        );


    if (!frame) {

        retransmitFrame(
            index + 1
        );

        return;
    }


    const status =
        frame.querySelector(
            ".frame-status"
        );


    frame.classList.remove(
        "failed",
        "waiting",
        "success"
    );


    frame.classList.add(
        "retransmitting"
    );


    if (status) {

        status.innerText =
            "Retransmitting ↻";
    }


    addLog(
        "F" +
        (index + 1) +
        " retransmission started.",
        "info"
    );


    setTimeout(function () {

        frame.classList.remove(
            "retransmitting"
        );


        frame.classList.add(
            "success"
        );


        if (status) {

            status.innerText =
                "Delivered ✓";
        }


        addLog(
            "F" +
            (index + 1) +
            " delivered after retransmission.",
            "success"
        );


        updateProgress(
            index + 1
        );


        setTimeout(function () {

            retransmitFrame(
                index + 1
            );

        }, 500);

    }, 700);
}


// =====================================================
// FINISH TRANSMISSION
// =====================================================

function finishTransmission() {

    transmissionRunning =
        false;


    deliveredPackets++;


    const packetElement =
        document.getElementById(
            "packetsDelivered"
        );


    if (packetElement) {

        packetElement.innerText =
            deliveredPackets;
    }


    const status =
        document.getElementById(
            "transmissionStatus"
        );


    if (status) {

        status.innerText =
            "DELIVERED";

        status.className =
            "success-badge";
    }


    updateProgress(
        totalFrames
    );


    addLog(
        "Emergency patient data delivered successfully.",
        "success"
    );


    addLog(
        "Transmission completed.",
        "success"
    );
}


// =====================================================
// UPDATE PROGRESS
// =====================================================

function updateProgress(
    count
) {

    const percentage =
        Math.round(
            (count / totalFrames) * 100
        );


    const progress =
        document.getElementById(
            "progress"
        );


    const progressText =
        document.getElementById(
            "progressText"
        );


    if (progress) {

        progress.style.width =
            percentage + "%";
    }


    if (progressText) {

        progressText.innerText =
            percentage + "%";
    }
}


// =====================================================
// RESET TRANSMISSION
// =====================================================

function resetTransmission() {

    transmissionRunning =
        false;


    resetFramesOnly();


    const status =
        document.getElementById(
            "transmissionStatus"
        );


    if (status) {

        status.innerText =
            "WAITING";

        status.className =
            "waiting-badge";
    }


    addLog(
        "Transmission reset.",
        "info"
    );
}


// =====================================================
// RESET FRAMES
// =====================================================

function resetFramesOnly() {

    for (
        let i = 0;
        i < totalFrames;
        i++
    ) {

        const frame =
            document.getElementById(
                "frame" + i
            );


        if (!frame) {
            continue;
        }


        frame.className =
            "frame";


        const status =
            frame.querySelector(
                ".frame-status"
            );


        if (status) {

            status.innerText =
                "Waiting";
        }
    }


    updateProgress(
        0
    );
}


// =====================================================
// DIJKSTRA - FIND BEST ROUTE
// =====================================================

async function findRoute() {

    addLog(
        "Running Dijkstra shortest-path algorithm...",
        "info"
    );


    try {

        const response =
            await fetch(
                "/api/route"
            );


        if (!response.ok) {

            throw new Error(
                "Route request failed"
            );
        }


        const data =
            await response.json();


        clearRouteStyles();


        highlightJavaRoute(
            data.route,
            "shortest-path"
        );


        const routeCost =
            document.getElementById(
                "routeCost"
            );


        if (routeCost) {

            routeCost.innerText =
                data.cost;
        }


        const message =
            document.getElementById(
                "routeMessage"
            );


        if (message) {

            message.innerText =
                "Dijkstra selected: " +
                data.route;
        }


        addLog(
            "Shortest route found: " +
            data.route,
            "success"
        );


        addLog(
            "Total path cost = " +
            data.cost,
            "success"
        );


    } catch (error) {

        addLog(
            "Unable to connect to Java routing server.",
            "error"
        );


        console.error(
            error
        );
    }
}


// =====================================================
// ROUTER FAILURE
// =====================================================

async function simulateRouteFailure() {

    addLog(
        "⚠ Router A failure detected.",
        "warning"
    );


    const routerA =
        document.getElementById(
            "node-router-a"
        );


    if (routerA) {

        routerA.classList.add(
            "node-failed"
        );
    }


    const line1 =
        document.getElementById(
            "line-icu-a"
        );


    const line2 =
        document.getElementById(
            "line-a-server"
        );


    if (line1) {

        line1.classList.add(
            "line-failed"
        );
    }


    if (line2) {

        line2.classList.add(
            "line-failed"
        );
    }


    try {

        const response =
            await fetch(
                "/api/route?fail=Router%20A"
            );


        if (!response.ok) {

            throw new Error(
                "Alternative route request failed"
            );
        }


        const data =
            await response.json();


        setTimeout(function () {

            clearRouteStyles();


            if (line1) {

                line1.classList.add(
                    "line-failed"
                );
            }


            if (line2) {

                line2.classList.add(
                    "line-failed"
                );
            }


            highlightJavaRoute(
                data.route,
                "alternative-path"
            );


            const routeDisplay =
                document.getElementById(
                    "routeDisplay"
                );


            if (routeDisplay) {

                routeDisplay.innerHTML =
                    createRouteHTML(
                        data.route
                    );
            }


            const routeCost =
                document.getElementById(
                    "routeCost"
                );


            if (routeCost) {

                routeCost.innerText =
                    data.cost;
            }


            const routeMessage =
                document.getElementById(
                    "routeMessage"
                );


            if (routeMessage) {

                routeMessage.innerText =
                    "Router A failed. Dijkstra calculated an alternative route.";
            }


            addLog(
                "Alternative route found: " +
                data.route,
                "success"
            );


            addLog(
                "Alternative route cost = " +
                data.cost,
                "success"
            );


        }, 1000);


    } catch (error) {

        addLog(
            "Unable to calculate alternative route.",
            "error"
        );


        console.error(
            error
        );
    }
}


// =====================================================
// CREATE ROUTE HTML
// =====================================================

function createRouteHTML(
    route
) {

    const names =
        route.split(
            " -> "
        );


    let html = "";


    names.forEach(
        function(name, index) {

            let icon =
                "🔵";


            if (name === "ICU") {
                icon = "🏥";
            }


            if (name === "Router A") {
                icon = "🔵";
            }


            if (name === "Router B") {
                icon = "🟣";
            }


            if (name === "Router C") {
                icon = "🟢";
            }


            if (name === "Router D") {
                icon = "🟠";
            }


            if (
                name ===
                "Emergency Server"
            ) {

                icon = "🚨";
            }


            html +=
                '<span class="route-node">' +
                icon +
                " " +
                name +
                "</span>";


            if (
                index <
                names.length - 1
            ) {

                html +=
                    '<span class="arrow">→</span>';
            }

        }
    );


    return html;
}


// =====================================================
// HIGHLIGHT JAVA ROUTE
// =====================================================

function highlightJavaRoute(
    route,
    pathClass
) {

    clearRouteStyles();


    if (!pathClass) {

        pathClass =
            "shortest-path";
    }


    const routeParts =
        route.split(
            " -> "
        );


    for (
        let i = 0;
        i < routeParts.length - 1;
        i++
    ) {

        const from =
            routeParts[i];

        const to =
            routeParts[i + 1];


        let lineId =
            "";


        if (
            from === "ICU" &&
            to === "Router A"
        ) {

            lineId =
                "line-icu-a";
        }


        else if (
            from === "ICU" &&
            to === "Router B"
        ) {

            lineId =
                "line-icu-b";
        }


        else if (
            from === "Router A" &&
            to === "Router B"
        ) {

            lineId =
                "line-a-b";
        }


        else if (
            from === "Router A" &&
            to === "Emergency Server"
        ) {

            lineId =
                "line-a-server";
        }


        else if (
            from === "Router B" &&
            to === "Router C"
        ) {

            lineId =
                "line-b-c";
        }


        else if (
            from === "Router C" &&
            to === "Router D"
        ) {

            lineId =
                "line-c-d";
        }


        else if (
            from === "Router D" &&
            to === "Emergency Server"
        ) {

            lineId =
                "line-d-server";
        }


        if (lineId !== "") {

            const line =
                document.getElementById(
                    lineId
                );


            if (line) {

                line.classList.add(
                    pathClass
                );
            }
        }
    }


    const routeDisplay =
        document.getElementById(
            "routeDisplay"
        );


    if (routeDisplay) {

        routeDisplay.innerHTML =
            createRouteHTML(
                route
            );
    }
}


// =====================================================
// CLEAR ROUTE STYLES
// =====================================================

function clearRouteStyles() {

    document
        .querySelectorAll(
            ".connections line"
        )
        .forEach(
            function(line) {

                line.classList.remove(
                    "shortest-path",
                    "alternative-path"
                );
            }
        );
}


// =====================================================
// ACTIVITY LOG
// =====================================================

function addLog(
    message,
    type
) {

    const log =
        document.getElementById(
            "activityLog"
        );


    if (!log) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "log-item " +
        type;


    let icon =
        "●";


    if (type === "success") {
        icon = "✓";
    }


    if (type === "warning") {
        icon = "⚠";
    }


    if (type === "error") {
        icon = "✕";
    }


    item.innerHTML =
        "<span>" +
        icon +
        "</span>" +

        "<p>" +
        message +
        "</p>" +

        "<small>Now</small>";


    log.prepend(
        item
    );
}


// =====================================================
// CLEAR LOGS
// =====================================================

function clearLogs() {

    const log =
        document.getElementById(
            "activityLog"
        );


    if (!log) {
        return;
    }


    log.innerHTML =
        '<div class="log-item info">' +

        '<span>●</span>' +

        '<p>' +
        'Activity log cleared.' +
        '</p>' +

        '<small>Now</small>' +

        '</div>';
}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-btn"
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    buttons.forEach(
                        function(btn) {

                            btn.classList.remove(
                                "active"
                            );
                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    const name =
                        button.innerText
                            .trim()
                            .toLowerCase();


                    if (
                        name.includes(
                            "dashboard"
                        )
                    ) {

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });

                        return;
                    }


                    if (
                        name.includes(
                            "emergency"
                        )
                    ) {

                        scrollToHeading(
                            "Emergency Patient Data"
                        );

                        return;
                    }


                    if (
                        name.includes(
                            "routing"
                        )
                    ) {

                        scrollToHeading(
                            "Route Optimization"
                        );

                        return;
                    }


                    if (
                        name.includes(
                            "transmission"
                        )
                    ) {

                        scrollToHeading(
                            "Transmission"
                        );

                        return;
                    }


                    if (
                        name.includes(
                            "logs"
                        )
                    ) {

                        scrollToHeading(
                            "Communication Activity"
                        );

                        return;
                    }

                }
            );
        }
    );
}


// =====================================================
// FIND SECTION USING HEADING TEXT
// =====================================================

function scrollToHeading(
    headingText
) {

    const elements =
        document.querySelectorAll(
            "h1, h2, h3, h4, p, span, div"
        );


    for (
        let i = 0;
        i < elements.length;
        i++
    ) {

        const element =
            elements[i];


        const text =
            element.innerText
                ? element.innerText.trim()
                : "";


        if (
            text === headingText
        ) {

            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            return;
        }
    }


    console.log(
        "Section not found:",
        headingText
    );
}


// =====================================================
// START NAVIGATION AFTER PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupNavigation();

    }
);