import { Server as WebSocketServer } from "ws";
import * as tcpPortUsed from "tcp-port-used";
import OnScreenUpdate from "./api/screen-update";
export default class SocketManager {
    app;
    port;
    webSocketServer;
    webSockets = [];
    events = [];
    queue = [];
    constructor(app) {
        this.app = app;
        this.events.push(new OnScreenUpdate(this.app));
    }
    async init() {
        let port = 5050;
        let used = true;
        while (used) {
            port++;
            used = await tcpPortUsed.check(port, "127.0.0.1");
        }
        this.port = port;
        this.webSocketServer = new WebSocketServer({ port: this.port });
        this.initWebSocketServer();
    }
    initWebSocketServer() {
        this.webSocketServer.on("connection", (webSocket) => {
            this.webSockets.push(webSocket);
            console.log("WebSocket connection open.");
            this.queue.forEach(l => {
                if (webSocket.readyState !== webSocket.OPEN)
                    return;
                webSocket.send(l);
            });
            this.updateWindow();
            webSocket.on("message", (msg) => {
                if (typeof msg !== "string") {
                    try {
                        msg = new TextDecoder().decode(msg);
                    }
                    catch (err) {
                        console.warn(err);
                    }
                }
                this.onMessage(msg);
            });
            webSocket.on("close", () => {
                this.webSockets = this.webSockets.filter(l => l !== webSocket);
                console.log("Websocket connection closed.");
                this.updateWindow();
            });
        });
    }
    registerEvent(event) {
        this.events.push(event);
    }
    async updateWindow() {
        if (this.webSockets.length === 0) {
            await this.app.window.hideHomePage();
            // check if websockets are empty after 5 seconds, then quit
            setTimeout(async () => {
                if (this.webSockets.length === 0) {
                    await this.app.window.deleteHomePage();
                }
            }, 5000);
        }
    }
    sendMessage(message, query = true) {
        if (query)
            this.queue.push(message);
        this.webSockets.forEach(webSocket => webSocket.send(message));
    }
    onMessage(msg) {
        let content = undefined;
        try {
            content = JSON.parse(msg);
        }
        catch (exception) {
            console.warn(exception);
            return;
        }
        this.onJSONMessage(content);
    }
    onJSONMessage(message) {
        const type = message.type;
        this.events.forEach(event => {
            if (event.name === type) {
                event.run(message);
            }
        });
    }
}
