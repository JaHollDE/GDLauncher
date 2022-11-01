import { ipcRenderer } from "electron";
import path from "path";
import fsa from "fs-extra";
import { getURL } from "../../../common/store/jahollConfig";
import { downloadFile } from "./downloader";
import { getDevURL } from "./jaholldeVerification";

export async function loadConfig(instanceName) {
  const appData = await ipcRenderer.invoke('getAppdataPath');

  const p = path.join(appData, "gdlauncher_next", "instances", instanceName, "jahollde_assets.json");

  let config = undefined;

  if (fsa.existsSync(p)) {
    config = JSON.parse(fsa.readFileSync(p, "utf-8"));
  } else {
    config = {
      version: "-1"
    };
  }
  return config;
}

export async function loadWebData(isDevInstance) {
  const url = await getDevURL(isDevInstance);

  return await (await fetch(`${url}/api/assets`)).json();
}

export async function hasAssetsUpdate(instanceName, isDevInstance) {
  const webData = await loadWebData(isDevInstance);
  const config = await loadConfig(instanceName);

  return webData.version !== config.version;
}

export async function installAssets(instanceName, isDevInstance, callback) {
  const config = await loadConfig(instanceName);
  const webData = await loadWebData(isDevInstance);

  const url = await getDevURL(isDevInstance);

  const appData = await ipcRenderer.invoke('getAppdataPath');
  const p = path.join(appData, "gdlauncher_next", "instances", instanceName, "jahollde_assets");

  if (!fsa.existsSync(p)) fsa.mkdirsSync(p);

  let index = 0;
  for (const asset of webData.list) {
    index++;
    callback(`${asset} ${Math.round(100 * index / webData.list.length)}%`);

    const p2 = path.join(p, asset);
    const dir = path.join(p2, "..");
    if (!fsa.existsSync(dir)) fsa.mkdirsSync(dir);

    await downloadFile(p2, `${url}${asset.startsWith("assets/") ? "" : "/static"}/${asset}`);
  }

  config.version = webData.version;

  const p2 = path.join(appData, "gdlauncher_next", "instances", instanceName, "jahollde_assets.json");
  fsa.writeFileSync(p2, JSON.stringify(webData, undefined, 2));
}