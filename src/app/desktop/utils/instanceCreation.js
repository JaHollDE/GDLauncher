import {addToQueue} from "../../../common/reducers/actions";
import {FABRIC} from "../../../common/utils/constants";
import {closeModal} from "../../../common/reducers/modals/actions";
import {ipcRenderer} from "electron";
import path from "path";
import fs from "fs";

export async function createInstance(dispatch, instanceName, isDevInstance = false) {
    const initTimestamp = Date.now();

    // If it's a curseforge modpack grab the manfiest and detect the loader
    // type as we don't yet know what it is.

    const wait = t => {
        return new Promise(resolve => {
            setTimeout(() => resolve(), t);
        });
    };

    // create jahollde identifier
    const userData = await ipcRenderer.invoke('getUserData');
    const folder = path.join(userData, "instances", instanceName);
    const p = path.join(folder, "jahollde_instance.txt");
    fs.mkdirSync(folder, {recursive: true});
    fs.writeFileSync(p, isDevInstance ? "dev" : "prod");

    dispatch(
        addToQueue(instanceName, {
            loaderType: FABRIC,
            mcVersion: "1.18.2",
            loaderVersion: "0.14.9"
        })
    );

    if (Date.now() - initTimestamp < 2000) {
        await wait(2000 - (Date.now() - initTimestamp));
    }

    dispatch(closeModal());
}