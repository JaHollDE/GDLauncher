import React, { useEffect, useRef, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faFileDownload
} from '@fortawesome/free-solid-svg-icons';
import { ipcRenderer } from 'electron';
import styled from 'styled-components';
import Modal from '../components/Modal';
import { UPDATE_MODAL } from '../reducers/modals/actionTypes';
import { closeModal } from '../reducers/modals/actions';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-conter: space-between;
  align-items: center;
  text-align: center;
  color: ${props => props.theme.palette.text.primary};
`;

const ModsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  width: 100%;
  height: 100%;
  max-height: 250px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  height: 20px;
  padding: 20px 10px;
  background: ${props => props.theme.palette.grey[800]};

  &:hover {
    .rowCenterContent {
      color: ${props => props.theme.palette.text.primary};
    }
  }

  .dot {
    border-radius: 50%;
    height: 10px;
    width: 10px;
    background: ${props => props.theme.palette.colors.green};
  }
`;

const ModRow = ({
  mod,
  loadedMods,
  currentMod,
  missingMods,
  cloudflareBlock,
  downloadUrl
}) => {
  const { modManifest, addon } = mod;
  const loaded = loadedMods.includes(modManifest.id);
  const missing = missingMods.includes(modManifest.id);
  const ref = useRef();

  const isCurrentMod = currentMod?.modManifest?.id === modManifest.id;

  useEffect(() => {
    if (!loaded && isCurrentMod) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [isCurrentMod, loaded]);

  return (
    <RowContainer ref={ref}>
      <div>{`${addon?.name} - ${modManifest?.displayName}`}</div>
      {loaded && !missing && !cloudflareBlock && <div className="dot" />}
      {loaded && missing && !cloudflareBlock && (
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          css={`
            color: ${props => props.theme.palette.colors.yellow};
          `}
        />
      )}
      {loaded && !missing && cloudflareBlock && (
        <Button href={downloadUrl}>
          <FontAwesomeIcon icon={faFileDownload} />
        </Button>
      )}
      {!loaded && isCurrentMod && (
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      )}
    </RowContainer>
  );
};

const OptedOutModsList = ({
  optedOutMods,
  instancePath,
  resolve,
  reject,
  preventClose
}) => {
  const [loadedMods, setLoadedMods] = useState([]);
  const [missingMods, setMissingMods] = useState([]);
  const [cloudflareBlock, setCloudflareBlock] = useState(false);
  const [manualDownloadUrls, setManualDownloadUrls] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const dispatch = useDispatch();
  const modals = useSelector(state => state.modals);

  const optedOutModalIndex = modals.findIndex(
    x => x.modalType === 'OptedOutModsList'
  );

  const currentMod = downloading ? optedOutMods[loadedMods.length] : null;

  useEffect(() => {
    const listener = () => {
      dispatch(closeModal());
      setTimeout(() => {
        reject('Das Download-Fenster wurde unerwartet beendet!');
      }, 300);
    };

    ipcRenderer.once('opted-out-window-closed-unexpected', listener);

    return () => {
      ipcRenderer.removeListener(
        'opted-out-window-closed-unexpected',
        listener
      );
    };
  }, []);

  useEffect(() => {
    const listener = (e, status) => {
      if (!status.error) {
        if (optedOutMods.length === loadedMods.length + 1) {
          if (missingMods.length === 0 && !cloudflareBlock) {
            resolve();
            dispatch(closeModal());
          }
          setDownloading(false);
        }
        setLoadedMods(prev => [...prev, status.modId]);
        if (status.warning) {
          if (!status.cloudflareBlock) {
            setMissingMods(prev => [...prev, status.modId]);
          } else {
            setCloudflareBlock(true);
            setManualDownloadUrls(prev => [...prev, status.modId]);
          }
        }
      } else {
        dispatch(closeModal());
        setTimeout(() => {
          reject(status.error);
        }, 300);
      }
    };

    ipcRenderer.once('opted-out-download-mod-status', listener);

    return () => {
      ipcRenderer.removeListener(
        'opted-out-window-closed-unexpected',
        listener
      );
    };
  }, [loadedMods, missingMods, cloudflareBlock, manualDownloadUrls]);

  return (
    <Modal
      css={`
        height: 400px;
        width: 800px;
        overflow-x: hidden;
      `}
      preventClose={preventClose}
      closeCallback={() => {
        setTimeout(
          () => reject(new Error('Der Download wurde vom User abgebrochen.')),
          300
        );
      }}
      title="Opted out mods list"
    >
      <Container>
        <div
          css={`
            text-align: left;
            margin-bottom: 2rem;
          `}
        >
          Hey! Sieht so aus als ob einige Developer ihre Mods vom Anzeigen in Launchern ausgeschlossen haben.
          Wir können diese immer noch automatisch für dich herunterladen.
          Bitte klicke auf "fortfahren" und warte bis die Downloads abgeschlossen sind.
          Bitte klicke nichts in den Fenstern, die sich während dem Download öffnen.
          Wenn alle Mods heruntergeladen wurden schließen sich die Fenster von allein.
        </div>
        <ModsContainer>
          {optedOutMods &&
            optedOutMods.map(mod => {
              return (
                <ModRow
                  mod={mod}
                  loadedMods={loadedMods}
                  currentMod={currentMod}
                  missingMods={missingMods}
                  cloudflareBlock={cloudflareBlock}
                  downloadUrl={`${mod.addon.links.websiteUrl}/download/${mod.modManifest.id}`}
                />
              );
            })}
        </ModsContainer>
        {cloudflareBlock && (
          <p
            css={`
              width: 90%;
              margin: 20px auto 0 auto;
            `}
          >
            Cloudflare is currently blocking automated downloads. You can
            manually download the mods and place them in the mods folder to
            continue. Use the download buttons in the rows above, and the button
            below to open the instance folder.
          </p>
        )}
        <div
          css={`
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-top: 20px;
          `}
        >
          <Button
            danger
            type="text"
            disabled={downloading || loadedMods.length !== 0}
            onClick={() => {
              dispatch(closeModal());
              setTimeout(
                () => reject(new Error('Download Aborted by the user')),
                300
              );
            }}
          >
            Abbrechen
          </Button>
          {missingMods.length === 0 && !cloudflareBlock && (
            <Button
              type="primary"
              disabled={downloading}
              onClick={() => {
                setDownloading(true);

                dispatch({
                  type: UPDATE_MODAL,
                  modals: [
                    ...modals.slice(0, optedOutModalIndex),
                    {
                      modalType: 'OptedOutModsList',
                      modalProps: {
                        ...modals[optedOutModalIndex].modalProps,
                        preventClose: true
                      }
                    },
                    ...modals.slice(optedOutModalIndex + 1)
                  ]
                });
                ipcRenderer.invoke('download-optedout-mods', {
                  mods: optedOutMods,
                  instancePath
                });
              }}
              css={`
                background-color: ${props => props.theme.palette.colors.green};
              `}
            >
              fortfahren
            </Button>
          )}
          {missingMods.length > 0 && !cloudflareBlock && (
            <Button
              type="primary"
              disabled={downloading}
              onClick={() => {
                resolve();
                dispatch(closeModal());
              }}
              css={`
                background-color: ${props => props.theme.palette.colors.green};
              `}
            >
              fortfahren
            </Button>
          )}
          {cloudflareBlock && (
            <>
              <Button
                type="primary"
                disabled={downloading}
                onClick={() => {
                  ipcRenderer.invoke('openFolder', instancePath);
                }}
                css={`
                  background-color: ${props => props.theme.palette.colors.blue};
                `}
              >
                Open folder
              </Button>
              <Button
                type="primary"
                disabled={downloading}
                onClick={() => {
                  resolve();
                  dispatch(closeModal());
                }}
                css={`
                  background-color: ${props =>
                    props.theme.palette.colors.green};
                `}
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </Container>
    </Modal>
  );
};

export default OptedOutModsList;
