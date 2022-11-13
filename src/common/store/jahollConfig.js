import fsa from "fs-extra";
import path from "path";
import { ipcRenderer } from "electron";
import { checkDevInstance, getDevURL } from "../../app/desktop/utils/jaholldeVerification";
import crypto from "crypto";

// let URL = "https://interface.jaholl.de"
// TODO change back


let config = undefined;
let webData;

export async function initConfig(instanceName) {
    const isDevUrl = await checkDevInstance(instanceName);
    const url = await getDevURL(isDevUrl);

    const json = await (await fetch(`${url}/launcher/mods.json`)).json();
    const userData = await ipcRenderer.invoke('getUserData');

    const p = path.join(userData, "instances", instanceName, "mods.json");

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

    const instanceFolder = path.join(instancesPath, instanceName);

    let deleteMod = false;

    config = config.filter(element => {
        let found = undefined;

        webData.forEach(l => {
            if (l.file === element.file && l.name === element.name) {
                found = {
                    ...l,
                    ...element
                };
            }
        });

        const p = path.join(instanceFolder, element.file);
        if (!found) {
            if (fsa.existsSync(p)) fsa.rmSync(p);
            deleteMod = true;
        } else if (fsa.existsSync(p)) {
            const sum = found.sha512;
            const localSum = crypto.createHash("sha512").update(fsa.readFileSync(p)).digest("hex");

            if (sum === undefined) {
                console.warn("Sum for mod could not be found: ", found.name)
            } else if (sum !== localSum) {
                console.warn("Found invalid mod: ", found.name);
                fsa.rmSync(p);
                deleteMod = true;
            }
        }

        return found;
    });
    const modFolder = path.join(instanceFolder, "mods");

    fsa.readdirSync(modFolder).forEach(mod => {
        const file = "./mods/" + mod;
        const found = config.find(l => l.file === file);
        if (!found) fsa.rmSync(path.join(modFolder, mod))
    });

    if (deleteMod) await setConfig(config, instanceName);

    config.forEach(element => {

        const p = path.join(instanceFolder, element.file);
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
    const userData = await ipcRenderer.invoke('getUserData');

    const instanceFolder = path.join(userData, "instances", instanceName);

    if (fsa.existsSync(instanceFolder)) {
        await fsa.writeFile(path.join(instanceFolder, "mods.json"), JSON.stringify(config, undefined, 2));
    } else {
        console.warn(`Skipping setting config for ${instanceName}, folder not existing.`);
    }
}
