import { getURL } from "../../../common/store/jahollConfig";
import axios from "axios";
import { MINECRAFT_SERVICES_URL } from "../../../common/utils/constants";

let c;
export function onAccountChange(callback) {
    c = callback;
}
export function accountChange() {
    c?.();
}

const forceDevURL = true;

export function getDevURL(isDevInstance) {
    if (forceDevURL) isDevInstance = true;

    return isDevInstance ? "https://devweb.jaholl.de" : "https://interface.jaholl.de";
}

export async function verifyToken(mcToken, isDevInstance) {
    const url = getDevURL(isDevInstance);

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
