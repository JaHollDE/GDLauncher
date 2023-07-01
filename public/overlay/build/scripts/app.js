import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { initIPCEvents } from "./utils/ipc-events";
import { ConfigManager } from "./manager/config-manager";
import LogManager from "./manager/log-manager";
import { TrayManager } from "./tray";
export default class JaHollDEApplication {
    socket;
    express;
    //public window!: Window;
    config;
    mainWindow;
    log;
    tray;
    async init(mainWindow) {
        this.config = new ConfigManager(this);
        this.socket = new SocketManager(this);
        this.express = new ExpressManager(this);
        this.log = new LogManager(this);
        //this.window = new Window(this);
        this.mainWindow = mainWindow;
        this.tray = new TrayManager(this);
        initIPCEvents(this);
        await this.socket.init();
        console.log("--- JaHollDE Electron-Setup finished ---");
    }
    getURL(withPrefix = true) {
        return (withPrefix ? "https://" : "") + (this.config.config.isDevInstance ? "https://devweb.jaholl.de" : "https://interface.jaholl.de");
    }
}
