import JaHollDEApplication from "../app";
import {ipcMain} from "electron";

export function initIPCEvents(application: JaHollDEApplication): void {
  let token = undefined, jaholldeData = undefined, callback = undefined;
  ipcMain.handle("jahollde-data", (event, t: string, j: any) => {
    token = t;
    jaholldeData = j;
    callback?.();
  });
  ipcMain.handle("get-jahollde-token", (event) => {
    return new Promise(resolve => {
      if (token) resolve(token);
      callback = () => resolve(token);
    })
  });
}