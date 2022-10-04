import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";

export default class OnMcFocus implements ElectronEvent {
    public readonly name = "set_mc_focus";

    constructor(private application: JaHollDEApplication) {
    }

    public run(jsonMessage: any): void {
        const focused = jsonMessage.focused;
        const iconified = jsonMessage.iconfied;
        this.application.window.updateMCFocusedState(focused, iconified);
    }
}
