import { ipcRenderer } from "electron";
import path from "path";
import fsa from "fs-extra";
import { getURL } from "../../../common/store/jahollConfig";
import { downloadFile } from "./downloader";

let config = undefined;
let webData = undefined;

export async function loadConfig() {
  const appData = await ipcRenderer.invoke('getAppdataPath');
  const p = path.join(appData, "gdlauncher_next", "jahollde_assets.json");

  if (fsa.existsSync(p)) {
    config = JSON.parse(fsa.readFileSync(p, "utf-8"));
  } else {
    config = {
      version: "-1"
    };
  }
}

export async function loadWebData() {
  const url = await getURL();

  webData = await (await fetch(`${url}/api/assets`)).json();
}


const loadingConfig = Promise.all([loadConfig(), loadWebData()]);

export async function hasAssetsUpdate() {
  await loadingConfig;

  return webData.version !== config.version;
}

export async function installAssets(callback) {
  await loadingConfig;

  const url = await getURL();

  const appData = await ipcRenderer.invoke('getAppdataPath');
  const p = path.join(appData, "gdlauncher_next", "jahollde_assets");

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

  const p2 = path.join(appData, "gdlauncher_next", "jahollde_assets.json");
  fsa.writeFileSync(p2, JSON.stringify(webData, undefined, 2));
}