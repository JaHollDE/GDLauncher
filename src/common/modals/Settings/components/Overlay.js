import { useDispatch, useSelector } from "react-redux";
import { _getCurrentAccount, _getDataStorePath, _getInstancesPath, _getTempPath } from "../../../utils/selectors";
import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMaximize } from "@fortawesome/free-solid-svg-icons";
import { Slider, Switch } from "antd";
import styled from "styled-components";
import { updateJavaMemory } from "../../../reducers/settings/actions";
import { marks, scaleMem, scaleMemInv, sysMemScaled } from "../../../utils";

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

const Overlay = () => {
  const dispatch = useDispatch();

  const [scaling, setScaling] = useState(1.0);
  useEffect(async () => {
    const state = await ipcRenderer.invoke("get-config-key", "windowScaling");
    setScaling(state);
  }, []);

  const updateScaling = async (state) => {
    await ipcRenderer.invoke("config-update", "windowScaling", state);
    setScaling(state);
  }

  const [showTaskbar, setShowTaskbar] = useState(false);
  useEffect(async () => {
    const state = await ipcRenderer.invoke("get-config-key", "showTaskbar");
    setShowTaskbar(state);
  }, []);

  const updateShowTaskbar = async (state) => {
    await ipcRenderer.invoke("config-update", "showTaskbar", state);
    setShowTaskbar(state);
  }


  return (
    <>
      <PersonalData>
        <MainTitle>Overlay</MainTitle>

        <>
          <Title>
            Overlay in Taskleiste &nbsp; <FontAwesomeIcon icon={faWindowMaximize} />
          </Title>
          <Content>
            <p>
              <span>Das Overlay als Fenster in der Taskleiste anzeigen. Diese Funktion wird hauptsächlich für das <b css={"margin: 0 !important;"}>Streamen</b> des Overlays als Fenster benötigt.</span>
              <p>
                <b>Erfordert einen Neustart von Minecraft.</b>
              </p>
            </p>

            <Switch
              onChange={e => {
                updateShowTaskbar(e)
              }}
              checked={showTaskbar}
            />
          </Content>
        </>

        <>
          <Title>
            Overlay-Skalierung
          </Title>
          <Content>
            <p css={"flex-grow: 1; margin: 0 !important;"}>
              <span>Skalierung aller Elemente im Overlay.</span>
              <p>
                <b>Erfordert keinen Neustart von Minecraft, wird sofort angewandt.</b>
              </p>
              <p css={"display: flex; flex-direction: row; flex-wrap: nowrap"}>
                <Slider
                  css={`
                    margin: 20px 40px !important;
                    white-space: nowrap;
                    z-index: 20;
                    flex: 1;
                  `}
                  onChange={e =>
                    updateScaling(e)
                  }
                  defaultValue={scaling}
                  min={0.2}
                  max={4}
                  step={0.1}
                  //marks={marks}
                  //valueLabelDisplay="disabled"
                />
                <div
                  css={`
                    display: grid;
                    place-items: center;
                    width: 100px;
                  `}
                >
                  x{scaling}
                </div>
              </p>
            </p>



          </Content>
        </>

      </PersonalData>
    </>
  )
}

export default Overlay;