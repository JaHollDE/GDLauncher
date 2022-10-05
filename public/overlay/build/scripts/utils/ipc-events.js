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
    ipcMain.handle("is-dev-instance", (event) => {
        return application.config.config.isDevInstance;
    });
    ipcMain.handle("set-dev-instance", (event, state) => {
        application.config.config.isDevInstance = state;
        application.config.save();
        application.mainWindow.webContents.send("dev-instance-update", state);
    });
}
