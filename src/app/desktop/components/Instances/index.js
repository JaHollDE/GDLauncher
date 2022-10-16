import React, { memo, useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
    _getCurrentAccount,
    _getDownloadQueue,
    _getInstances,
    _getInstancesPath
} from "../../../../common/utils/selectors";

import getInstancesComplete from "../../utils/getInstances"

import bg0 from "../../../../common/assets/jahollde/backgrounds/bg0.jpg"
import bg1 from "../../../../common/assets/jahollde/backgrounds/bg1.jpg"
import bg2 from "../../../../common/assets/jahollde/backgrounds/bg2.jpg"
import bg3 from "../../../../common/assets/jahollde/backgrounds/bg3.png"

import link from "../../../../common/assets/jahollde/link.svg"
import arrowRepeat from "../../../../common/assets/jahollde/arrow-repeat.svg"
import eyeSlash from "../../../../common/assets/jahollde/eye-slash.svg"
import boxArrowInDown from "../../../../common/assets/jahollde/box-arrow-in-down.svg"

import { ipcRenderer } from "electron";

import * as jaholldeVerification from "../../utils/jaholldeVerification";

import "./index.css";
import { CURSEFORGE, FABRIC, FORGE, FTB, VANILLA } from "../../../../common/utils/constants";
import {
    convertcurseForgeToCanonical,
    downloadAddonZip,
    extractFabricVersionFromManifest,
    importAddonZip
} from "../../utils";
import path from "path";
import { downloadFile } from "../../utils/downloader";
import { addStartedInstance, addToQueue, launchInstance } from "../../../../common/reducers/actions";
import { getFTBModpackVersionData } from "../../../../common/api";
import os from "os";
import { closeModal, openModal } from "../../../../common/reducers/modals/actions";
import psTree from "ps-tree";
import { getUpdateMods, onConfig } from "../../../../common/store/jahollConfig";
import {installMods, onModChange} from "../../../../common/modals/ModsManagement";
import { hasAssetsUpdate, installAssets } from "../../utils/webAssetsManager";
import { Button } from "antd";
import Instance from "./Instance";

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 2rem;
`;

const NoInstance = styled.div`
  width: 100%;
  text-align: center;
  font-size: 25px;
  margin-top: 100px;
`;


const SubNoInstance = styled.div`
  width: 100%;
  text-align: center;
  font-size: 15px;
  margin-top: 20px;
