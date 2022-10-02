import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { Window } from "./window";
import { initIPCEvents } from "./utils/ipc-events";
export default class JaHollDEApplication {
    socket;
    express;
    window;
    async init() {
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
