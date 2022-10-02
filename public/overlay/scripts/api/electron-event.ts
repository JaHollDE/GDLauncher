import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";
import {ipcMain} from "electron";

export default class ElectronEventTransmitter implements ElectronEvent {
    public readonly name = "electronevent";

    constructor(private application: JaHollDEApplication) {
    }

    public run(jsonMessage: any): void {
        this.application.window.window.webContents.send(jsonMessage.event, ...jsonMessage.args);
    }
}