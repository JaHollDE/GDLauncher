import React, { memo } from 'react';
import jahollde from "../common/assets/jahollde/jahollde.png"

const Logo = ({ size, pointerCursor }) => {
  return (
      <img src={jahollde} alt={"JHDE"} style={{
        maxHeight: `${size}px`
      }} />
  );
};

export default memo(Logo);
