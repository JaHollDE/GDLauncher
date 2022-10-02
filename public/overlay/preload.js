const {contextBridge, ipcRenderer} = require("electron");

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.ipcRenderer = require("electron").ipcRenderer;

const exposedAPI = {
  getJaHollDEToken: () => {
    return ipcRenderer.invoke("get-jahollde-token");
  }
};

contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
//contextBridge.exposeInMainWorld("electronAPI", exposedAPI);
