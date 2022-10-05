import * as WebSocket from "ws";
import { Server as WebSocketServer } from "ws";
import * as tcpPortUsed from "tcp-port-used";


import ElectronEvent from "./electron-event";
import JaHollDEApplication from "./app";
import OnScreenUpdate from "./api/screen-update";
import ElectronEventTransmitter from "./api/electron-event";
import { ipcMain } from "electron";
import OnMcFocus from "./api/mc-focus";

export default class SocketManager {
    public port!: number;

    private webSocketServer!: WebSocketServer;

    private webSockets: WebSocket[] = [];
    private readonly events: ElectronEvent[] = [];

    private readonly queue: string[] = [];

    constructor(private app: JaHollDEApplication) {
        this.events.push(
            new OnScreenUpdate(this.app),
            new ElectronEventTransmitter(this.app),
            new OnMcFocus(this.app)
        );
    }

    public async init(): Promise<void> {
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

    private initWebSocketServer(): void {
        this.webSocketServer.on("connection", (webSocket: WebSocket) => {
            this.webSockets.push(webSocket);

            console.log("WebSocket connection open.");

            this.queue.forEach(l => {
                if (webSocket.readyState !== webSocket.OPEN) return;
                webSocket.send(l);
            });

            this.sendMessage(JSON.stringify({
                type: "jahollde_url",
                url: "wss://" + this.app.getURL(false) + "/api/ws"
            }));

            this.updateWindow();

            webSocket.on("message", (msg: any) => {
                if (typeof msg !== "string") {
                    try {
                        msg = new TextDecoder().decode(<any>msg);
                    } catch (err) {
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

    public registerEvent(event: ElectronEvent): void {
        this.events.push(event);
    }

    public async updateWindow(): Promise<void> {
        this.app.mainWindow.webContents.send("overlay-connected", this.webSockets.length !== 0);
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

    public sendMessage(message: string, query: boolean = true) {
        if (query) this.queue.push(message);
        this.webSockets.forEach(webSocket => webSocket.send(message));
    }

    private onMessage(msg: string): void {
        console.log(msg);
        let content: { [key: string]: any } | undefined = undefined;
        try {
            content = JSON.parse(msg);
        } catch (exception) {
            console.warn(exception, msg);
            return;
        }
        this.onJSONMessage(content);
    }

    private onJSONMessage(message: any): void {
        const type: string = message.type;

        this.events.forEach(event => {
            if (event.name === type) {
                event.run(message);
            }
        });
    }
}
