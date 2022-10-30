import JaHollDEApplication from "../app";
import {IpcMainInvokeEvent} from "electron";

export default class LogManager {
  private instanceLogs: {[key: string]: string[]} = {};

  constructor(private app: JaHollDEApplication) {
  }

  private createIfDoesNotExist(instanceName: string) {
    if (this.instanceLogs[instanceName] === undefined) {
      this.instanceLogs[instanceName] = [];
    }
  }

  public async onLog(event: IpcMainInvokeEvent, instanceName: string, log: string): Promise<void> {
    this.createIfDoesNotExist(instanceName);

    this.instanceLogs[instanceName]?.push(log);

    this.app.mainWindow?.webContents?.send("minecraft-log", instanceName, log);
  }
  public async getLog(event: IpcMainInvokeEvent, instanceName: string): Promise<string[] | undefined> {
    return this.instanceLogs[instanceName];
  }
}