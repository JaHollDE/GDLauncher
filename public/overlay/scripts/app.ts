import SocketManager from "./socket";
import { ExpressManager } from "./express";
import { Window } from "./window";
import { initIPCEvents } from "./utils/ipc-events";

export default class JaHollDEApplication {
  public socket!: SocketManager;
  public express!: ExpressManager;
  public window!: Window;

  public async init() {
    this.socket = new SocketManager(this);
    await this.socket.init();
    this.express = new ExpressManager(this);
    await this.express.init();
    this.express.start();
    this.window = new Window(this);

    initIPCEvents(this);
  }
}