`;
const sortAlphabetical = instances =>
    instances.sort((a, b) => (a.name > b.name ? 1 : -1));

const sortByLastPlayed = instances =>
    instances.sort((a, b) => (a.lastPlayed < b.lastPlayed ? 1 : -1));

const sortByMostPlayed = instances =>
    instances.sort((a, b) => (a.timePlayed < b.timePlayed ? 1 : -1));

const getInstances = (instances, sortOrder) => {
    // Data normalization for missing fields
    const inst = instances.map(instance => {
        return {
            ...instance,
            timePlayed: instance.timePlayed || 0,
            lastPlayed: instance.lastPlayed || 0
        };
    });

    switch (sortOrder) {
        case 0:
            return sortAlphabetical(inst);
        case 1:
            return sortByLastPlayed(inst);
        case 2:
            return sortByMostPlayed(inst);
        default:
            return inst;
    }
};


let playerOnline;
fetch("https://api.mcsrvstat.us/2/prodnode.jaholl.de:25566").then(data => data.json()).then(json => {
    playerOnline = json.players.online;
    return null;
}).catch(l => console.warn(l));

const Instances = () => {
    const instanceSortOrder = useSelector(
        state => state.settings.instanceSortOrder
    );
    const instances = useSelector(_getInstances);

    const memoInstances = useMemo(
        () => getInstances(instances || [], instanceSortOrder),
        [instances, instanceSortOrder]
    );

    const startedInstances = useSelector(state => state.startedInstances);

    const [instanceName, setInstanceName] = useState("jahollde");

    const isPlaying = startedInstances[instanceName];

    const dispatch = useDispatch();

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateMods, setUpdateMods] = useState([]);
    const [updateAssets, setUpdateAssets] = useState(false);
    const [updateInstance, setUpdateInstance] = useState(false);
    const [instanceLoading, setInstanceLoading] = useState(false);

    const [userData, setUserData] = useState(undefined);
    const [modsOpen, setModsOpen] = useState(false);

    const instancesPath = useSelector(_getInstancesPath);

    const loadData = async (updateConfig = false, forceInstanceName = undefined) => {
        //if (modsOpen) return;
        if (!forceInstanceName) {
            forceInstanceName = instanceName;
            console.log("Forcing instance name: ", instanceName);
        }
        console.log("checking if update is available for: ", forceInstanceName, updateConfig);

        const updateMods2 = await getUpdateMods(instancesPath, forceInstanceName, updateConfig);
        setUpdateMods(updateMods2);
        const finishedInstances = await getInstancesComplete(instancesPath);
        const createInstance2 = Object.keys(finishedInstances).find(l => l === forceInstanceName) === undefined;
        setUpdateInstance(createInstance2);

        const updateAss = await hasAssetsUpdate();

        setUpdateAssets(updateAss);

        const updateAv = updateMods2.length > 0 || createInstance2 || updateAss;
        setUpdateAvailable(updateAv);
        return updateAv;
    };

    useEffect(() => {
        loadData();
    }, []);

    const [isDevInstance, setIsDevInstance] = useState(false);

    useEffect(() => {
        ipcRenderer.invoke("is-dev-instance").then(s => {
            setIsDevInstance(s);
            const newName = s ? "jahollde_dev" : "jahollde";
            setInstanceName(newName);
            if (s) loadData(false, newName);
        });
        ipcRenderer.on("dev-instance-update", (event, state) => {
            setIsDevInstance(state);
            const newName = state ? "jahollde_dev" : "jahollde";
            setInstanceName(newName);
            loadData(false, newName);
        });
    }, []);


    //onConfig(() => loadData());

    onModChange(() => loadData());


    const createInstance = async () => {
        const initTimestamp = Date.now();

        // If it's a curseforge modpack grab the manfiest and detect the loader
        // type as we don't yet know what it is.

        const wait = t => {
            return new Promise(resolve => {
                setTimeout(() => resolve(), t);
            });
        };

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
    };

    const startInstance = () => {
        if (isInQueue || isPlaying) return;
        dispatch(addStartedInstance({ instanceName }));
        dispatch(launchInstance(instanceName, (state) => setInstanceLoading(state), undefined));
    };

    const killProcess = () => {
        psTree(isPlaying.pid, (err, children) => {
            process.kill(isPlaying.pid);
            if (children?.length) {
                children.forEach(el => {
                    if (el) {
                        try {
                            process.kill(el.PID);
                        } catch {
                            // No-op
                        }
                        try {
                            process.kill(el.PPID);
                        } catch {
                            // No-op
                        }
                    }
                });
            } else {
                try {
                    process.kill(isPlaying.pid);
                } catch {
                    // No-op
                }
            }
        });
        setInstanceLoading(false);
    };

    const [modStatus, setModStatus] = useState(undefined);

    const runInstall = async () => {
        if (updateInstance) await createInstance();
        if (updateMods.length > 0) {
            await installMods(updateMods, instancesPath, instanceName, (status) => {
                setModStatus("Mod: " + status);
            });
            setModStatus(undefined);
            setUpdateMods([]);
        }
        if (updateAssets) {
            await installAssets((data) => setModStatus(data));
            setUpdateAssets(false);
            setModStatus(undefined);
        }
        setUpdateAvailable(false);
    }

    const getStatus = () => {
        if (isInQueue || modStatus) return "Installiere";
        if (updateInstance) return "Installieren";
        if (updateMods.length > 0 || updateAssets) return "Aktualisieren";
        if (instanceLoading) return "Lade Instanz...";
        if (isPlaying) return "Beenden";
        return "Starten";
    }

    const manageInstance = () => {
        dispatch(openModal('InstanceManager', { instanceName }));
    };

    const downloadQueue = useSelector(_getDownloadQueue);
    const isInQueue = downloadQueue[instanceName];

    const openModSettings = () => {
        setModsOpen(true);
        dispatch(openModal('ModsManagement', { instanceName }));
    }

    const [overlayConnected, setOverlayConnected] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [overlayHovered, setOverlayHovered] = useState(false);
    const [overlayAlwaysOnTop, setOverlayAlwaysOnTop] = useState(true);
    const [showAllInstances, setShowAllInstances] = useState(false);

    ipcRenderer.on("overlay-shown", (event, data) => {
        setOverlayVisible(data.showWindow);
        setOverlayAlwaysOnTop(data.alwaysOnTop);
    });
    ipcRenderer.on("overlay-connected", (event, status) => {
        setOverlayConnected(status);
    });

    const openAddInstanceModal = defaultPage => {
        dispatch(openModal('AddInstance', { defaultPage }));
    };

    const restartElectron = () => {
        if (!overlayConnected) return;
        ipcRenderer.invoke("restart-electron");
    }


    return (
        <Container>
            <div style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                left: "0",
                top: "0",

            }}>

                <div className={"show-all-instances"}>
                    <Button onClick={() => setShowAllInstances(!showAllInstances)}>
                        {!showAllInstances ? 'Alle Instanzen' : 'Verbergen'}
                    </Button>
                    {showAllInstances ? <Button onClick={openAddInstanceModal}>
                        Instanz erstellen
                    </Button> : null}

                </div>


                <div className={"player-online"}>Online: <span>{playerOnline}</span>
                    <div style={{
                        marginLeft: "1rem",
                    }}>

                        <img className={overlayConnected ? "click-effect" : ""} title={"Electron neustarten"} src={overlayHovered ? arrowRepeat : link} onClick={restartElectron} onMouseOver={() => setOverlayHovered(true)} onMouseLeave={() => setOverlayHovered(false)} style={{
                            filter: "invert(1)",
                            height: "1.5rem",
                            transform: "rotate(45deg)",
                            opacity: overlayConnected ? "100%" : "0%",
                            transition: "all 0.5s"
                        }}></img>

                        <img title={"Overlay versteckt"} src={eyeSlash} style={{
                            filter: "invert(1)",
                            height: "1.5rem",
                            opacity: !overlayVisible && overlayConnected ? "100%" : "0%",
                            transition: "all 0.5s"
                        }}></img>

                        <img src={boxArrowInDown} style={{
                            filter: "invert(1)",
                            height: "1.5rem",
                            opacity: overlayAlwaysOnTop && overlayConnected ? "100%" : "0%",
                            transition: "all 0.5s"
                        }}></img>
                    </div>
                </div>

                {
                    showAllInstances ? <div style={{
                        top: "4rem",
                        maxHeight: "70%",
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        width: "80%",
                        padding: "2rem",
                        marginTop: "2rem",
                        marginLeft: "10%",
                        marginRight: "10%",
                        position: "absolute",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        borderRadius: ".5rem",
                        gap: "10px"
                    }}>
                        {
                            memoInstances.length > 0 ? (
                                memoInstances.map(i => <Instance key={i.name} instanceName={i.name} />)
                            ) : (
                                <NoInstance>
                                    Es wurde keine Instanz erstellt.
                                    <SubNoInstance>
                                        Klicke auf das Icon in der oberen linken Ecke um eine Instanz zu erstellen.
                                    </SubNoInstance>
                                </NoInstance>
                            )
                        }
                    </div> : null
                }



                <div className={"start-instance"}>
                    <div>
                        {(!isInQueue) && <button css={`
            font-size: .5em;  
          `} onClick={() => openModSettings()}>Mods</button>}
                        <button type={"button"} onClick={async () => {
                            const oldStatus = updateAvailable;
                            const result = await loadData(true);
                            if (!oldStatus && result) return;
                            if (updateAvailable && !(isInQueue || modStatus)) {
                                runInstall();
                            } else if (isPlaying) {
                                killProcess();
                            } else {
                                startInstance();
                            }
                        }}>
                            {getStatus()}

                            <div className={"install-instance-status"}>
                                {isInQueue && <span>{isInQueue.status} - {isInQueue.percentage}%</span>}
                                {(updateMods.length > 0 || updateAssets) && modStatus && <span>{modStatus}</span>}
                            </div>
                        </button>
                    </div>

                    {(!isInQueue && !updateAvailable) && <button css={`
            font-size: .5em;  
          `} onClick={() => manageInstance()}>
                        Bearbeiten
                    </button>}
                </div>
            </div>
        </Container>
    );

    /*
  
     */



};

export default memo(Instances);
