import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";
import {ipcMain} from "electron";

export default class ElectronEventTransmitter implements ElectronEvent {
    public readonly name = "electronevent";

    constructor(private application: JaHollDEApplication) {
    }

    public async run(jsonMessage: any): Promise<void> {
        const window = await this.application.window.getWindow();
        window.webContents.send(jsonMessage.event, ...jsonMessage.args);
    }
}