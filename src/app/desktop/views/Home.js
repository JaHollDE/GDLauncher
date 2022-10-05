import React, { useState, useEffect, memo } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button, Divider, Spin } from "antd";
import { useSelector, useDispatch } from 'react-redux';
import { ipcRenderer } from 'electron';
import axios from 'axios';
// import { promises as fs } from 'fs';
// import path from 'path';
import Instances from '../components/Instances';
import News from '../components/News';
import { openModal } from '../../../common/reducers/modals/actions';
import {
    _getCurrentAccount
    // _getInstances
} from '../../../common/utils/selectors';
import Logo from "../../../ui/Logo";
import { extractFace } from '../utils';
import { updateLastUpdateVersion } from '../../../common/reducers/actions';
import * as jaholldeVerification from "../utils/jaholldeVerification";
import { onAccountChange } from "../utils/jaholldeVerification";
import "./Home.css"

const AddInstanceIcon = styled(Button)`
  position: fixed;
  bottom: 100px;
  left: 20px;
`;

const AccountContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  
  row-gap: .5rem;
  
  background-color: rgba(0, 0, 0, 0);
  border: none;
  
  flex-wrap: nowrap;
`;

const AccountBackground = styled(Button)`
  background-color: rgba(0, 0, 0, 0.5);
  box-shadow: .01rem .01rem .1rem 0 white;
  border: none;
  
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
`

const Home = () => {
    const dispatch = useDispatch();
    const account = useSelector(_getCurrentAccount);
    const news = useSelector(state => state.news);
    const lastUpdateVersion = useSelector(state => state.app.lastUpdateVersion);
    // const instances = useSelector(_getInstances);

    const openAddInstanceModal = defaultPage => {
        dispatch(openModal('AddInstance', { defaultPage }));
    };

    const openAccountModal = () => {
        dispatch(openModal('AccountsManager'));
    };

    const [profileImage, setProfileImage] = useState(null);
    const [annoucement, setAnnoucement] = useState(null);

    useEffect(() => {
        const init = async () => {
            const appVersion = await ipcRenderer.invoke('getAppVersion');
            if (lastUpdateVersion !== appVersion) {
                dispatch(updateLastUpdateVersion(appVersion));
                dispatch(openModal('ChangeLogs'));
            }
            try {
                const { data } = await axios.get(
                    'https://api.gdlauncher.com/announcement'
                );
                setAnnoucement(data || null);
            } catch (e) {
                console.log('No announcement to show');
            }
        };

        init();
    }, []);

    useEffect(() => {
        extractFace(account.skin).then(setProfileImage).catch(console.error);
    }, [account]);

    const [jaholldeData, setJaholldeData] = useState(undefined);
    const token = useSelector(state => state.app.currentAccountId);

    const openRegisterScreen = () => {
        // open modal
        dispatch(openModal('JaHollDERegister'));
    }


    const [isDevInstance, setIsDevInstance] = useState(false);

    useEffect(() => {
        ipcRenderer.invoke("is-dev-instance").then(s => setIsDevInstance(s));
    }, []);

    const toggleIsDevInstanceSave = () => {
        const newState = !isDevInstance;
        ipcRenderer.invoke("set-dev-instance", newState);
        setIsDevInstance(newState);
    }

    const updateData = () => {
        setJaholldeData(null);
        dispatch(async (dispatch, getState) => {
            const state = getState();
            const account = _getCurrentAccount(state);

            if (account.accessToken === undefined) {
                console.log("Unable to get access token for account: ", account);
                return;
            }

            const data = await jaholldeVerification.verifyToken(account.accessToken);

            if (data.registered) {
                setJaholldeData(data);
                ipcRenderer.invoke("jahollde-data", account.accessToken, data);
            } else {
                setJaholldeData(undefined);
                openRegisterScreen();
            }
        });
    }

    useEffect(() => {
        updateData();
    }, [token]);
    onAccountChange(() => updateData());

    return (
        <div>
            {annoucement ? (
                <div
                    css={`
            margin-top: 10px;
            padding: 30px;
            font-size: 18px;
            font-weight: bold;
            color: ${props => props.theme.palette.colors.yellow};
          `}
                >
                    {annoucement}
                </div>
            ) : null}
            <Instances />
            <div className={"jahollde-symbol"} onClick={() => jaholldeData?.hasDevRights ? toggleIsDevInstanceSave() : null}>
                <Logo size={35} />
                {
                    jaholldeData?.hasDevRights ?
                        <span css={{
                            paddingLeft: "1rem"
                        }}>
                            {isDevInstance ? "Development" : "Produktiv"}
                        </span>
                        : null
                }
            </div>
            <AccountContainer type="primary">
                {jaholldeData === undefined && <AccountBackground css={`margin-right: .5rem;`} onClick={openRegisterScreen}>Registrieren</AccountBackground>}
                {jaholldeData === null && <AccountBackground css={`margin-right: .5rem;`} onClick={openRegisterScreen}><Spin /></AccountBackground>}

                <AccountBackground onClick={openAccountModal}>
                    {profileImage ? (
                        <img
                            src={`data:image/jpeg;base64,${profileImage}`}
                            css={`
              width: 15px;
              cursor: pointer;
              height: 15px;
              align-self: center;
            `}
                            alt="profile"
                        />
                    ) : (
                        <div
                            css={`
              width: 15px;
              height: 15px;
              background: ${props => props.theme.palette.grey[100]};
              margin-right: 10px;
            `}
                        />
                    )}
                    {
                        jaholldeData &&
                        <div css={`margin-left: .5rem; align-self: end`}>{jaholldeData.rpName}</div>
                    }
                </AccountBackground>


            </AccountContainer>
        </div>
    );
};
//{account && account.selectedProfile.name}
export default memo(Home);
