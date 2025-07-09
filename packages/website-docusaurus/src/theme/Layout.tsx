import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import Clarity from './Clarity';

export default function Layout(props) {
  return (
    <>
      <Clarity />
      <OriginalLayout {...props} />
    </>
  );
} 