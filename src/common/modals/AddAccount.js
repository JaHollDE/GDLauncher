import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Input, Button, Menu } from 'antd';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Modal from '../components/Modal';
import { load } from '../reducers/loading/actions';
import features from '../reducers/loading/features';
import { login, loginOAuth } from '../reducers/actions';
import { closeModal } from '../reducers/modals/actions';
import { ACCOUNT_MICROSOFT } from '../utils/constants';

const AddAccount = ({ username }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState(username || '');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState(ACCOUNT_MICROSOFT);
  const [loginFailed, setloginFailed] = useState();

  const addMicrosoftAccount = () => {
    dispatch(load(features.mcAuthentication, dispatch(loginOAuth(false))))
      .then(() => dispatch(closeModal()))
      .catch(error => {
        console.error(error);
        setloginFailed(error);
      });
  };

  const renderAddMicrosoftAccount = () => (
    <Container>
      <FormContainer>
        <Button id="loginOptionMicrosoft" className="loginOptionButton" onClick={addMicrosoftAccount}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="10" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          <span>Einloggen mit Microsoft</span>
        </Button>
        <FormContainer>
          {addMicrosoftAccount}
          {loginFailed ? (
            <>
              <LoginFailMessage>{loginFailed?.message}</LoginFailMessage>
              <StyledButton
                css={`
                  margin-top: 12px;
                `}
                onClick={addMicrosoftAccount}
              >
                Erneut Versuchen
              </StyledButton>
            </>
          ) : undefined /*<FontAwesomeIcon spin size="3x" icon={faSpinner} />*/ }
        </FormContainer>
      </FormContainer>
    </Container>
  );

  return (
    <Modal
      css={`
        height: 450px;
        width: 420px;
      `}
      title=" "
    >
      <Container>
        <Menu
          mode="horizontal"
          selectedKeys={[accountType]}
          overflowedIndicator={null}
        >
          <StyledAccountMenuItem
            key={ACCOUNT_MICROSOFT}
            onClick={() => {
              setAccountType(ACCOUNT_MICROSOFT);
            }}
          >
            Microsoft Account hinzufügen
          </StyledAccountMenuItem>
        </Menu>
        {accountType === ACCOUNT_MICROSOFT ? renderAddMicrosoftAccount() : null}
      </Container>
    </Modal>
  );
};

export default AddAccount;

const StyledButton = styled(Button)`
  width: 40%;
`;

const StyledInput = styled(Input)`
  margin-bottom: 20px !important;
`;

const LoginFailMessage = styled.div`
  color: ${props => props.theme.palette.colors.red};
`;

const StyledAccountMenuItem = styled(Menu.Item)`
  width: auto;
  height: auto;
  font-size: 18px;
`;

const FormContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-content: space-between;
  justify-content: center;
`;
