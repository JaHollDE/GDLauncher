import React, {memo, useState} from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOutlined } from '@ant-design/icons';
import Modal from '../components/Modal';
import { closeModal, openModal } from '../reducers/modals/actions';
import BisectHosting from '../../ui/BisectHosting';
import ga from '../utils/analytics';
import {getLogs, onAddLog} from "../../app/desktop/utils/clientLogs";
import {Button, Checkbox, Form, Input, Spin} from "antd";
import {createInstance} from "../../app/desktop/utils/instanceCreation";


let timer;

const JaHollDEInstanceCreation = function () {
    const dispatch = useDispatch();

    const [isCreating, setIsCreating] = useState(false);

    const finish = async ({instanceName, isDevInstance}) => {
        isDevInstance = !!isDevInstance;

        const updatedInstanceName = instanceName.trim().split(" ").join("_");

        setIsCreating(true);
        await createInstance(dispatch, updatedInstanceName, isDevInstance);
        setIsCreating(false);

        dispatch(closeModal());
    }

    return (
        <Modal
            css={`
                height: 330px;
                width: 650px;
                overflow-x: hidden;
            `}
            title={`JaHollDE-Instanz erstellen`}
        >
            <Form css={`
                display: flex;
                flex-direction: column;
                flex-wrap: nowrap;
            `} onFinish={finish}>
                <Form.Item name={"instanceName"} rules={[{required: true, message: 'Bitte gebe einen Namen ein.'}]}>
                    <Input placeholder={"Instanz-Name"}></Input>
                </Form.Item>
                <Form.Item name={"isDevInstance"} valuePropName={"checked"}>
                    <Checkbox defaultChecked={false}>Development-Instanz</Checkbox>
                </Form.Item>
                <Form.Item>
                    <Button htmlType={"submit"}>Erstellen</Button>
                </Form.Item>

                {
                    isCreating &&
                    <label>Erstelle Instanz... <Spin css={`padding-left: .5rem;`} /></label>
                }


            </Form>

        </Modal>
    );
};

export default JaHollDEInstanceCreation;
