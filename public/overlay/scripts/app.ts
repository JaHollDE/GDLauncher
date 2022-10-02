import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { Window } from "./window";
import { initIPCEvents } from "./utils/ipc-events";
import {ConfigManager} from "./manager/config-manager";
import {BrowserWindow} from "electron";

export default class JaHollDEApplication {
  public socket!: SocketManager;
  public express!: ExpressManager;
  public window!: Window;
  public config!: ConfigManager;
  public mainWindow!: BrowserWindow;

  public async init(mainWindow: BrowserWindow) {
    this.config = new ConfigManager(this);
    this.socket = new SocketManager(this);
    await this.socket.init();
    this.express = new ExpressManager(this);
    await this.express.init();
    await this.express.start();
    this.window = new Window(this);

    this.mainWindow = mainWindow;

    initIPCEvents(this);

    console.log("--- JaHollDE Electron-Setup finished ---")
  }
}