import { screen } from "electron";
import { createWindow } from "./utils/create-window";
export class Window {
    application;
    socketInstance;
    window = undefined;
    siteActive = false;
    size = [0, 0];
    pos = [0, 0];
    onReady = [];
    mcFocused = false;
    mcIconified = false;
    mouseEventsEnabled = true;
    windowHidden = false;
    constructor(application, socketInstance) {
        this.application = application;
        this.socketInstance = socketInstance;
    }
    updateMCFocusedState(focused, iconified) {
        this.mcFocused = focused;
        this.mcIconified = iconified;
        this.updateShowState();
    }
    updateShowState(focused) {
        if (focused === undefined)
            focused = this.window?.isFocused();
        const alwaysOnTop = this.mcFocused || focused;
        const showWindow = !this.mcIconified && !this.windowHidden;
        console.log("[WARN] Window hidden:", this.windowHidden);
        this.application.mainWindow.webContents.send("overlay-shown", {
            alwaysOnTop: alwaysOnTop,
            showWindow: showWindow
        });
        if (showWindow) {
            this.window?.showInactive();
        }
        else {
            this.window?.hide();
        }
        if (alwaysOnTop) {
            this.window?.setAlwaysOnTop(true, "screen-saver");
        }
        else {
            this.window?.setAlwaysOnTop(false);
        }
    }
    getWindow() {
        return new Promise(resolve => {
            if (this.window !== undefined) {
                resolve(this.window);
                return;
            }
            this.onReady.push(() => resolve(this.window));
        });
    }
    async restart() {
        if (this.window === undefined)
            return;
        await this.deleteHomePage();
        await this.loadHomePage();
        this.mouseEventsEnabled ? this.enableMouseEvents() : this.disableMouseEvents();
        this.window?.setMinimumSize(...this.size);
        this.window?.setSize(...this.size);
        this.window?.setPosition(...this.pos);
    }
    enableMouseEvents() {
        this.window?.setIgnoreMouseEvents(false);
        this.window?.focus();
        this.socketInstance.sendMessage("enable mouse events");
        this.mouseEventsEnabled = true;
    }
    disableMouseEvents() {
        this.window?.setIgnoreMouseEvents(true);
        this.window?.blur();
        this.window?.blurWebView();
        this.socketInstance.sendMessage("disable mouse events");
        this.mouseEventsEnabled = false;
    }
    async loadHomePage() {
        this.setWindowHidden(false);
        if (this.window !== undefined) {
            this.window.showInactive();
            return;
        }
        this.mcIconified = false;
        this.setWindowHidden(false);
        this.window = await createWindow();
        this.window.setMinimumSize(...this.size);
        this.window.setSize(...this.size);
        this.window.setPosition(...this.pos);
        const website = this.application.getURL() + "/overlay";
        const debug = false;
        if (debug) {
            this.window?.hide();
            await this.window?.loadURL(website);
            this.window?.showInactive();
            this.siteActive = true;
            this.disableMouseEvents();
            this.sendReadyState();
        }
        else {
            this.window
                .getBrowserViews()
                .forEach((obj) => this.window?.removeBrowserView(obj));
            this.window?.hide();
            console.log("Loading JaHollDE-Page...");
            await this.window?.loadURL(`http://127.0.0.1:${this.socketInstance.expressInstance.port}/overlay`);
            console.log("Loaded JaHolLDE-Page!");
            this.window?.showInactive();
            this.window?.setAlwaysOnTop(true, "screen-saver");
            this.siteActive = true;
            this.disableMouseEvents();
            this.sendReadyState();
            console.log("loaded window");
            this.setWindowHidden(false);
            this.window.on("focus", () => this.updateShowState(true));
            this.window.on("blur", () => this.updateShowState(false));
            this.onReady = this.onReady.filter(l => {
                l();
                return false;
            });
        }
    }
    setWindowHidden(state) {
        this.windowHidden = state;
        this.updateShowState();
    }
    async hideHomePage() {
        if (this.window.isDestroyed())
            return;
        this.window.hide();
        this.setWindowHidden(true);
    }
    async deleteHomePage() {
        if (this.window === undefined)
            return;
        this.pos = [0, 0];
        this.size = [0, 0];
        if (!this.window.isDestroyed()) {
            this.window.hide();
            this.window.destroy();
        }
        this.window = undefined;
        //this.setWindowHidden(true);
        console.log("deleted window");
    }
    sendReadyState() {
        this.socketInstance.sendMessage(JSON.stringify({
            type: "ready",
        }));
    }
    setGeometry(width, height, x, y) {
        const scaling = screen.getPrimaryDisplay().scaleFactor;
        width /= scaling;
        height /= scaling;
        x /= scaling;
        y /= scaling;
        const showWindow = this.size[0] === 0 || this.size[1] === 0 || this.pos[0] === 0 || this.pos[1] === 0;
        this.size = [width, height];
        this.pos = [x, y];
        if (this.window?.isDestroyed())
            return;
        this.window?.setMinimumSize(width, height);
        this.window?.setSize(width, height);
        this.window?.setPosition(x, y);
        if (showWindow && !this.windowHidden)
            this.loadHomePage();
    }
}
