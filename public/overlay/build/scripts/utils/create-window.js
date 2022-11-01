import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
export async function createWindow(showTaskbar) {
    const options = {
        title: app.name,
        titleBarStyle: "customButtonsOnHover",
        backgroundColor: "#00000000",
        acceptFirstMouse: true,
        alwaysOnTop: false,
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
            contextIsolation: false,
            nodeIntegration: true,
        },
    };
    if (!showTaskbar && is.windows)
        options.type = "toolbar";
    const win = new BrowserWindow(options);
    is.macos ? app.dock.hide() : undefined;
    win.setFullScreenable(false);
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    is.macos ? app.dock.show() : undefined;
    win.setMenu(null);
    return win;
}
