import { BrowserWindow, screen } from "electron";
import { createWindow } from "./utils/create-window";
import JaHollDEApplication from "./app";
import { SocketInstance } from "./socket";

export class Window {
    public window?: BrowserWindow = undefined;
    private siteActive = false;

    private size: [number, number] = [0, 0];
    private pos: [number, number] = [0, 0];

    private onReady: (() => void)[] = [];

    private mcFocused = false;
    private mcIconified = false;

    private mouseEventsEnabled: boolean = true;
    private windowHidden = false;

    constructor(private application: JaHollDEApplication, private socketInstance: SocketInstance) {
    }

    public updateMCFocusedState(focused: boolean, iconified: boolean): void {
        this.mcFocused = focused;
        this.mcIconified = iconified;

        this.updateShowState();
    }

    private updateShowState(focused?: boolean): void {
        if (this.window === undefined || this.window.isDestroyed()) return;
        if (focused === undefined) focused = this.window?.isFocused();
        const alwaysOnTop = this.mcFocused || focused;
        const showWindow = !this.mcIconified && !this.windowHidden;

        this.application.mainWindow.webContents.send("overlay-shown", {
            alwaysOnTop: alwaysOnTop,
            showWindow: showWindow
        });

        if (showWindow) {
            this.window?.showInactive();
        } else {
            this.window?.hide();
        }
        if (alwaysOnTop) {
            this.window?.setAlwaysOnTop(true, "screen-saver");
        } else {
            this.window?.setAlwaysOnTop(false);
        }
    }

    public getWindow(): Promise<BrowserWindow> {
        return new Promise(resolve => {
            if (this.window !== undefined) {
                resolve(this.window);
                return;
            }
            this.onReady.push(() => resolve(this.window));
        });
    }

    public async restart(): Promise<void> {
        if (this.window === undefined) return;
        await this.window?.reload();
    }

    public enableMouseEvents(): void {
        this.window?.setIgnoreMouseEvents(false);
        this.window?.focus();

        this.socketInstance.sendMessage("enable mouse events");

        this.mouseEventsEnabled = true;
    }
    public disableMouseEvents(): void {
        this.window?.setIgnoreMouseEvents(true);
        this.window?.blur();
        this.window?.blurWebView();

        this.socketInstance.sendMessage("disable mouse events");

        this.mouseEventsEnabled = false;
    }

    public async loadHomePage(): Promise<void> {
        if (this.socketInstance.expressInstance === undefined) return;

        this.setWindowHidden(false);
        if (this.window !== undefined) {
            this.window.showInactive();
            return;
        }

        this.mcIconified = false;
        this.setWindowHidden(false);

        this.window = await createWindow(this.application.config.config.showTaskbar);

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
        } else {
            this.window
                .getBrowserViews()
                .forEach((obj) => this.window?.removeBrowserView(obj));
            this.window?.hide();
            console.log("Loading JaHollDE-Page...");
            await this.window?.loadURL(
                `http://127.0.0.1:${this.socketInstance.expressInstance.port}/overlay`
            );
            console.log("Loaded JaHolLDE-Page!");
            this.window?.showInactive();
            this.window?.setAlwaysOnTop(true, "screen-saver");
            this.siteActive = true;
            this.disableMouseEvents();
            this.sendReadyState();

            this.windowHidden = false;

            console.log("loaded window");

            this.window.on("focus", () => this.updateShowState(true));
            this.window.on("blur", () => this.updateShowState(false));

            this.window?.moveTop();

            this.onReady = this.onReady.filter(l => {
                l();
                return false;
            });
        }
    }

    private setWindowHidden(state: boolean) {
        this.windowHidden = state;
        this.updateShowState();
    }

    public async hideHomePage() {
        if (this.window.isDestroyed()) return;
        this.window.hide();
        this.setWindowHidden(true);
    }

    public async deleteHomePage() {
        if (this.window === undefined) return;
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

    private sendReadyState() {
        this.socketInstance.sendMessage(
            JSON.stringify({
                type: "ready",
            })
        );
    }

    public setGeometry(width: number, height: number, x: number, y: number): void {
        const scaling = screen.getPrimaryDisplay().scaleFactor;

        width = Math.round(width / scaling);
        height = Math.round(height / scaling);
        x = Math.round(x / scaling);
        y = Math.round(y / scaling);

        const showWindow = this.size[0] === 0 || this.size[1] === 0 || this.pos[0] === 0 || this.pos[1] === 0;

        this.size = [width, height];
        this.pos = [x, y];

        if (this.window?.isDestroyed()) return;

        this.window?.setMinimumSize(width, height);
        this.window?.setSize(width, height);
        this.window?.setPosition(x, y);

        if (showWindow && !this.windowHidden) this.loadHomePage();
    }
}
