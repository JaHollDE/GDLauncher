import React, { memo } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useKey } from 'rooks';
import CloseButton from './CloseButton';
import { closeModal } from '../reducers/modals/actions';

const HeaderComponent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 16px;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  height: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  h3 {
    line-height: 40px;
    margin: 0;
  }
`;

const Modal = ({
  transparentBackground,
  header,
  title,
  backBtn,
  children,
  className,
  removePadding,
  closeCallback,
  preventClose
}) => {
  const dispatch = useDispatch();

  const closeFunc = () => {
    if (closeCallback) closeCallback();
    dispatch(closeModal());
  };

  useKey(['Escape'], () => {
    if (!preventClose) closeFunc();
  });

  return (
    <div
      onMouseDown={e => {
        e.stopPropagation();
      }}
      transparentBackground={transparentBackground}
      className={className}
      css={`
        background: rgba(0, 0, 0, 0.5);
        position: absolute;
        border-radius: 4px;
      `}
    >
      {(header === undefined || header === true) && (
        <HeaderComponent>
          <h3>{title || 'Modal'}</h3>
          {!preventClose && <CloseButton onClick={closeFunc} />}
        </HeaderComponent>
      )}
      <div
        header={header}
        removePadding={removePadding}
        css={`
          height: ${header === undefined || header === true
            ? 'calc(100% - 40px)'
            : '100%'};
          width: 100%;
          padding: ${props =>
            (props.header === undefined || props.header === true) &&
            !props.removePadding
              ? 20
              : 0}px;
          overflow-y: hidden;
          overflow-x: hidden;
          position: relative;
        `}
      >
        <span onClick={closeFunc}>{backBtn !== undefined && backBtn}</span>
        {children}
      </div>
    </div>
  );
};

export default Modal;
//export default memo(Modal);
