import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import Clarity from './Clarity';
import CarbonAds from './CarbonAds';

export default function Layout(props) {
  return (
    <>
      <Clarity />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: '@reactuses/core',
            description:
              'Collection of 115+ essential React Hooks with TypeScript support, tree-shaking, and SSR compatibility',
            programmingLanguage: ['TypeScript', 'React'],
            runtimePlatform: ['Node.js', 'Browser'],
            codeRepository: 'https://github.com/childrentime/reactuse',
            license: 'https://choosealicense.com/licenses/unlicense/',
            url: 'https://reactuse.com',
            keywords: ['react', 'hooks', 'typescript', 'react-hooks', 'custom-hooks'],
            author: {
              '@type': 'Person',
              name: 'childrentime',
              url: 'https://github.com/childrentime',
            },
          }),
        }}
      />
      <OriginalLayout {...props} />
      <CarbonAds />
    </>
  );
} 