import React, { memo, useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { LoadingOutlined } from '@ant-design/icons';
import Modal from '../components/Modal';
import {ipcRenderer} from "electron";

let timer;

const InstanceStartupAd = function ({ instanceName }) {
  const dispatch = useDispatch();

  const logData = useRef([]);
  const logElement = useRef();
  //const [logState, setLogState] = useState([]);

  useEffect(() => {
    const channel = "minecraft-log";

    const cb = (event, instance, log) => {
      if (instance === instanceName) {
        logData.current.push(log);
        logElement.current.innerText += "\n" + log;
      }
    }

    ipcRenderer.invoke("get-logs", instanceName).then(logs => {
      if (logs !== undefined) {
        logData.current = logs;
        logElement.current.innerText = logData.current.join("\n");
      }

      ipcRenderer.addListener(channel, cb);

    })

    return () => {
      ipcRenderer.removeListener(channel, cb);
    }
  }, []);

  return (
    <Modal
      css={`
        height: 330px;
        width: 650px;
        overflow-x: hidden;
      `}
      title={`Es startet die Instanz ${instanceName}`}
    >
      <div
        css={`
          display: flex;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          position: relative;
          height: 100%;
        `}
      >
        <span
          css={`
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            margin-top: 20px;
          `}
        >
          Das Spiel startet...
          <LoadingOutlined
            css={`
              margin-left: 30px;
              font-size: 50px;
            `}
          />
        </span>
        <div ref={logElement} css={`
          background-color: rgba(0, 0, 0, 0.5);
          flex-grow: 1;
          display: flex;
          flex-direction: column-reverse;
          overflow-y: auto;
          text-align: left;
          color: rgba(255, 255, 255, 0.7);
        `}>
        </div>
      </div>
    </Modal>
  );
};

export default InstanceStartupAd;
