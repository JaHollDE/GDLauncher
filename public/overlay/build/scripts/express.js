import * as express from "express";
import path from "path";
import * as tcpPortUsed from "tcp-port-used";
import { app } from "electron";
export class ExpressInstance {
    port;
    app;
    server;
    constructor(port, app) {
        this.port = port;
        this.app = app;
    }
    start() {
        return new Promise(resolve => {
            this.server = this.app.listen(this.port, () => {
                console.log("Started express app!");
                resolve(this.server);
            });
        });
    }
    stop() {
        this.server?.close();
    }
    async restart() {
        this.server?.close();
        await this.start();
    }
}
export class ExpressManager {
    application;
    expressServers = {};
    constructor(application) {
        this.application = application;
    }
    async createServer(instanceName) {
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
        const app = express();
        await this.init(app, instanceName);
        const instance = new ExpressInstance(port, app);
        await instance.start();
        this.expressServers[instanceName] = instance;
        return instance;
    }
    async init(expressApp, instanceName) {
        const appData = app.getPath('appData');
        const p = path.join(appData, "gdlauncher_next", "instances", instanceName, "jahollde_assets");
        expressApp.get("/", (req, res) => {
            res.sendFile(path.join(p, "./index.html"));
        });
        expressApp.use("/assets", express.static(path.join(p, "./assets")));
        expressApp.use("/static", express.static(p));
        expressApp.use((req, res) => {
            res.sendFile(path.join(p, "./index.html"));
        });
    }
}
