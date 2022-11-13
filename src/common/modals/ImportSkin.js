import Modal from "../components/Modal";
import styled from "styled-components";
import React, { memo, useEffect } from "react";
import Logo from "../../ui/Logo";
import fs from "fs";
import path from "path";
import { ipcRenderer } from "electron";
import { closeModal, openModal } from "../reducers/modals/actions";
import { useDispatch } from "react-redux";

const ImportSkin = ({ editPath = "", variant = "", edit = false }) => {

  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [selectedVariant, setSelectedVariant] = React.useState(null);

  useEffect(() => {
    if (editPath === "") return;
    const file = fs.readFileSync(String(editPath));
    setSelectedFile(file);
    setSelectedVariant(variant);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const userData = await ipcRenderer.invoke("getUserData");
    const folder = path.join(userData, "skins");
    const skinsFile = path.join(folder, "skins.json");
    if (!selectedFile || !selectedVariant) {
      return;
    }

    if (edit) {
      const skins = JSON.parse(fs.readFileSync(skinsFile).toString());
      skins.forEach((skin) => {
        if (skin.name === path.relative(folder, editPath).split(".")[0]) {
          skin.variant = selectedVariant;
        }
      });
      fs.writeFileSync(skinsFile, JSON.stringify(skins));

      dispatch(closeModal());
      setTimeout(() => {
        dispatch(openModal("Success", {
          title: "Erfolg!", message: "Der Skin wurde erfolgreich bearbeitet."
        }));
      }, 225);
      return;
    }

    if (fs.existsSync(path.join(folder, selectedFile.name))) {
      setTimeout(() => {
        dispatch(openModal("InstanceCrashed", {
          code: 5, errorLogs: "Eine Datei mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen aus."
        }));
      }, 225);
      return;
    }

    fs.copyFileSync(selectedFile.path, path.join(folder, selectedFile.name));
    const skins = JSON.parse(fs.readFileSync(skinsFile).toString());
    skins.push({
      name: selectedFile.name.split(".")[0], variant: selectedVariant
    });
    fs.writeFileSync(skinsFile, JSON.stringify(skins));
    dispatch(closeModal());
    setTimeout(() => {
      dispatch(openModal("Success", {
        title: "Erfolg!", message: "Dein Skin wurde erfolgreich importiert."
      }));
    }, 225);
  };

  // File input
  return (<Modal
    css={`
      height: auto;
      width: 350px;
    `}
    title={!edit ? "Skin importieren" : "Skin bearbeiten"}
  >
    <Container>
      <Logo size={100} />
      <Title>{!edit ? "Skin Import" : "Bearbeiten"}</Title>
      {!edit && (<Upload type={"file"} value={selectedFile} onChange={event => setSelectedFile(event.target.files[0])}
                         accept="image/png, image/jpeg" />)}
      <Variant name={"variant"} id={"variant"} onChange={event => setSelectedVariant(event.target.value)}>
        <option value={""} selected={!selectedVariant}></option>
        <option value={"Classic"} selected={selectedVariant === "classic"}>Classic</option>
        <option value={"Slim"} selected={selectedVariant === "slim"}>Slim</option>
      </Variant>
      <Button type={"submit"} name={"submit"} value={!edit ? "Importieren" : "Speichern"}
              onClick={event => submit(event)} />
    </Container>
  </Modal>);

};

export default memo(ImportSkin);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 900;
  margin-top: 1rem;
  color: ${props => props.theme.palette.text.primary};
`;

const Upload = styled.input`
  left: 50%;
  flex-grow: 1;
  margin-top: 1rem;
  color: ${props => props.theme.palette.text.primary};
`;

const Variant = styled.select`
  flex-grow: 1;
  margin-top: 1rem;
  background-color: #000c17;
  color: ${props => props.theme.palette.text.primary};
`;

const Button = styled.input`
  flex-grow: 1;
  margin-top: 1rem;
  background-color: #000c17;
`;