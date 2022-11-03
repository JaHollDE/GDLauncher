import React, { useEffect, useState } from "react";
import Modal from '../components/Modal';
import styled from "styled-components";
import {getConfig, getWebData, initConfig, setConfig, setConfig as saveConfig} from "../store/jahollConfig";
import { useDispatch } from "react-redux";
import path from "path";
import fsa from "fs-extra";
import { getAddonFile } from "../api";
import { downloadFile } from "../../app/desktop/utils/downloader";
import {ipcRenderer} from "electron";

export async function installMods(modsData, instancesPath, instanceName, callback) {
  const modFolder = path.join(instancesPath, instanceName);
  fsa.mkdirsSync(modFolder);

  console.log(modsData);

  for (const mod of modsData) {
    callback(mod.name);

    let { url } = mod;

    const p = path.join(modFolder, mod.file);

    if (mod.projectID !== undefined && mod.artifactID !== undefined) {
      const { projectID, artifactID } = mod;
      console.log("loading curse forge mod: ", projectID, artifactID);

      const data = await getAddonFile(projectID, artifactID);

      url = data.downloadUrl;

    }

    console.log("URL:", url);

    try {
      await downloadFile(p, url, () => {
      });
    } catch (err) {
      console.warn(err);
      continue;
    }

    await initConfig(instanceName);
    const newConfig = (await getConfig()).map(l => l.file === mod.file ? {...mod, active: true} : l);
    await setConfig(newConfig, instanceName)
  }
}

let modChangeEvent = undefined;

export function onModChange(cb) {
  modChangeEvent = cb;
}
export function triggerModChangeEvent() {
  modChangeEvent?.();
}

const ModsManagement = ({instanceName}) => {
  const [config, setConfig] = useState([]);
  const [webData, setWebData] = useState([]);

  useEffect(async () => {
    await initConfig(instanceName);
    setConfig(await getConfig());
  }, []);


  getWebData().then(data => {
    setWebData(data)
  }).catch(console.warn);

  const setModChecked = async (name, state) => {
    const toActive = [];

    const res = config.map(l => {
      if (l.name === name) {
        if (state) {
          const deps = webData.find(j => j.file === l.file)?.dependencies;
          deps?.forEach(g => {
            toActive.push(g);
          });
        }

        return {...l, active: state};
      }
      return l;
    }).map(l => toActive.includes(l.file) ? {...l, active: true} : l);

    setConfig(res);
    //const s = await ipcRenderer.invoke("get-dev-instance-name");
    saveConfig(res, instanceName).then(() => modChangeEvent?.());
  };

  const hasActivatedDependency = (element) => {
    return webData.find(l => {
      if (l?.dependencies?.includes?.(element.file)) {
        const configElement = config.find(f => f.file === l.file);
        if (configElement !== undefined && configElement.active) {
          return true;
        }
      }
      return false;
    }) !== undefined;
  }

  return (
    <Modal
      css={`
        height: 70%;
        width: 400px;
        max-height: 700px;
      `}
      title="JaHollDE Mods"
    >
      {config.length !== 0 && <Container>
        {config.map(el => (
          <ModElement>
            <Header>
              <b>{el.name}</b>
              <div style={{flexGrow: 1}} />
              <input type="checkbox" checked={el.active} disabled={!el.optional || hasActivatedDependency(el)} css={`
                  align-self: center;
                `} onChange={(event) => setModChecked(el.name, event.target.checked)} />

            </Header>

            <small>Quelle: {el.source} - <i>{el.version}</i></small>

          </ModElement>
        ))}
      </Container>}
    </Modal>
    )
}

const ModElement = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  padding: .5rem;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`

const Container = styled.div`
  width: 100%;
  height: 100%;
  row-gap: .5rem;
  display: flex;
  flex-direction: column;
  align-content: space-between;
  overflow-y: auto;
`;

export default ModsManagement;