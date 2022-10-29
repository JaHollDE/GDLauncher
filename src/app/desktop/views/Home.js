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
  
  row-gap: .5rem;
  
  background-color: rgba(0, 0, 0, 0);
  border: none;
  
  flex-wrap: nowrap;
    
    flex-direction: column;
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
    const [devInstanceData, setDevInstanceData] = useState(undefined);
    const [isDevInstance, setDevInstance] = useState(false);

    const token = useSelector(state => state.app.currentAccountId);

    const openRegisterScreen = (devInstance = false) => {
        // open modal
        dispatch(openModal('JaHollDERegister', {devInstance}));
    }

    const updateData = () => {
        setJaholldeData(null);
        return dispatch(async (dispatch, getState) => {
            const state = getState();
            const account = _getCurrentAccount(state);

            if (account.accessToken === undefined) {
                console.log("Unable to get access token for account: ", account);
                return;
            }

            let timeout = 60;

            for (const isDevInstance of [false, true]) {
                const data = await jaholldeVerification.verifyToken(account.accessToken, isDevInstance);

                if (data.registered) {
                    isDevInstance ? setDevInstanceData(data) : setJaholldeData(data);
                    ipcRenderer.invoke("jahollde-data", account.accessToken, data);

                    setDevInstance(!!data.hasDevRights);
                    if (!data.hasDevRights) {
                        break;
                    }
                } else if (data === false) {
                    isDevInstance ? setDevInstanceData(false) : setJaholldeData(false);
                    timeout = 10;
                    break;
                } else {
                    isDevInstance ? setDevInstanceData(undefined) : setJaholldeData(undefined);
                    !isDevInstance && openRegisterScreen();
                    break;
                }
            }

            window.setTimeout(() => {
                updateData();
            }, timeout*1000);
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
            <Instances data={jaholldeData} />
            <div className={"jahollde-symbol"}>
                <Logo size={35} />
                {
                    jaholldeData?.hasDevRights ?
                        <span css={{
                            paddingLeft: "1rem"
                        }}>
                            Development
                        </span>
                        : null
                }
            </div>
            <AccountContainer type="primary">

                {jaholldeData === undefined && <AccountBackground css={`margin-right: .5rem;`} onClick={openRegisterScreen}>Registrieren</AccountBackground>}
                {jaholldeData === null && <AccountBackground css={`margin-right: .5rem;`} onClick={openRegisterScreen}><Spin /></AccountBackground>}
                {jaholldeData === false && <AccountBackground css={`margin-right: .5rem;`} onClick={updateData}>Server Offline</AccountBackground>}
                {jaholldeData !== undefined && jaholldeData !== null && jaholldeData !== false && <AccountBackground onClick={openAccountModal}>
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
                </AccountBackground>}

                {isDevInstance && <div>
                    <span css={`
                        font-weight: bold;
                        margin-right: .5rem;
                    `}>Development</span>
                    {devInstanceData === undefined && <AccountBackground css={`margin-right: .5rem;`} onClick={() => openRegisterScreen(true)}>Registrieren</AccountBackground>}
                    {devInstanceData === null && <AccountBackground css={`margin-right: .5rem;`} onClick={() => openRegisterScreen(true)}><Spin /></AccountBackground>}
                    {devInstanceData === false && <AccountBackground css={`margin-right: .5rem;`} onClick={updateData}>Server Offline</AccountBackground>}
                    {devInstanceData !== undefined && devInstanceData !== null && devInstanceData !== false && <AccountBackground onClick={openAccountModal}>
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
                          devInstanceData &&
                          <div css={`margin-left: .5rem; align-self: end`}>{devInstanceData.rpName}</div>
                        }
                    </AccountBackground>}
                </div>
                }



            </AccountContainer>
        </div>
    );
};
//{account && account.selectedProfile.name}
export default memo(Home);
