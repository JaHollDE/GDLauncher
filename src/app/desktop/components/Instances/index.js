import React, { memo, useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
    _getCurrentAccount,
    _getDownloadQueue,
    _getInstances,
    _getInstancesPath
} from "../../../../common/utils/selectors";

import bg0 from "../../../../common/assets/jahollde/backgrounds/bg0.jpg"
import bg1 from "../../../../common/assets/jahollde/backgrounds/bg1.jpg"
import bg2 from "../../../../common/assets/jahollde/backgrounds/bg2.jpg"
import bg3 from "../../../../common/assets/jahollde/backgrounds/bg3.png"
import Logo from "../../../../ui/Logo";

import link from "../../../../common/assets/jahollde/link.svg"

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
import { installMods } from "../../../../common/modals/ModsManagement";
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

    const instanceName = "jahollde";

    const isPlaying = startedInstances[instanceName];

    const dispatch = useDispatch();

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateMods, setUpdateMods] = useState([]);
    const [updateAssets, setUpdateAssets] = useState(false);
    const [updateInstance, setUpdateInstance] = useState(false);
    const [instanceLoading, setInstanceLoading] = useState(false);

    const [userData, setUserData] = useState(undefined);

    const instancesPath = useSelector(_getInstancesPath);

    const loadData = async (updateConfig = false) => {
        const updateMods2 = await getUpdateMods(instancesPath, instanceName, updateConfig);
        setUpdateMods(updateMods2);
        const createInstance2 = memoInstances.find(l => l.name === instanceName) === undefined;
        setUpdateInstance(createInstance2);

        const updateAss = await hasAssetsUpdate();

        setUpdateAssets(updateAss);

        const updateAv = updateMods2.length > 0 || createInstance2 || updateAss;
        setUpdateAvailable(updateAv);
        return updateAv;
    };

    useEffect(() => {
        loadData();
    }, [memoInstances]);



    onConfig(() => loadData());


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
        dispatch(openModal('ModsManagement', { instanceName }));
    }

    const [overlayConnected, setOverlayConnected] = useState(false);
    const [showAllInstances, setShowAllInstances] = useState(false);

    ipcRenderer.on("overlay-connected", (event, status) => {
        setOverlayConnected(status);
    });

    const openAddInstanceModal = defaultPage => {
        dispatch(openModal('AddInstance', { defaultPage }));
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
                <div className={"jahollde-symbol"}>
                    <Logo size={35} />
                </div>

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
                        <img src={link} style={{
                            filter: "invert(1)",
                            height: "1.5rem",
                            transform: "rotate(45deg)",
                            opacity: overlayConnected ? "100%" : "0%",
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
                                    No Instance has been installed
                                    <SubNoInstance>
                                        Click on the icon in the bottom left corner to add new instances
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
