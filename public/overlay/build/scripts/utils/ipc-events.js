import { ipcMain } from "electron";
export function initIPCEvents(application) {
    let token = undefined, jaholldeData = undefined, callback = undefined;
    ipcMain.handle("jahollde-data", (event, t, j) => {
        token = t;
        jaholldeData = j;
        callback?.();
    });
    ipcMain.handle("get-jahollde-token", (event) => {
        return new Promise(resolve => {
            if (token)
                resolve(token);
            callback = () => resolve(token);
        });
    });
    ipcMain.handle("get-jahollde-port", (event) => {
        return application.socket.port;
    });
    ipcMain.handle("trigger-device", (event, state) => {
        state ? application.window.enableMouseEvents() : application.window.disableMouseEvents();
    });
    ipcMain.handle("transmit-mod", (event, data) => {
        application.socket.sendMessage(JSON.stringify(data));
    });
    ipcMain.handle("restart-electron", (event) => {
        application.window.restart();
    });
    let cb;
    ipcMain.handle("update-texture-pack", async (event) => {
        const promise = new Promise((resolve) => {
            cb = () => resolve(undefined);
        });
        application.mainWindow.webContents.send("check-for-texturepack-updates");
        await promise;
    });
    ipcMain.handle("reload-data", async (event, texturepackUpdated, assetsUpdated) => {
        if (assetsUpdated) {
            await application.express.restart();
            await application.window.restart();
        }
        if (texturepackUpdated) {
            application.socket.sendMessage(JSON.stringify({
                type: "reload-assets"
            }));
        }
        cb?.();
        console.log("RELOAD!");
    });
    /*
    ipcMain.handle("toggle-dev-instance-name", (event) => {
        let index = application.config.config.instances.findIndex(n => n === application.config.config.instanceName);
        if (index >= application.config.config.instances.length) index = 0;
        application.config.config.instanceName = application.config.config.instances[index];
        application.config.save();
        application.mainWindow.webContents.send("dev-instance-name-update", application.config.config.instanceName);
        return application.config.config.instanceName;
    });*/
    /*
    ipcMain.handle("get-dev-instance-names", (event) => {
        return {
            prod: application.config.config.instances,
            dev: application.config.config.devInstances
        };
    });*/
}
