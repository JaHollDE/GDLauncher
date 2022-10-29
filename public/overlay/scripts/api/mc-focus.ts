import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";
import { SocketInstance } from "../socket";

export default class OnMcFocus implements ElectronEvent {
    public readonly name = "set_mc_focus";

    constructor(private application: JaHollDEApplication) {
    }

    public run(jsonMessage: any, socketInstance: SocketInstance): void {
        const focused = jsonMessage.focused;
        const iconified = jsonMessage.iconfied;
        socketInstance.window.updateMCFocusedState(focused, iconified);
    }
}
