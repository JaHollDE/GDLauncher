import { useDispatch, useSelector } from "react-redux";
import { _getAccounts, _getCurrentAccount } from "../../utils/selectors";
import Modal from "../../components/Modal";
import {
  loginWithAccessToken,
  loginWithOAuthAccessToken, removeAccount,
  updateAccount,
  updateCurrentAccountId
} from "../../reducers/actions";
import { load } from "../../reducers/loading/actions";
import features from "../../reducers/loading/features";
import { ACCOUNT_MICROSOFT } from "../../utils/constants";
import { Button, Form, Input, message, Select, Spin } from "antd";
import { closeModal, openModal } from "../../reducers/modals/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import React, { useState } from "react";
import "tinycolor2"
import { Option } from "antd/es/mentions";
import { getURL } from "../../store/jahollConfig";
import axios from "axios";
import { accountChange, getDevURL } from "../../../app/desktop/utils/jaholldeVerification";

const inputStyle = `
  flex-grow: 1;
`;

const JaHollDERegister = ({devInstance}) => {
  const dispatch = useDispatch();

  const account = useSelector(_getCurrentAccount);

  const [loading, setLoading] = useState(false);

  const register = async (values) => {
    setLoading(true);

    const rpName = values.rpName;
    const birthday = new Date(values.birthday);
    const gender = parseInt(values.gender);

    const body = {
      rpName: rpName,
      gender: gender,
      birthdayDay: birthday.getDate(),
      birthdayMonth: birthday.getMonth()+1,
      birthdayYear: birthday.getFullYear()
    }

    const url = await getDevURL(devInstance);

    const request = `${url}/api/user/register`;

    const data = await axios.post(request, body, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    accountChange();

    setLoading(false);
    if (data.status !== 200) return;
    dispatch(closeModal());
  };

  const checkRPName = (rule, name) => {
    if (name === undefined) return Promise.reject("");

    const nameParts = name.split(" ");

    if (nameParts.length !== 2 || nameParts.find(l => l.trim() === "") !== undefined) return Promise.reject();

    return Promise.resolve();
  }
  const checkBirthday = (rule, val) => {
    if (val === undefined) return Promise.reject("");

    val = new Date(val).getTime();
    const curTime = new Date();
    curTime.setFullYear(curTime.getFullYear() - 18);
    const delta = curTime.getTime() - val;

    if (delta > 0 && delta < 1000*60*60*24*365*150) {
      return Promise.resolve();
    } else {
      return Promise.reject("");
    }
  }

  return (
    <Modal
      css={`
        height: 70%;
        width: 400px;
        max-height: 700px;
      `}
      title="JaHollDE-Registrierung"
    >
      <ContainerRow>
        <Container>
          <Row>
            <b>{account.selectedProfile.name}</b>
          </Row>
          <Form onFinish={register}>
            <Form.Item name={"rpName"} rules={[{required: true, message: "Es wird ein Name benötigt."}, { validator: checkRPName, message: 'Bitte gib einen RP-Namen mit Vornamen und Nachnamen an.' }]}>
              <InputGroup>
                <InputTitle>RP-Name</InputTitle>
                <Input disabled={loading} css={inputStyle} placeholder={"RP-Name"}></Input>
              </InputGroup>
            </Form.Item>
            <Form.Item name={"birthday"} rules={[{required: true, message: "Es wird ein Alter benötigt."}, {validator: checkBirthday, message: 'Das fiktive Alter muss mindestens 18 Jahre betragen.'}]}>
              <InputGroup>
                <InputTitle>Geburtstag (fiktiv)</InputTitle>
                <Input disabled={loading} css={inputStyle} type={"date"}></Input>
              </InputGroup>

            </Form.Item>
            <Form.Item name={"gender"} rules={[{required: true, message: 'Bitte wähle eine Option aus.'}]}>
              <Select css={inputStyle} placeholder={"Geschlecht"} disabled={loading}>
                <Select.Option value={"0"}>Männlich</Select.Option>
                <Select.Option value={"1"}>Weiblich</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button css={`margin-top: 1rem;`} htmlType="submit" disabled={loading}>Registrieren</Button>
              {loading && <Spin />}
            </Form.Item>
          </Form>


        </Container>
        <SkinContainer>
          <SkinImage alt={"Skin"} src={"https://mc-heads.net/body/" + account.selectedProfile.id} />
        </SkinContainer>
      </ContainerRow>

    </Modal>
  );
};

export default JaHollDERegister;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-content: space-between;
  row-gap: .5rem;
  flex-grow: 1;
  overflow-y: auto;
`;
const ContainerRow = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-content: space-between;
  column-gap: .5rem;
`;
const SkinContainer = styled.div`
  max-width: 5rem;
  align-self: center;
  position: relative;
`;
const SkinImage = styled.img`
  position: relative;
  max-width: 100%;
`
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex-grow: 1;
`
const InputTitle = styled.label`
  color: white;
`
const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`