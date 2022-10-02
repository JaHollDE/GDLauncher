import { app } from "electron";
import JaHollDEApplication from "./scripts/app";
let s;
export async function init() {
    await app.whenReady();
    s = new JaHollDEApplication();
    s.init();
}
export function getPort() {
    return s.socket.port;
}
