import React from 'react';
import styled from 'styled-components';
import jaholldepng from '../common/assets/jahollde/jahollde.png';

const Logo = styled.img`
  width: ${props => props.size}px;
  cursor: ${props => (props.pointer ? 'cursor' : 'pointer')};
  * {
    cursor: ${props => (props.pointer ? 'cursor' : 'pointer')};
    transition: 0.2s;
  }
  &:hover {
    *:not(.innerHorizontalLogoPath) {
      fill: ${({ theme }) => theme.palette.primary.dark};
    }
  }
`;

const HorizontalLogo = ({ size, pointer, onClick }) => {
  return (
    <Logo
      version="1.1"
      x="0px"
      pointer={pointer}
      y="0px"
      viewBox="0 0 1024 312"
      size={size}
      fill="none"
      xmlSpace="preserve"
      onClick={onClick}
      src={jaholldepng}
    >
    </Logo>
  );
};

export default HorizontalLogo;
