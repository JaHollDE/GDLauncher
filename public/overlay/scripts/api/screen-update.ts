import ElectronEvent from "../electron-event";
import JaHollDEApplication from "../app";

export default class OnScreenUpdate implements ElectronEvent {
  public readonly name = "screen_update";

  constructor(private application: JaHollDEApplication) {
  }

  public run(jsonMessage: any): void {
    const width: number = jsonMessage.width;
    const height: number = jsonMessage.height;
    const x: number = jsonMessage.x;
    const y: number = jsonMessage.y;

    this.application.window.setGeometry(width, height, x, y);
  }
}