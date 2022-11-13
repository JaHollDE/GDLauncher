import Modal from "../../components/Modal";
import { Button } from "antd";
import React, { useEffect } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import path from "path";
import fs from "fs";
import { useDispatch, useSelector } from "react-redux";
import { _getCurrentAccount } from "../../utils/selectors";
import ReactSkinview3d from "react-skinview3d";
import { msMinecraftUploadSkin } from "../../api";
import { closeModal, openModal } from "../../reducers/modals/actions";
import { getPlayerSkin } from "../../../app/desktop/utils";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import { faTrash, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const JaHollDESkinManager = () => {
  function importSkin() {
    dispatch(closeModal());
    setTimeout(() => {
      dispatch(openModal("ImportSkin"));
    }, 225);
  }

  const [skins, setSkins] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [selectedElement, setSelectedElement] = React.useState(null);
  const account = useSelector(_getCurrentAccount);
  const skinsFile = React.useRef(null);
  const folderRef = React.useRef(null);
  const dispatch = useDispatch();
  const [currentSkin, setCurrentSkin] = React.useState(null);

  const chooseSkin = (event, skin) => {
    event.preventDefault();
    let element = event.target.parentElement;
    if (selected && selectedElement) {
      selectedElement.style.border = "none";
      setSelected(null);
      setSelectedElement(null);
      if (selectedElement === element) return;
    }
    element.style.border = "2px solid #1ba70c";
    setSelected(skin);
    setSelectedElement(element);
  };


  useEffect(async () => {
    const userData = await ipcRenderer.invoke("getUserData");
    const folder = path.join(userData, "skins");
    const file = path.join(folder, "skins.json");
    fs.mkdirSync(folder, { recursive: true });
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "[]");
    }
    folderRef.current = folder;
    skinsFile.current = file;

    fs.readdir(folder, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }

      setSkins(skins => [...skins, ...files
        .map(file => path.join(folder, file))
        .filter(file => !path.basename(file).includes(account.selectedProfile.name))
        .filter(file => path.extname(file) === ".png")]);
    });
    let url = await getPlayerSkin(account.selectedProfile.id);
    setCurrentSkin(url);
  }, []);

  function getSkinName(input) {
    return path.relative(folderRef.current, input).split(".")[0];
  }

  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  function getVariant(input) {
    let name = getSkinName(input);
    let result = "Classic";
    JSON.parse(fs.readFileSync(skinsFile.current).toString()).forEach(skin => {
      if (skin.name === name) {
        result = skin.variant;
      }
    });
    return result.toLowerCase();
  }

  async function applySkin() {
    let variant = getVariant(selected);
    if (!variant) variant = "Classic";
    msMinecraftUploadSkin(account.accessToken, selected, variant, getSkinName(selected)).then(
      function success(data) {
        if (data.code === 200) {
          dispatch(closeModal());
          setTimeout(() => {
            dispatch(openModal("Success", {
              title: "Erfolg!", message: "Dein Skin wurde erfolgreich geändert."
            }));
          }, 225);
        }
      },
      function error() {
        setTimeout(() => {
          dispatch(closeModal());
          dispatch(
            openModal("InstanceCrashed", {
              code: 5,
              errorLogs:
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
            })
          );
        }, 225);
      }
    );
    return undefined;
  }

  const deleteSkin = (event, data) => {
    let parent = event.target.parentElement.parentElement;
    if (parent) {
      event.target.parentElement.parentElement.remove();
      fs.rmSync(data.skin);
      // remove it from the skins
      setSkins(skins => skins.filter(skin => skin !== data.skin));
      if (parent === selected) {
        setSelectedElement(null);
        setSelected(null);
      }
    }
  };

  const editSkin = (event, data) => {
    dispatch(closeModal());
    setTimeout(() => {
      dispatch(openModal("ImportSkin", { editPath: data.skin, variant: getVariant(data.skin), edit: true }));
    }, 225);
  };

  return (
    <Modal
      css={`
        width: 800px;
        max-width: 800px;
        min-height: 400px;
        max-height: 900px;
      `}
      title="JaHollDE-SkinManager"
    >
      <Container>
        <Button
          css={`
            position: absolute;
            left: 50%;
            top: 0.5rem;
            margin-bottom: 5rem;
            transform: translateX(-50%);
          `}
          type="primary"
          onClick={importSkin}
        >
          Neuen Skin importieren
        </Button>
        {selected && (<Button
          css={`
            position: absolute;
            left: 70%;
            top: 0.5rem;
            margin-bottom: 5rem;
            transform: translateX(-50%);
            background-color: green;
          `}
          type="primary"
          onClick={applySkin}
        >
          Speichern
        </Button>)}
        <Row>
          <SkinContainer>
            <SkinLabel>Dein Skin:</SkinLabel>
            <Button css={`height: 250px;
              border-color: #516682;`}>
              <ReactSkinview3d skinUrl={currentSkin} height={250} width={100}
                               onReady={({ viewer }) => viewer.controls.enableZoom = false} />
            </Button>
          </SkinContainer>

          {skins.map((skin) => (
            <SkinContainer>
              <ContextMenuTrigger id={`skin_${skin}`} holdToDisplay={-1}>
                <Button css={`height: 250px;`} onClick={event => chooseSkin(event, skin)}>
                  <ReactSkinview3d skinUrl={skin} height={250} width={100}
                                   onReady={({ viewer }) => viewer.controls.enableZoom = false} />
                </Button>
                <VariantFooterLabel>{capitalize(getVariant(skin))}</VariantFooterLabel>
              </ContextMenuTrigger>

              <ContextMenu id={`skin_${skin}`}>
                <MenuItem data={{ skin: skin }} onClick={editSkin}>
                  <FontAwesomeIcon
                    icon={faWrench}
                    css={`
                      margin-right: 10px;
                      width: 25px !important;
                    `}
                  />
                  Skin bearbeiten
                </MenuItem>
                <MenuItem divider />
                <MenuItem data={{ skin: skin }} css={`color: red`} onClick={deleteSkin}>
                  <FontAwesomeIcon
                    icon={faTrash}
                    css={`
                      margin-right: 10px;
                      width: 25px !important;
                    `}
                  />
                  Skin löschen
                </MenuItem>
              </ContextMenu>
            </SkinContainer>
          ))}
        </Row>
      </Container>

    </Modal>
  );
};
export default JaHollDESkinManager;


const Container = styled.div`
  display: inline-flex;
  flex-direction: column;
  width: 100%;
  align-content: space-between;
  row-gap: .5rem;
  flex-wrap: wrap;
  overflow-y: auto;
  min-height: 350px;
  max-height: 600px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 23px;
  padding-top: 15px;
`;

const SkinContainer = styled.div`
  max-width: 7rem;
  align-self: center;
  position: relative;
  top: 0.6rem;
  margin: 6px;
`;
const SkinLabel = styled.div`
  position: absolute;
  top: -1.5rem;
  left: 1rem;
  right: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
`;
const VariantFooterLabel = styled.div`
  position: absolute;
  bottom: -1.0rem;
  left: 1rem;
  right: 0;
  text-align: center;
  font-size: 1.0rem;
  font-weight: bold;
`;