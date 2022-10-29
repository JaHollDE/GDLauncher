import JaHollDEApplication from "../app";
import { ipcMain } from "electron";

export function initIPCEvents(application: JaHollDEApplication): void {
    let token = undefined, jaholldeData = undefined, callback = undefined;
    ipcMain.handle("jahollde-data", (event, t: string, j: any) => {
        token = t;
        jaholldeData = j;
        callback?.();
    });
    ipcMain.handle("get-jahollde-token", (event) => {
        return new Promise(resolve => {
            if (token) resolve(token);
            callback = () => resolve(token);
        })
    });

    ipcMain.handle("get-jahollde-port", (event) => {
        return application.socket.port;
    });

    ipcMain.handle("trigger-device", (event, state: boolean) => {
        const window = application.socket.getInstanceBySender(event.sender)?.window;
        state ? window?.enableMouseEvents() : window?.disableMouseEvents();
    });

    ipcMain.handle("transmit-mod", (event, data) => {
        application.socket.sendMessageToSender(JSON.stringify(data), event.sender);
    });

    ipcMain.handle("restart-electron", (event, instanceName) => {
        return application.socket.getInstanceBySender(event.sender)?.window?.restart();
    });

    let cb: (() => void) | undefined;
    ipcMain.handle("update-texture-pack", async (event) => {
        const promise = new Promise((resolve) => {
            cb = () => resolve(undefined);
        });
        application.mainWindow.webContents.send("check-for-texturepack-updates");
        await promise;
    });

    ipcMain.handle("reload-data", async (event, texturepackUpdated, assetsUpdated, instanceName: string) => {
        if (assetsUpdated) {
            const instance = application.socket.getInstanceByName(instanceName);

            await instance?.expressInstance?.restart();
            await instance?.window?.restart();
        }
        if (texturepackUpdated) {
            application.socket.sendMessageToSender(JSON.stringify({
                type: "reload-assets"
            }), event.sender);
        }
        cb?.();
    });

    ipcMain.handle("get-mod-version", (event) => {
        application.socket.sendMessageToSender(JSON.stringify({
            type: "get-mod-version"
        }), event.sender);
        return new Promise(resolve => {
            application.socket.registerEvent({
                name: "get-mod-version",
                run: (message) => {
                    application.socket.removeEvent("get-mod-version");
                    resolve(message.version);
                }
            })
        });
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
