import JaHollDEApplication from "../../app";

export default async function handleScale(application: JaHollDEApplication, newValue: number) {
  application.socket.getAllInstances().forEach((instance) => {
    instance.window.window?.webContents?.setZoomFactor(newValue);
  });
}