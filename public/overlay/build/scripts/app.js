import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { initIPCEvents } from "./utils/ipc-events";
import { ConfigManager } from "./manager/config-manager";
export default class JaHollDEApplication {
    socket;
    express;
    //public window!: Window;
    config;
    mainWindow;
    async init(mainWindow) {
        this.config = new ConfigManager(this);
        this.socket = new SocketManager(this);
        await this.socket.init();
        this.express = new ExpressManager(this);
        //this.window = new Window(this);
        this.mainWindow = mainWindow;
        initIPCEvents(this);
        console.log("--- JaHollDE Electron-Setup finished ---");
    }
    getURL(withPrefix = true) {
        return (withPrefix ? "https://" : "") + (this.config.config.isDevInstance ? "https://devweb.jaholl.de" : "https://interface.jaholl.de");
    }
}
