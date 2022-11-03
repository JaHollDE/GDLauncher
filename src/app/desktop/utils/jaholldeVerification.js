import { getURL } from "../../../common/store/jahollConfig";
import axios from "axios";
import { MINECRAFT_SERVICES_URL } from "../../../common/utils/constants";
import path from "path";
import fss from "fs";
import { ipcRenderer } from "electron";

let c;
export function onAccountChange(callback) {
    c = callback;
}
export function accountChange() {
    c?.();
}

let forceInstance = undefined;
export async function getDevURL(isDevInstance) {
    if (forceInstance === undefined) {
        const appData = await ipcRenderer.invoke('getUserData');
        forceInstance = fss.existsSync(path.join(appData, "developer"));
    }

    if (forceInstance) isDevInstance = true;

    return isDevInstance ? "https://devweb.jaholl.de" : "https://interface.jaholl.de";
}

export async function checkDevInstance(instanceName) {
    let isDevInstance = false;
    const appData = await ipcRenderer.invoke('getUserData');
    const p = path.join(appData, "instances", instanceName, "jahollde_instance.txt");
    if (fss.existsSync(p)) {
        const content = fss.readFileSync(p).toString();
        if (content === "dev") isDevInstance = true;
    }
    return isDevInstance;
}

export async function verifyToken(mcToken, isDevInstance) {
    const url = await getDevURL(isDevInstance);

    const request = `${url}/api/user/verify`;

    let data;
    try {
        data = await axios.get(request, {
            headers: {
                Authorization: `Bearer ${mcToken}`
            }
        });
    } catch (err) {
        return false;
    }

    return data.data;
}
