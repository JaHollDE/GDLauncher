import { Server as WebSocketServer } from "ws";
import * as tcpPortUsed from "tcp-port-used";
import OnScreenUpdate from "./api/screen-update";
import ElectronEventTransmitter from "./api/electron-event";
import { ipcMain } from "electron";
import OnMcFocus from "./api/mc-focus";
import { Window } from "./window";
import EventEmitter from "./utils/event-emitter";
export class SocketInstance {
    instanceName;
    token;
    socketManager;
    webSocket;
    expressInstance;
    window;
    constructor(webSocket, instanceName, token, socketManager) {
        this.instanceName = instanceName;
        this.token = token;
        this.socketManager = socketManager;
        this.attach(webSocket);
        this.window = new Window(this.socketManager.app, this);
        this.socketManager.app.express.createServer(this.instanceName).then(async (server) => {
            this.expressInstance = server;
            await this.window.loadHomePage();
        });
        this.sendMessage(JSON.stringify({
            type: "jahollde_url",
            url: "wss://" + this.socketManager.app.getURL(false) + "/api/ws"
        }));
    }
    attach(webSocket) {
        webSocket.on("message", (msg) => {
            if (typeof msg !== "string") {
                try {
                    msg = new TextDecoder().decode(msg);
                }
                catch (err) {
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
                if (this.webSocket === undefined)
                    await this.destroy();
                else
                    await this.window.loadHomePage();
            }, 5000);
        });
        this.webSocket = webSocket;
    }
    onMessage(msg) {
        let content = undefined;
        try {
            content = JSON.parse(msg);
        }
        catch (exception) {
            console.warn(exception, msg);
            return;
        }
        this.onJSONMessage(content);
    }
    onJSONMessage(message) {
        const type = message.type;
        this.socketManager.events.forEach(event => {
            if (event.name === type) {
                event.run(message, this);
            }
        });
    }
    async destroy(closeConnection = false) {
        await this.window.deleteHomePage();
        this.expressInstance?.stop();
        this.socketManager.removeWebSocket(this.instanceName);
        if (closeConnection)
            this.webSocket?.close(1000);
    }
    sendMessage(message, query = true) {
        this.webSocket?.send(message);
    }
}
export default class SocketManager {
    app;
    port;
    onUpdate = new EventEmitter();
    webSocketServer;
    webSockets = {};
    events = [];
    queue = [];
    constructor(app) {
        this.app = app;
        this.events.push(new OnScreenUpdate(this.app), new ElectronEventTransmitter(this.app), new OnMcFocus(this.app));
        this.onUpdate.subscribe((data) => {
            this.app.mainWindow?.webContents?.send("connected-instances-update", data);
        });
        ipcMain.handle("reload-connected-instances", () => {
            this.app.mainWindow?.webContents?.send("connected-instances-update", Object.keys(this.webSockets));
        });
    }
    removeWebSocket(instanceName) {
        delete this.webSockets[instanceName];
        console.log("Removed instance: ", instanceName);
        this.onUpdate.emit(Object.keys(this.webSockets));
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
            console.log("WebSocket connection open.");
            this.queue.forEach(l => {
                if (webSocket.readyState !== webSocket.OPEN)
                    return;
                webSocket.send(l);
            });
            //this.updateWindow();
            webSocket.on("message", (msg) => {
                if (typeof msg !== "string") {
                    try {
                        msg = new TextDecoder().decode(msg);
                    }
                    catch (err) {
                        console.warn(err);
                        return;
                    }
                }
                msg = JSON.parse(msg);
                if (msg.type === "register-instance-name") {
                    const instanceName = msg.instanceName;
                    const token = msg.token;
                    console.log("Received instance name: ", instanceName);
                    if (this.webSockets[instanceName] !== undefined) {
                        this.webSockets[instanceName].attach(webSocket);
                        return;
                    }
                    this.webSockets[instanceName] = new SocketInstance(webSocket, instanceName, token, this);
                    this.onUpdate.emit(Object.keys(this.webSockets));
                }
            });
        });
    }
    registerEvent(event) {
        this.events.push(event);
    }
    removeEvent(event) {
        this.events = this.events.filter(ev => ev.name !== event);
    }
    getInstanceBySender(sender) {
        for (const val of Object.values(this.webSockets)) {
            if (val.window?.window?.webContents === sender)
                return val;
        }
        return undefined;
    }
    getInstanceByName(instanceName) {
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
    sendMessageToSender(message, sender) {
        this.getInstanceBySender(sender)?.sendMessage(message);
    }
    sendMessageToInstanceName(message, instance) {
        this.getInstanceByName(instance)?.sendMessage(message);
    }
    getAllInstances() {
        return Object.values(this.webSockets);
    }
}
