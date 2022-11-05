import React, { useState, useEffect, memo } from 'react';
import styled from 'styled-components';
import { ipcRenderer, clipboard } from 'electron';
import { useSelector, useDispatch } from 'react-redux';
import path from 'path';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import fsa from 'fs-extra';
import { promises as fs } from 'fs';
import {
  faCopy,
  faDownload,
  faTachometerAlt,
  faTrash,
  faPlay,
  faToilet,
  faNewspaper,
  faFolder,
  faFire,
  faSort, faWindowMaximize
} from "@fortawesome/free-solid-svg-icons";
import { Select, Tooltip, Button, Switch, Input, Checkbox } from 'antd';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  _getCurrentAccount,
  _getDataStorePath,
  _getInstancesPath,
  _getTempPath
} from '../../../utils/selectors';
import {
  updateDiscordRPC,
  updateHideWindowOnGameLaunch,
  updatePotatoPcMode,
  updateInstanceSortType,
  updateShowNews,
  updateCurseReleaseChannel
} from '../../../reducers/settings/actions';
import { updateConcurrentDownloads } from '../../../reducers/actions';
import { closeAllModals, closeModal, openModal } from "../../../reducers/modals/actions";
import HorizontalLogo from '../../../../ui/HorizontalLogo';
import { extractFace } from '../../../../app/desktop/utils';
import { push } from "connected-react-router";

const Title = styled.div`
  margin-top: 30px;
  margin-bottom: 5px;
  font-size: 15px;
  font-weight: 700;
  color: ${props => props.theme.palette.text.primary};
  z-index: 1;
  text-align: left;
  -webkit-backface-visibility: hidden;
`;

const Content = styled.div`
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  *:first-child {
    margin-right: 15px;
  }
`;

const PersonalData = styled.div`
  margin-top: 38px;
  width: 100%;
`;

const MainTitle = styled.h1`
  color: ${props => props.theme.palette.text.primary};
  margin: 0 500px 20px 0;
`;

const ProfileImage = styled.img`
  position: relative;
  top: 20px;
  left: 20px;
  background: #212b36;
  width: 50px;
  height: 50px;
`;

const Uuid = styled.div`
  font-size: smaller;
  font-weight: 200;
  color: ${props => props.theme.palette.grey[100]};
  display: flex;
`;

const Username = styled.div`
  font-size: smaller;
  font-weight: 200;
  color: ${props => props.theme.palette.grey[100]};
  display: flex;
`;

const PersonalDataContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${props => props.theme.palette.grey[900]};
  border-radius: ${props => props.theme.shape.borderRadius};
`;

const LauncherVersion = styled.div`
  margin: 30px 0;
  p {
    text-align: left;
    color: ${props => props.theme.palette.text.third};
    margin: 0 0 0 6px;
  }

  h1 {
    color: ${props => props.theme.palette.text.primary};
  }
`;

const CustomDataPathContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: ${props => props.theme.shape.borderRadius};

  h1 {
    width: 100%;
    font-size: 15px;
    font-weight: 700;
    color: ${props => props.theme.palette.text.primary};
    z-index: 1;
    text-align: left;
  }
`;

function copy(setCopied, copyText) {
  setCopied(true);
  clipboard.writeText(copyText);
  setTimeout(() => {
    setCopied(false);
  }, 500);
}

function dashUuid(UUID) {
  // UUID is segmented into: 8 - 4 - 4 - 4 - 12
  // Then dashes are added between.

  // eslint-disable-next-line
  return `${UUID.substring(0, 8)}-${UUID.substring(8, 12)}-${UUID.substring(
    12,
    16
  )}-${UUID.substring(16, 20)}-${UUID.substring(20, 32)}`;
}

