import { screen } from "electron";
import { createWindow } from "./utils/create-window";
import { getURL } from "./utils/url";
export class Window {
    application;
    window = undefined;
    siteActive = false;
    size = [0, 0];
    pos = [0, 0];
    constructor(application) {
        this.application = application;
    }
    enableMouseEvents() {
        /*
        if (!this.siteActive) return;
        if (this.mouseEventsOn) return;
        this.mouseEventsOn = true;*/
        this.window?.setIgnoreMouseEvents(false);
        this.window?.focus();
        this.application.socket.sendMessage("enable mouse events");
    }
    disableMouseEvents() {
        /*
        if (!this.siteActive) return;
        if (!this.mouseEventsOn) return;
        this.mouseEventsOn = false;*/
        this.window?.setIgnoreMouseEvents(true);
        this.window?.blur();
        this.window?.blurWebView();
        this.application.socket.sendMessage("disable mouse events");
    }
    async loadHomePage() {
        if (this.window !== undefined) {
            this.window.showInactive();
            return;
        }
        this.window = await createWindow();
        this.window.setMinimumSize(...this.size);
        this.window.setSize(...this.size);
        this.window.setPosition(...this.pos);
        const website = (await getURL()) + "/overlay";
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
            await this.window?.loadURL(`http://127.0.0.1:${this.application.express.port}/overlay`);
            this.window?.showInactive();
            this.window?.setAlwaysOnTop(true, "screen-saver");
            this.siteActive = true;
            //this.disableMouseEvents();
            this.sendReadyState();
            console.log("loaded window");
        }
    }
    async hideHomePage() {
        if (this.window.isDestroyed())
            return;
        this.window.hide();
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
        console.log("deleted window");
    }
    sendReadyState() {
        this.application.socket.sendMessage(JSON.stringify({
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
        if (showWindow)
            this.loadHomePage();
    }
}
