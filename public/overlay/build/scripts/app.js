import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { Window } from "./window";
import { initIPCEvents } from "./utils/ipc-events";
import { ConfigManager } from "./manager/config-manager";
export default class JaHollDEApplication {
    socket;
    express;
    window;
    config;
    async init() {
        this.config = new ConfigManager(this);
        this.socket = new SocketManager(this);
        await this.socket.init();
        this.express = new ExpressManager(this);
        await this.express.init();
        await this.express.start();
        this.window = new Window(this);
        initIPCEvents(this);
        console.log("--- JaHollDE Electron-Setup finished ---");
    }
}
