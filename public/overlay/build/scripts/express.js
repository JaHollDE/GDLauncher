import * as express from "express";
import path from "path";
import * as tcpPortUsed from "tcp-port-used";
import { app } from "electron";
export class ExpressManager {
    application;
    app = express();
    server;
    port;
    constructor(application) {
        this.application = application;
    }
    async init() {
        const appData = app.getPath('appData');
        const p = path.join(appData, "gdlauncher_next", "jahollde_assets");
        this.app.get("/", (req, res) => {
            res.sendFile(path.join(p, "./index.html"));
        });
        this.app.use("/assets", express.static(path.join(p, "./assets")));
        this.app.use("/static", express.static(p));
        this.app.use((req, res) => {
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
    start() {
        return new Promise(resolve => {
            this.server = this.app.listen(this.port, () => {
                console.log("Started express app!");
                resolve(undefined);
            });
        });
    }
}
