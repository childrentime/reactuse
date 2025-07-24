import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import Clarity from './Clarity';
import CarbonAds from './CarbonAds';

export default function Layout(props) {
  return (
    <>
      <Clarity />
      <OriginalLayout {...props} />
      <CarbonAds />
    </>
  );
} 