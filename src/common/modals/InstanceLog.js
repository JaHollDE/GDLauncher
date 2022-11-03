import React, { useEffect, useRef, useState } from "react";
import { ipcRenderer } from "electron";
import { useDispatch } from "react-redux";
import Modal from '../components/Modal';
import { Button } from "antd";
import { getDevURL } from "../../app/desktop/utils/jaholldeVerification";

const InstanceLog = function ({ instanceName }) {
  const dispatch = useDispatch();

  const logData = useRef([]);
  const logElement = useRef();

  const [logCode, setLogCode] = useState("");

  const lastUpdate = useRef(0);

  const uploadLogs = async () => {
    if ((Date.now() - lastUpdate.current) < 30*1000) {
      setLogCode("30 Sekunden Wartezeit!");
      return;
    }
    lastUpdate.current = Date.now();

    const url = await getDevURL(false);
    const path = `${url}/api/upload_logs`;
    const result = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        minecraftLog: logData.current.join("\n")
      })
    });
    setLogCode(await result.text());
  }

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
      } else {
        logData.current = ["Es sind keine Logs vorhanden"];
        logElement.current.innerText = "Es sind keine Logs vorhanden";
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
        height: calc(100% - 10px);
        width: calc(100% - 10px);
        overflow-x: hidden;
      `}
        title={`Logs von ${instanceName}`}
      >
        <div
          css={`
          display: flex;
          flex-direction: column;
          position: relative;
          height: 100%;
        `}
        >
          <label>{logCode}</label>
          <Button onClick={uploadLogs}>Hochladen</Button>
          <div ref={logElement} css={`
            display: flex;
            flex-direction: column-reverse;
            text-align: left;
            overflow-y: auto;
          `}>

          </div>
        </div>
      </Modal>
  )
}

export default InstanceLog;