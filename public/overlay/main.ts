import {app, BrowserWindow} from "electron";
import JaHollDEApplication from "./scripts/app";

let s: JaHollDEApplication;

export async function init(window: BrowserWindow): Promise<void> {
  if (s !== undefined) return;
  await app.whenReady();

  s = new JaHollDEApplication();
  s.init(window);
}

export function getPort(): number | undefined {
  return s.socket.port;
}