const General = () => {
  /* eslint-disable prettier/prettier */
  const tempPath = useSelector(_getTempPath);
  const dataStorePath = useSelector(_getDataStorePath);
  const instancesPath = useSelector(_getInstancesPath);
  const currentAccount = useSelector(_getCurrentAccount);
  const userData = useSelector(state => state.userData);
  const isPlaying = useSelector(state => state.startedInstances);
  const queuedInstances = useSelector(state => state.downloadQueue);
  const updateAvailable = useSelector(state => state.updateAvailable);
  const showNews = useSelector(state => state.settings.showNews);
  const DiscordRPC = useSelector(state => state.settings.discordRPC);
  const potatoPcMode = useSelector(state => state.settings.potatoPcMode);
  const concurrentDownloads = useSelector(
    state => state.settings.concurrentDownloads
  );
  const curseReleaseChannel = useSelector(
    state => state.settings.curseReleaseChannel
  );
  const hideWindowOnGameLaunch = useSelector(
    state => state.settings.hideWindowOnGameLaunch
  );
  const instanceSortMethod = useSelector(
    state => state.settings.instanceSortOrder
  );
  /* eslint-enable */

  const [dataPath, setDataPath] = useState(userData);
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [moveUserData, setMoveUserData] = useState(false);
  const [deletingInstances, setDeletingInstances] = useState(false);
  const [loadingMoveUserData, setLoadingMoveUserData] = useState(false);
  const [version, setVersion] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [releaseChannel, setReleaseChannel] = useState(null);

  const dispatch = useDispatch();

  const disableInstancesActions =
    Object.keys(queuedInstances).length > 0 ||
    Object.keys(isPlaying).length > 0;

  useEffect(() => {
    ipcRenderer.invoke('getAppVersion').then(setVersion).catch(console.error);
    extractFace(currentAccount.skin).then(setProfileImage).catch(console.error);
    ipcRenderer
      .invoke('getAppdataPath')
      .then(appData =>
        fsa
          .readFile(path.join(appData, 'gdlauncher_next', 'rChannel'))
          .then(v => setReleaseChannel(parseInt(v.toString(), 10)))
          .catch(() => setReleaseChannel(0))
      )
      .catch(console.error);
  }, []);

  const clearSharedData = async () => {
    setDeletingInstances(true);
    try {
      await fsa.emptyDir(dataStorePath);
      await fsa.emptyDir(instancesPath);
      await fsa.emptyDir(tempPath);
    } catch (e) {
      console.error(e);
    }
    setDeletingInstances(false);
  };

  const changeDataPath = async () => {
    setLoadingMoveUserData(true);
    const appData = await ipcRenderer.invoke('getAppdataPath');
    const appDataPath = path.join(appData, 'gdlauncher_next');

    const notCopiedFiles = [
      'Cache',
      'Code Cache',
      'Dictionaries',
      'GPUCache',
      'Cookies',
      'Cookies-journal'
    ];
    await fsa.writeFile(path.join(appDataPath, 'override.data'), dataPath);

    if (moveUserData) {
      try {
        const files = await fs.readdir(userData);
        await Promise.all(
          files.map(async name => {
            if (!notCopiedFiles.includes(name)) {
              await fsa.copy(
                path.join(userData, name),
                path.join(dataPath, name),
                {
                  overwrite: true
                }
              );
            }
          })
        );
      } catch (e) {
        console.error(e);
      }
    }
    setLoadingMoveUserData(false);
    await ipcRenderer.invoke('appRestart');
  };

  const openFolder = async () => {
    const { filePaths, canceled } = await ipcRenderer.invoke(
      'openFolderDialog',
      userData
    );
    if (!filePaths[0] || canceled) return;
    setDataPath(filePaths[0]);
  };


  const [showTaskbar, setShowTaskbar] = useState(false);
  useEffect(async () => {
    const state = await ipcRenderer.invoke("get-config-key", "showTaskbar");
    setShowTaskbar(state);
  });

  const updateShowTaskbar = async (state) => {
    await ipcRenderer.invoke("config-update", "showTaskbar", state);
    setShowTaskbar(state);
  }


  return (
    <>
      <PersonalData>
        <MainTitle>General</MainTitle>
        <PersonalDataContainer>
          <ProfileImage
            src={profileImage ? `data:image/jpeg;base64,${profileImage}` : null}
          />
          <div
            css={`
              margin: 20px 20px 20px 40px;
              width: 330px;
              * {
                text-align: left;
              }
            `}
          >
            <div>
              Username <br />
              <Username>{currentAccount.selectedProfile.name}</Username>
            </div>
            <div>
              UUID
              <br />
              <Uuid>
                {dashUuid(currentAccount.selectedProfile.id)}
                <Tooltip title={copiedUuid ? 'Copied' : 'Copy'} placement="top">
                  <div
                    css={`
                      width: 13px;
                      height: 14px;
                      margin: 0 0 0 10px;
                    `}
                  >
                    <FontAwesomeIcon
                      icon={faCopy}
                      onClick={() =>
                        copy(
                          setCopiedUuid,
                          dashUuid(currentAccount.selectedProfile.id)
                        )
                      }
                    />
                  </div>
                </Tooltip>
              </Uuid>
            </div>
          </div>
        </PersonalDataContainer>
      </PersonalData>
      <Title>Release Channel</Title>
      <Content>
        <p>
          Empfohlen wird: Stable.
        </p>
        <Select
          css={`
            width: 100px;
          `}
          onChange={async e => {
            const appData = await ipcRenderer.invoke('getAppdataPath');
            setReleaseChannel(e);
            await fsa.writeFile(
              path.join(appData, 'gdlauncher_next', 'rChannel'),
              e.toString()
            );
          }}
          value={releaseChannel}
          virtual={false}
        >
          <Select.Option value={0}>Stable</Select.Option>
          <Select.Option value={1}>Beta</Select.Option>
        </Select>
      </Content>

      <Title>
        Concurrent Downloads &nbsp; <FontAwesomeIcon icon={faTachometerAlt} />
      </Title>
      <Content>
        <p>
          Select the number of concurrent downloads. If you have a slow
          connection, select at most 3.
        </p>
        <Select
          onChange={v => dispatch(updateConcurrentDownloads(v))}
          value={concurrentDownloads}
          css={`
            width: 70px;
            text-align: start;
          `}
          virtual={false}
        >
          {[...Array(20).keys()]
            .map(x => x + 1)
            .map(x => (
              <Select.Option key={x} value={x}>
                {x}
              </Select.Option>
            ))}
        </Select>
      </Content>
      <Title>
        Instance Sorting &nbsp; <FontAwesomeIcon icon={faSort} />
      </Title>
      <Content>
        <p
          css={`
            margin: 0;
            width: 400px;
          `}
        >
          Wähle aus, wie die Instanzen sortert sein sollen.
        </p>

        <Select
          onChange={v => dispatch(updateInstanceSortType(v))}
          value={instanceSortMethod}
          css={`
            width: 136px;
            text-align: start;
          `}
        >
          <Select.Option value={0}>Alphabetisch</Select.Option>
          <Select.Option value={1}>Zuletzt gespielt</Select.Option>
          <Select.Option value={2}>Am meißten gespielt</Select.Option>
        </Select>
      </Content>
      <Title>
        Bevorzugter Release Channel &nbsp; <FontAwesomeIcon icon={faFire} />
      </Title>
      <Content>
        <p>
          Wähle deinen Bevorzugten Release Channel für updates von Mods aus.
        </p>
        <Select
          css={`
            width: 100px;
            text-align: start;
          `}
          onChange={e => dispatch(updateCurseReleaseChannel(e))}
          value={curseReleaseChannel}
          virtual={false}
        >
          <Select.Option value={1}>Stable</Select.Option>
          <Select.Option value={2}>Beta</Select.Option>
          <Select.Option value={3}>Alpha</Select.Option>
        </Select>
      </Content>
      <Title>
        Discord Integration &nbsp; <FontAwesomeIcon icon={faDiscord} />
      </Title>
      <Content>
        <p>
          Aktiviere / deaktiviere die Discord Integration. Diese zeigt in Discord an, was du spielst.
        </p>
        <Switch
          onChange={e => {
            dispatch(updateDiscordRPC(e));
            if (e) {
              ipcRenderer.invoke('init-discord-rpc');
            } else {
              ipcRenderer.invoke('shutdown-discord-rpc');
            }
          }}
          checked={DiscordRPC}
        />
      </Content>
      <Title>
        Minecraft News &nbsp; <FontAwesomeIcon icon={faNewspaper} />
      </Title>
      <Content>
        <p>Aktiviere / deaktiviere Minecraft News.</p>
        <Switch
          onChange={e => {
            dispatch(updateShowNews(e));
          }}
          checked={showNews}
        />
      </Content>
      <Title>
        Launcher verstecken, während des spielens &nbsp; <FontAwesomeIcon icon={faPlay} />
      </Title>
      <Content>
        <p>
          Soll der Launcher versteckt währen, während du spielst?
          Er kann weiterhin über das Systemicon geöffnet werden.
        </p>
        <Switch
          onChange={e => {
            dispatch(updateHideWindowOnGameLaunch(e));
          }}
          checked={hideWindowOnGameLaunch}
        />
      </Content>
      <Title>
        KartoffelPC Modus &nbsp; <FontAwesomeIcon icon={faToilet} />
      </Title>
      <Content>
        <p>
          Du hast einen KartoffelPC? Keine Sorge! Wir kümmern uns. Aktiviere diese Option
          und alle Animationen und Spezialeffekte werden deaktiviert sein.
        </p>
        <Switch
          onChange={e => {
            dispatch(updatePotatoPcMode(e));
          }}
          checked={potatoPcMode}
        />
      </Content>
      <Title>
        Geteilte Daten löschen&nbsp; <FontAwesomeIcon icon={faTrash} />
      </Title>
      <Content>
        <p>
          Warnung: Diese Option lösche alle geteilten Daten zwischen den Instanzen
          und wird alle Instanz-Daten löschen.
        </p>
        <Button
          onClick={() => {
            dispatch(
              openModal('ActionConfirmation', {
                message: 'Are you sure you want to delete shared data?',
                confirmCallback: clearSharedData,
                title: 'Confirm'
              })
            );
          }}
          disabled={disableInstancesActions}
          loading={deletingInstances}
        >
          Clear
        </Button>
      </Content>
      <Title>
        Nutzer-Daten-Pfad&nbsp; <FontAwesomeIcon icon={faFolder} />
        <a
          css={`
            margin-left: 30px;
          `}
          onClick={async () => {
            const appData = await ipcRenderer.invoke('getAppdataPath');
            const appDataPath = path.join(appData, 'gdlauncher_next');
            setDataPath(appDataPath);
          }}
        >
          Pfad zurücksetzen
        </a>
      </Title>
      <CustomDataPathContainer>
        <div
          css={`
            display: flex;
            justify-content: space-between;
            text-align: left;
            width: 100%;
            height: 30px;
            margin-bottom: 10px;
            p {
              text-align: left;
              color: ${props => props.theme.palette.text.third};
            }
          `}
        >
          <Input
            value={dataPath}
            onChange={e => setDataPath(e.target.value)}
            disabled={
              loadingMoveUserData ||
              deletingInstances ||
              disableInstancesActions
            }
          />
          <Button
            css={`
              margin-left: 20px;
            `}
            onClick={openFolder}
            disabled={loadingMoveUserData || deletingInstances}
          >
            <FontAwesomeIcon icon={faFolder} />
          </Button>
          <Button
            css={`
              margin-left: 20px;
            `}
            onClick={changeDataPath}
            disabled={
              disableInstancesActions ||
              userData === dataPath ||
              !dataPath ||
              dataPath.length === 0 ||
              deletingInstances
            }
            loading={loadingMoveUserData}
          >
            Anwenden & Neustarten
          </Button>
        </div>
        <div
          css={`
            display: flex;
            justify-content: flex-start;
            width: 100%;
          `}
        >
          <Checkbox
            onChange={e => {
              setMoveUserData(e.target.checked);
            }}
          >
            Alle Daten in ein neues Verzeichnis kopieren
          </Checkbox>
        </div>
      </CustomDataPathContainer>
      <LauncherVersion>
        <Title>
          Updates
          <a
            css={`
            margin-left: 30px;
          `}
            onClick={() => {
              dispatch(closeModal());
              dispatch(push('/onboarding'));
            }}
          >
            Onboarding Screen erneut öffnen
          </a>
        </Title>
        <div
          css={`
            display: flex;
            justify-content: flex-start;
            align-items: center;
            margin: 10px 0;
          `}
        >
          <HorizontalLogo
            size={100}
            onClick={() => dispatch(openModal('ChangeLogs'))}
          />{' '}
          <div
            css={`
              margin-left: 10px;
            `}
          >
            v {version}
          </div>
        </div>
        <p>
          {updateAvailable
            ? 'Ein Update des Launchers ist verfügbar.. Klicke auf "aktualisieren" um den Launcher zu Updaten.'
            : 'Du benutzt die neuste Version unseres Launchers. Wenn ein Update möglich ist informieren wir dich automatisch.'}
        </p>
        <div
          css={`
            margin-top: 20px;
            height: 36px;
            display: flex;
            flex-direction: row;
          `}
        >

        </div>
      </LauncherVersion>
    </>
  );
};

export default memo(General);
