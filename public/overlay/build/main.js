import { app } from "electron";
import JaHollDEApplication from "./scripts/app";
let s;
export async function init(window) {
    if (s !== undefined)
        return;
    await app.whenReady();
    s = new JaHollDEApplication();
    s.init(window);
}
export function getPort() {
    return s.socket.port;
}
