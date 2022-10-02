export default interface ElectronEvent {
  name: string;

  run(data: any): void;
}