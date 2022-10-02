import * as express from "express";
import http from "http";
import path from "path";
import JaHollDEApplication from "./app";
import * as tcpPortUsed from "tcp-port-used";
import { app } from "electron";

export class ExpressManager {
  private app: express.Express = express();
  private server?: http.Server;
  public port!: number;

  constructor(private application: JaHollDEApplication) {}

  public async init(): Promise<void> {
    const appData: string = app.getPath('appData');
    const p = path.join(appData, "gdlauncher_next", "jahollde_assets");

    this.app.get("/", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(p, "./index.html"));
    });
    this.app.use("/assets", express.static(path.join(p, "./assets")));
    this.app.use("/static", express.static(p));

    this.app.use((req: express.Request, res: express.Response) => {
      res.sendFile(path.join(p, "./index.html"));
    });

    let port = 5050;
    let used = true;
    while (used) {
      port++;
      used = await tcpPortUsed.check(port, "127.0.0.1");
    }
    this.port = port;
  }

  public start(): void {
    this.server = this.app.listen(this.port, () => {
      console.log("Started express app!");
    });
  }
}