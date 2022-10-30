import fsa from "fs-extra";
import path from "path";
import { ipcRenderer } from "electron";
import { checkDevInstance, getDevURL } from "../../app/desktop/utils/jaholldeVerification";

// let URL = "https://interface.jaholl.de"
// TODO change back
let URL = "https://devweb.jaholl.de"

const urlProc = (async () => {
    const appData = await ipcRenderer.invoke('getAppdataPath');
    const p = path.join(appData, "gdlauncher_next", "jahollde_url.txt");

    if (fsa.existsSync(p)) {
        URL = fsa.readFileSync(p, "utf-8");
    }
})();

export async function getURL() {
    await urlProc;
    return URL;
}

let config = undefined;
let webData;

export async function initConfig(instanceName) {
    await urlProc;

    const isDevUrl = await checkDevInstance(instanceName);
    const url = getDevURL(isDevUrl);

    const json = await (await fetch(`${url}/launcher/mods.json`)).json();
    const appData = await ipcRenderer.invoke('getAppdataPath');

    const p = path.join(appData, "gdlauncher_next", "instances", instanceName, "mods.json");

    if (fsa.existsSync(p)) {
        config = JSON.parse(fsa.readFileSync(p, "utf-8"));
    } else {
        config = [];
    }

    webData = json;
    fillConfig();

}

function fillConfig() {
    webData.forEach(element => {
        let found = false;
        config = config.map(l => {
            if (l.file === element.file) {
                found = true;
                for (const key of Object.keys(element)) {
                    if (l[key] === undefined) {
                        l[key] = element[key];
                    }
                }
            }
            return l;
        });

        if (!found) config.push(element);
    });

}

let loadingConfig = undefined;

export async function getModVersions(instanceName) {
    loadingConfig = initConfig(instanceName);
    await loadingConfig;

    return config;
}

export async function getUpdateMods(instancesPath, instanceName, updateConfig) {
    loadingConfig = initConfig(instanceName);
    await loadingConfig;

    await setConfig(config, instanceName);

    const toUpdate = [];

    const modsFolder = path.join(instancesPath, instanceName);

    let deleteMod = false;

    config = config.filter(element => {
        let found = false;

        webData.forEach(l => {
            if (l.file === element.file && l.name === element.name) found = true;
        });

        if (!found) {
            const p = path.join(modsFolder, element.file);
            if (fsa.existsSync(p)) fsa.rmSync(p);
            deleteMod = true;
        }

        return found;
    });

    if (deleteMod) await setConfig(config, instanceName);

    config.forEach(element => {

        const p = path.join(modsFolder, element.file);
        const pathExists = fsa.existsSync(p);

        const webDataEntry = webData.find(l => l.file === element.file);

        if (webDataEntry === undefined || webDataEntry === null) return;

        if (!element.active) {
            if (pathExists) {
                fsa.rmSync(p);
            }
            return;
        }

        if (!pathExists || element.version !== webDataEntry.version) {
            toUpdate.push(webDataEntry);
        }
    });

    return toUpdate;
}

export async function getWebData() {
    await loadingConfig;
    return webData;
}

export async function getUpdateElements() {
    await loadingConfig;
    return toUpdate;
}

const handlers = [];
export function onConfig(callback) {
    handlers.push(callback);
}
export async function getConfig() {
    await loadingConfig;
    return config;
}
export async function setConfig(newConfig, instanceName) {
    await loadingConfig;

    console.log("set config: ", instanceName, newConfig);

    config = newConfig;
    handlers.forEach(l => l(newConfig));
    const appData = await ipcRenderer.invoke('getAppdataPath');

    const instanceFolder = path.join(appData, "gdlauncher_next", "instances", instanceName);

    if (fsa.existsSync(instanceFolder)) {
        await fsa.writeFile(path.join(instanceFolder, "mods.json"), JSON.stringify(config, undefined, 2));
    } else {
        console.warn(`Skipping setting config for ${instanceName}, folder not existing.`);
    }
}
