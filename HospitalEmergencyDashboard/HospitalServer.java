import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class HospitalServer {

    static final int PORT = 8080;

    static String[] nodes = {
            "ICU",
            "Router A",
            "Router B",
            "Router C",
            "Router D",
            "Emergency Server"
    };

    /*
     * Hospital network
     *
     * ICU -> Router A = 2
     * ICU -> Router B = 4
     * Router A -> Router B = 2
     * Router A -> Emergency Server = 6
     * Router B -> Router C = 2
     * Router C -> Router D = 2
     * Router D -> Emergency Server = 2
     */
    static int[][] graph = {

            // ICU   A   B   C   D   Server
            { 0,    2,  4,  0,  0,  0 }, // ICU

            { 2,    0,  2,  0,  0,  6 }, // Router A

            { 4,    2,  0,  2,  0,  0 }, // Router B

            { 0,    0,  2,  0,  2,  0 }, // Router C

            { 0,    0,  0,  2,  0,  2 }, // Router D

            { 0,    6,  0,  0,  2,  0 }  // Emergency Server
    };

    public static void main(String[] args) throws Exception {

        HttpServer server =
                HttpServer.create(
                        new InetSocketAddress(PORT),
                        0
                );

        server.createContext(
                "/",
                HospitalServer::handleWeb
        );

        server.createContext(
                "/api/route",
                HospitalServer::handleRoute
        );

        server.createContext(
                "/api/network",
                HospitalServer::handleNetwork
        );

        server.setExecutor(null);

        server.start();

        System.out.println();
        System.out.println("======================================");
        System.out.println(" Hospital Emergency Network");
        System.out.println("======================================");
        System.out.println();
        System.out.println(
                "Server running at:"
        );
        System.out.println(
                "http://localhost:" + PORT
        );
        System.out.println();
        System.out.println(
                "Press Ctrl + C to stop the server."
        );
        System.out.println();
    }

    static void handleWeb(
            HttpExchange exchange)
            throws IOException {

        URI uri =
                exchange.getRequestURI();

        String requestPath =
                uri.getPath();

        if (requestPath.equals("/")) {
            requestPath = "/index.html";
        }

        Path file =
                Paths.get(
                        "web",
                        requestPath.substring(1)
                );

        if (!Files.exists(file)
                || Files.isDirectory(file)) {

            sendResponse(
                    exchange,
                    404,
                    "File not found"
            );

            return;
        }

        byte[] data =
                Files.readAllBytes(file);

        String contentType =
                getContentType(requestPath);

        exchange.getResponseHeaders()
                .set(
                        "Content-Type",
                        contentType
                );

        exchange.sendResponseHeaders(
                200,
                data.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(data);
        }
    }

    static void handleRoute(
            HttpExchange exchange)
            throws IOException {

        String query =
                exchange.getRequestURI()
                        .getQuery();

        String failedNode = "";

        if (query != null) {

            String[] parameters =
                    query.split("&");

            for (String parameter :
                    parameters) {

                String[] pair =
                        parameter.split("=");

                if (pair.length == 2
                        && pair[0].equals("fail")) {

                    failedNode =
                            pair[1]
                                    .replace(
                                            "%20",
                                            " "
                                    )
                                    .replace(
                                            "+",
                                            " "
                                    );
                }
            }
        }

        int failedIndex =
                getNodeIndex(failedNode);

        RouteResult result =
                dijkstra(
                        0,
                        5,
                        failedIndex
                );

        String route =
                buildRoute(result.path);

        String json =
                "{"
                + "\"route\":\""
                + escapeJson(route)
                + "\","
                + "\"cost\":"
                + result.distance
                + ","
                + "\"failedNode\":\""
                + escapeJson(failedNode)
                + "\""
                + "}";

        sendJson(
                exchange,
                json
        );
    }

    static void handleNetwork(
            HttpExchange exchange)
            throws IOException {

        StringBuilder json =
                new StringBuilder();

        json.append("{");

        json.append("\"nodes\":[");

        for (int i = 0;
             i < nodes.length;
             i++) {

            if (i > 0) {
                json.append(",");
            }

            json.append("\"")
                    .append(
                            escapeJson(nodes[i])
                    )
                    .append("\"");
        }

        json.append("],");

        json.append("\"edges\":[");

        boolean first = true;

        for (int i = 0;
             i < graph.length;
             i++) {

            for (int j = i + 1;
                 j < graph[i].length;
                 j++) {

                if (graph[i][j] > 0) {

                    if (!first) {
                        json.append(",");
                    }

                    json.append("{");

                    json.append(
                            "\"from\":\""
                    );

                    json.append(
                            escapeJson(nodes[i])
                    );

                    json.append("\",");

                    json.append(
                            "\"to\":\""
                    );

                    json.append(
                            escapeJson(nodes[j])
                    );

                    json.append("\",");

                    json.append(
                            "\"cost\":"
                    );

                    json.append(
                            graph[i][j]
                    );

                    json.append("}");

                    first = false;
                }
            }
        }

        json.append("]");

        json.append("}");

        sendJson(
                exchange,
                json.toString()
        );
    }

    static RouteResult dijkstra(
            int source,
            int destination,
            int blockedNode) {

        int n =
                nodes.length;

        int[] distance =
                new int[n];

        int[] previous =
                new int[n];

        boolean[] visited =
                new boolean[n];

        Arrays.fill(
                distance,
                Integer.MAX_VALUE
        );

        Arrays.fill(
                previous,
                -1
        );

        if (source == blockedNode
                || destination == blockedNode) {

            return new RouteResult(
                    new ArrayList<>(),
                    -1
            );
        }

        distance[source] = 0;

        for (int count = 0;
             count < n;
             count++) {

            int current = -1;

            int bestDistance =
                    Integer.MAX_VALUE;

            for (int i = 0;
                 i < n;
                 i++) {

                if (!visited[i]
                        && i != blockedNode
                        && distance[i]
                        < bestDistance) {

                    bestDistance =
                            distance[i];

                    current = i;
                }
            }

            if (current == -1) {
                break;
            }

            visited[current] = true;

            for (int next = 0;
                 next < n;
                 next++) {

                if (graph[current][next] <= 0) {
                    continue;
                }

                if (next == blockedNode) {
                    continue;
                }

                if (distance[current] ==
                        Integer.MAX_VALUE) {
                    continue;
                }

                int newDistance =
                        distance[current]
                        + graph[current][next];

                if (newDistance <
                        distance[next]) {

                    distance[next] =
                            newDistance;

                    previous[next] =
                            current;
                }
            }
        }

        List<Integer> path =
                new ArrayList<>();

        if (distance[destination] ==
                Integer.MAX_VALUE) {

            return new RouteResult(
                    path,
                    -1
            );
        }

        int current =
                destination;

        while (current != -1) {

            path.add(current);

            current =
                    previous[current];
        }

        Collections.reverse(path);

        return new RouteResult(
                path,
                distance[destination]
        );
    }

    static String buildRoute(
            List<Integer> path) {

        if (path.isEmpty()) {
            return "No route available";
        }

        StringBuilder route =
                new StringBuilder();

        for (int i = 0;
             i < path.size();
             i++) {

            if (i > 0) {
                route.append(" -> ");
            }

            route.append(
                    nodes[path.get(i)]
            );
        }

        return route.toString();
    }

    static int getNodeIndex(
            String nodeName) {

        if (nodeName == null
                || nodeName.isEmpty()) {

            return -1;
        }

        for (int i = 0;
             i < nodes.length;
             i++) {

            if (nodes[i].equalsIgnoreCase(
                    nodeName)) {

                return i;
            }
        }

        return -1;
    }

    static String getContentType(
            String path) {

        if (path.endsWith(".html")) {
            return "text/html";
        }

        if (path.endsWith(".css")) {
            return "text/css";
        }

        if (path.endsWith(".js")) {
            return "application/javascript";
        }

        if (path.endsWith(".json")) {
            return "application/json";
        }

        return "text/plain";
    }

    static void sendJson(
            HttpExchange exchange,
            String json)
            throws IOException {

        exchange.getResponseHeaders()
                .set(
                        "Content-Type",
                        "application/json"
                );

        sendResponse(
                exchange,
                200,
                json
        );
    }

    static void sendResponse(
            HttpExchange exchange,
            int status,
            String response)
            throws IOException {

        byte[] data =
                response.getBytes(
                        StandardCharsets.UTF_8
                );

        exchange.sendResponseHeaders(
                status,
                data.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(data);
        }
    }

    static String escapeJson(
            String text) {

        if (text == null) {
            return "";
        }

        return text
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "\"",
                        "\\\""
                );
    }

    static class RouteResult {

        List<Integer> path;

        int distance;

        RouteResult(
                List<Integer> path,
                int distance) {

            this.path = path;

            this.distance = distance;
        }
    }
}