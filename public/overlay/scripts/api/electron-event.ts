import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";
import {ipcMain} from "electron";
import { SocketInstance } from "../socket";

export default class ElectronEventTransmitter implements ElectronEvent {
    public readonly name = "electronevent";

    constructor(private application: JaHollDEApplication) {
    }

    public async run(jsonMessage: any, socketInstance: SocketInstance): Promise<void> {
        const window = await socketInstance.window.getWindow();
        window.webContents.send(jsonMessage.event, ...jsonMessage.args);
    }
}