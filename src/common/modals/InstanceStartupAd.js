import React, {memo, useState} from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOutlined } from '@ant-design/icons';
import Modal from '../components/Modal';
import { closeModal, openModal } from '../reducers/modals/actions';
import BisectHosting from '../../ui/BisectHosting';
import ga from '../utils/analytics';
import {getLogs, onAddLog} from "../../app/desktop/utils/clientLogs";

let timer;

const InstanceStartupAd = function ({ instanceName }) {
  const dispatch = useDispatch();


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
      </div>
    </Modal>
  );
};

export default InstanceStartupAd;
