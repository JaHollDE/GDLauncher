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
import {createInstance} from "../../utils/instanceCreation";
import { checkDevInstance } from "../../utils/jaholldeVerification";

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

const Instances = ({ jaholldeData }) => {

    const [isDevInstance, setIsDevInstance] = useState(false);

    useEffect(() => {
        setIsDevInstance(!!jaholldeData?.hasDevRights);
    }, [jaholldeData]);

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

    useEffect(() => {
        ipcRenderer.removeAllListeners("check-for-texturepack-updates");
        ipcRenderer.on("check-for-texturepack-updates", async (event, instanceName) => {
            let updateMods = false;
            let updateAssets = false;

            const isDevInstance = await checkDevInstance(instanceName);

            const updateAss = await hasAssetsUpdate(instanceName, isDevInstance);
            if (updateAss) {
                await installAssets(instanceName, isDevInstance, (data) => setModStatus(data));
                updateAssets = true;
            }

            for (const instanceName of Object.keys(startedInstances)) {
                const updateMods2 = await getUpdateMods(instancesPath, instanceName, false);

                if (updateMods2.length > 0) {
                    await installMods(updateMods2, instancesPath, instanceName, (status) => {
                        setModStatus("Mod: " + status);
                    });
                    updateMods = true;
                }

                setModStatus(undefined);
            }

            try {
                await ipcRenderer.invoke("reload-data", updateMods, updateAssets, instanceName);
            } catch (err) {
                console.warn(err);
            }
        });

        return () => {
            ipcRenderer.removeAllListeners("check-for-texturepack-updates");
        }
    }, [startedInstances]);

    const loadData = async (updateConfig = false) => {
        //if (modsOpen) return;
        console.log("checking if update is available for: ", instanceName, updateConfig);

        const updateMods2 = await getUpdateMods(instancesPath, instanceName, updateConfig);
        setUpdateMods(updateMods2);
        const finishedInstances = await getInstancesComplete(instancesPath);
        const createInstance2 = Object.keys(finishedInstances).find(l => l === instanceName) === undefined;
        setUpdateInstance(createInstance2);

        const isDevInstance = await checkDevInstance(instanceName);

        const updateAss = await hasAssetsUpdate(instanceName, isDevInstance);

        setUpdateAssets(updateAss);

        const updateAv = updateMods2.length > 0 || createInstance2 || updateAss;
        setUpdateAvailable(updateAv);
        return updateAv;
    };

    useEffect(async () => {
        await loadData();
    }, []);


    //onConfig(() => loadData());

    onModChange(() => loadData());


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
        if (updateInstance) {
            await createInstance(dispatch, instanceName);
            setUpdateInstance(false);
        }
        if (updateMods.length > 0) {
            await installMods(updateMods, instancesPath, instanceName, (status) => {
                setModStatus("Mod: " + status);
            });
            setModStatus(undefined);
            setUpdateMods([]);
        }
        if (updateAssets) {
            const isDevInstance = await checkDevInstance(instanceName);
            await installAssets(instanceName, isDevInstance, (data) => setModStatus(data));
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

    useEffect(() => {
        ipcRenderer.on("overlay-shown", (event, data) => {
            setOverlayVisible(data.showWindow);
            setOverlayAlwaysOnTop(data.alwaysOnTop);
        });
        ipcRenderer.on("overlay-connected", (event, status) => {
            setOverlayConnected(status);
        });

        return () => {
            ipcRenderer.removeAllListeners("overlay-shown");
            ipcRenderer.removeAllListeners("overlay-connected");
        }
    }, []);

    const openAddInstanceModal = defaultPage => {
        dispatch(openModal('AddInstance', { defaultPage }));
    };

    const restartElectron = () => {
        if (!overlayConnected) return;
        //ipcRenderer.invoke("restart-electron"); // TODO verlegen auf instanz-rechtsklick menü
    }

    const createJaHollDEInstance = () => {
        dispatch(openModal('JaHollDEInstanceCreation', {}));
    };

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
                    {showAllInstances && isDevInstance ? <Button onClick={createJaHollDEInstance}>
                        JaHollDE-Instanz erstellen
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


                <div className={"start-instance " + (jaholldeData === undefined || jaholldeData === false ? 'disable-start-instance' : '')}>
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
