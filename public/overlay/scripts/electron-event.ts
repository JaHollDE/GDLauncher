import { SocketInstance } from "./socket";

export default interface ElectronEvent {
  name: string;

  run(data: any, socketInstance: SocketInstance): void;
}