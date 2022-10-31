import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { createInstance } from "../../app/desktop/utils/instanceCreation";
import { closeModal } from "../reducers/modals/actions";
import Modal from "../components/Modal";
import { Button, Checkbox, Form, Input, Spin } from "antd";
import { getDevURL } from "../../app/desktop/utils/jaholldeVerification";
import { ipcRenderer } from "electron";

const Cookies = function ({force}) {
  const dispatch = useDispatch();

  const [cookies, setCookies] = useState([]);

  useEffect(async () => {
    const request = await fetch(`${getDevURL(false)}/api/cookies`);
    const content = await request.text();
    setCookies(content.split("\n"));
  });

  const quitApp = () => {
    ipcRenderer.invoke('quit-app');
  }
  const accept = () => {
    ipcRenderer.invoke("config-update", "agreedToCookies", true);
    dispatch(closeModal());
  }

  return (
    <Modal
      preventClose={force}
      css={`
                width: 100%;
                height: 100%;
                overflow-x: hidden;
            `}
      title={`Datenschutzerklärung`}
    >
      <div css={`
        overflow-y: auto;
        max-height: 100%;
      `}>
        {cookies.map(element => (
          <p css={"margin-top: .2rem; margin-bottom: .2rem;"}>{element}</p>
        ))}

        <p css={"margin-top: 1rem;"}>
          {force ? (
            <>
              <Button onClick={accept}>Akzeptieren</Button>
              <Button onClick={quitApp}>Launcher schließen</Button>
            </>
          ) : (
            <>
              <Button onClick={() => dispatch(closeModal())}>Schließen</Button>
            </>
          )}

        </p>
      </div>

    </Modal>
  );
};

export default Cookies;
