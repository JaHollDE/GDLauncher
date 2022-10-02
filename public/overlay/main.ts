import {app} from "electron";
import JaHollDEApplication from "./scripts/app";

let s: JaHollDEApplication;

export async function init(): Promise<void> {
  await app.whenReady();

  s = new JaHollDEApplication();
  s.init();
}

export function getPort(): number | undefined {
  return s.socket.port;
}
