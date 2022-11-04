import * as express from "express";
import http from "http";
import path from "path";
import JaHollDEApplication from "./app";
import * as tcpPortUsed from "tcp-port-used";
import { app } from "electron";
import EventEmitter from "./utils/event-emitter";

export class ExpressInstance {
  private server: http.Server;

  constructor(
    public readonly port: number,
    public readonly app: express.Express
  ) { }

  public start(): Promise<http.Server> {
    return new Promise(resolve => {
      this.server = this.app.listen(this.port, () => {
        console.log("Started express app!");
        resolve(this.server);
      });
    });
  }

  public stop(): void {
    this.server?.close();
  }

  public async restart(): Promise<void> {
    this.server?.close();
    await this.start();
  }
}

export class ExpressManager {
  private expressServers: {[key: string]: ExpressInstance} = {};

  constructor(private application: JaHollDEApplication) {}

  public async createServer(instanceName: string): Promise<ExpressInstance> {
    if (this.expressServers[instanceName] !== undefined) {
      this.expressServers[instanceName].stop();
      delete this.expressServers[instanceName];
    }

    let port = 5050;
    let used = true;
    while (used) {
      port++;
      used = await tcpPortUsed.check(port, "127.0.0.1");
    }

    const app: express.Express = express();

    await this.init(app, instanceName);

    const instance = new ExpressInstance(port, app);
    await instance.start();

    this.expressServers[instanceName] = instance;

    return instance;
  }

  public async init(expressApp: express.Express, instanceName: string): Promise<void> {
    const appData: string = app.getPath('userData');
    const p = path.join(appData, "instances", instanceName, "jahollde_assets");

    expressApp.get("/", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(p, "./index.html"));
    });
    expressApp.use("/assets", express.static(path.join(p, "./assets")));
    expressApp.use("/static", express.static(p));

    expressApp.use((req: express.Request, res: express.Response) => {
      res.sendFile(path.join(p, "./index.html"));
    });


  }
}