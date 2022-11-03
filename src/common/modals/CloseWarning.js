import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { createInstance } from "../../app/desktop/utils/instanceCreation";
import { closeModal } from "../reducers/modals/actions";
import Modal from "../components/Modal";
import { Button, Checkbox, Form, Input, Spin } from "antd";
import { getDevURL } from "../../app/desktop/utils/jaholldeVerification";
import { ipcRenderer } from "electron";

const CloseWarning = function () {
  const dispatch = useDispatch();

  const quitApp = () => {
    ipcRenderer.invoke('quit-app');
  }

  const cancel = () => {
    dispatch(closeModal());
  }

  return (
    <Modal
      css={`
                height: 330px;
                width: 650px;
                overflow-x: hidden;
            `}
      title={`Schließen`}
    >
      <h2>Möchtest du den Launcher wirklich beenden?</h2>
      <h4>Das Overlay wird sich auch schließen.</h4>

      <div css={`display: flex; flex-direction: row; flex-wrap: nowrap;`}>
        <Button onClick={quitApp}>Schließen</Button>
        <Button onClick={cancel}>Abbrechen</Button>
      </div>
    </Modal>
  );
};

export default CloseWarning;
