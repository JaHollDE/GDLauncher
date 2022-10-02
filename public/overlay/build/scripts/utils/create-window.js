import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
export async function createWindow() {
    const options = {
        title: app.name,
        titleBarStyle: "customButtonsOnHover",
        backgroundColor: "#00000000",
        acceptFirstMouse: true,
        alwaysOnTop: true,
        frame: false,
        hasShadow: false,
        closable: true,
        fullscreenable: false,
        maximizable: false,
        minimizable: false,
        resizable: false,
        skipTaskbar: false,
        transparent: true,
        useContentSize: true,
        show: false,
        width: 800,
        height: 600,
        minWidth: 0,
        minHeight: 0,
        webPreferences: {
            //contextIsolation: !is.linux,
            contextIsolation: false,
            //enableRemoteModule: true,
            nodeIntegration: true,
            //preload: path.join(__dirname, "./preload.js"),
        },
    };
    if (is.windows)
        options.type = "toolbar";
    const win = new BrowserWindow(options);
    is.macos ? app.dock.hide() : undefined;
    win.setFullScreenable(false);
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    is.macos ? app.dock.show() : undefined;
    win.setMenu(null);
    win.webContents.openDevTools();
    return win;
}
