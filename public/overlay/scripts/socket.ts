import * as WebSocket from "ws";
import { Server as WebSocketServer } from "ws";
import * as tcpPortUsed from "tcp-port-used";


import ElectronEvent from "./electron-event";
import JaHollDEApplication from "./app";
import OnScreenUpdate from "./api/screen-update";
import ElectronEventTransmitter from "./api/electron-event";
import { WebContents } from "electron";
import OnMcFocus from "./api/mc-focus";
import { ExpressInstance } from "./express";
import { Window } from "./window";

export class SocketInstance {
    private webSocket?: WebSocket;
    public expressInstance?: ExpressInstance;
    public window?: Window;

    constructor(
      webSocket: WebSocket,
      private readonly instanceName: string,
      private socketManager: SocketManager
    ) {
        this.attach(webSocket);
        this.window = new Window(this.socketManager.app, this);

        this.socketManager.app.express.createServer(this.instanceName).then(async server => {
            this.expressInstance = server;
            await this.window.loadHomePage();
        });

        this.sendMessage(JSON.stringify({
            type: "jahollde_url",
            url: "wss://" + this.socketManager.app.getURL(false) + "/api/ws"
        }));
    }

    public attach(webSocket: WebSocket) {
        webSocket.on("message", (msg: any) => {
            if (typeof msg !== "string") {
                try {
                    msg = new TextDecoder().decode(<any>msg);
                } catch (err) {
                    console.warn(err);
                    return;
                }
            }
            this.onMessage(msg);
        });

        webSocket.on("close", async () => {
            this.webSocket = undefined;
            await this.window.hideHomePage();
            setTimeout(async () => {
                if (this.webSocket === undefined) await this.destroy();
                else await this.window.loadHomePage();
            }, 5000);
        });

        this.webSocket = webSocket;
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

        this.socketManager.events.forEach(event => {
            if (event.name === type) {
                event.run(message, this);
            }
        });
    }

    public async destroy(): Promise<void> {
        await this.window.deleteHomePage();
        this.expressInstance?.stop()
        this.socketManager.removeWebSocket(this.instanceName);
    }

    public sendMessage(message: string, query: boolean = true) {
        this.webSocket?.send(message);
    }
}

export default class SocketManager {
    public port!: number;

    private webSocketServer!: WebSocketServer;

    private webSockets: {[key: string]: SocketInstance} = {};

    public events: ElectronEvent[] = [];

    private readonly queue: string[] = [];

    constructor(public app: JaHollDEApplication) {
        this.events.push(
            new OnScreenUpdate(this.app),
            new ElectronEventTransmitter(this.app),
            new OnMcFocus(this.app)
        );
    }

    public removeWebSocket(instanceName: string) {
        delete this.webSockets[instanceName];
        console.log("Removed instance: ", instanceName);
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
            console.log("WebSocket connection open.");

            this.queue.forEach(l => {
                if (webSocket.readyState !== webSocket.OPEN) return;
                webSocket.send(l);
            });



            //this.updateWindow();

            webSocket.on("message", (msg: any) => {
                if (typeof msg !== "string") {
                    try {
                        msg = new TextDecoder().decode(<any>msg);
                    } catch (err) {
                        console.warn(err);
                        return;
                    }
                }
                msg = JSON.parse(msg);
                console.log("Received: ", msg);
                if (msg.type === "register-instance-name") {
                    const instanceName: string = msg.instanceName;
                    console.log("Received instance name: ", instanceName);

                    if (this.webSockets[instanceName] !== undefined) {
                        this.webSockets[instanceName].attach(webSocket);
                        return;
                    }
                    this.webSockets[instanceName] = new SocketInstance(webSocket, instanceName, this);
                }
            });

        });
    }

    public registerEvent(event: ElectronEvent): void {
        this.events.push(event);
    }
    public removeEvent(event: string): void {
        this.events = this.events.filter(ev => ev.name !== event);
    }

    public getInstanceBySender(sender: WebContents): SocketInstance | undefined {
        for (const val of Object.values(this.webSockets)) {
            if (val.window?.window?.webContents === sender) return val;
        }
        return undefined;
    }
    public getInstanceByName(instanceName: string): SocketInstance | undefined {
        return this.webSockets[instanceName];
    }

    /*
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
        } else {
            await this.app.window.loadHomePage();
        }
    }*/


    public sendMessageToSender(message: string, sender: WebContents) {
        this.getInstanceBySender(sender)?.sendMessage(message);
    }


    public getAllInstances(): SocketInstance[] {
        return Object.values(this.webSockets);
    }
}
