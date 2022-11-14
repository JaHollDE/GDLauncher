import Modal from "../components/Modal";
import styled from "styled-components";
import React, { memo, useEffect } from "react";
import Logo from "../../ui/Logo";
import fs from "fs";
import path from "path";
import { ipcRenderer } from "electron";
import { closeModal, openModal } from "../reducers/modals/actions";
import { useDispatch } from "react-redux";
import { Button, Form, Select } from "antd";

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
    const userData = await ipcRenderer.invoke("getUserData");
    const folder = path.join(userData, "skins");
    const skinsFile = path.join(folder, "skins.json");
    if (!selectedFile || !selectedVariant) {
      return;
    }

    if (edit) {
      const skins = JSON.parse(fs.readFileSync(skinsFile).toString());
      skins.forEach((skin) => {
        if (skin.name === path.relative(folder, editPath)) {
          skin.variant = selectedVariant;
        }
      });
      fs.writeFileSync(skinsFile, JSON.stringify(skins));

      dispatch(closeModal());
      setTimeout(() => {
        dispatch(openModal("Success", {
          title: "Erfolg!", message: "Der Skin wurde erfolgreich bearbeitet.", closeCallback: () => {
            window.setTimeout(() => {
              dispatch(openModal("SkinManager"));
            }, 250);
          }
        }));
      }, 225);
      return;
    }

    let name = selectedFile.name;
    let p = selectedFile.path;

    if (fs.existsSync(path.join(folder, selectedFile.name))) {
      name = (Math.random()*1000000).toString(16) + "_" + name;
      p = path.join(p, "..", name);
    }

    fs.copyFileSync(selectedFile.path, path.join(folder, name));
    const skins = JSON.parse(fs.readFileSync(skinsFile).toString());
    skins.push({
      name: name, variant: selectedVariant
    });
    fs.writeFileSync(skinsFile, JSON.stringify(skins));
    dispatch(closeModal());
    setTimeout(() => {
      dispatch(openModal("Success", {
        title: "Erfolg!", message: "Dein Skin wurde erfolgreich importiert.", closeCallback: () => {
          window.setTimeout(() => {
            dispatch(openModal("SkinManager"));
          }, 250);
        }
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
      <Form onFinish={event => submit(event)} css={"display: flex; flex-direction: column"}>

        {!edit && (
          <Form.Item name={"file"} rules={[{required: true, message: "Es wird eine Datei benötigt."}]}>
            <Upload type={"file"} value={selectedFile} onChange={event => setSelectedFile(event.target.files[0])}
                    accept="image/png, image/jpeg" />
          </Form.Item>
        )}
        <Form.Item name={"variant"} rules={[{required: true, message: "Es wird eine Variante benötigt."}]}>
          <Select name={"variant"} id={"variant"} onChange={val => setSelectedVariant(val)} css={"min-width: 5rem; margin: .5rem !important;"}>
            <Select.Option value={""} selected={!selectedVariant}>{" "}</Select.Option>
            <Select.Option value={"Classic"} selected={selectedVariant === "classic"}>Classic</Select.Option>
            <Select.Option value={"Slim"} selected={selectedVariant === "slim"}>Slim</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button htmlType={"submit"} name={"submit"} css={"margin-top: .5rem;" }>
            {!edit ? "Importieren" : "Speichern"}
          </Button>
        </Form.Item>

      </Form>
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