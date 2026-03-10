import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import Head from '@docusaurus/Head';
import Clarity from './Clarity';
import CarbonAds from './CarbonAds';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareSourceCode',
      name: '@reactuses/core',
      description:
        'Collection of 100+ essential React Hooks with TypeScript support, tree-shaking, and SSR compatibility',
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
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is ReactUse?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ReactUse is a comprehensive collection of 100+ essential React Hooks with TypeScript support, tree-shaking, and SSR compatibility. It is the React equivalent of VueUse.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I install ReactUse?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Install via npm: npm i @reactuses/core. Then import any hook: import { useToggle } from "@reactuses/core".',
          },
        },
        {
          '@type': 'Question',
          name: 'Is ReactUse compatible with Next.js and SSR?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, all ReactUse hooks are SSR-compatible and work seamlessly with Next.js, Remix, and other server-side rendering frameworks.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many hooks does ReactUse provide?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ReactUse provides 100+ hooks across 5 categories: Browser (48), State (24), Element (19), Effect (20), and Integrations.',
          },
        },
      ],
    },
  ],
};

export default function Layout(props) {
  return (
    <>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>
      <Clarity />
      <OriginalLayout {...props} />
      <CarbonAds />
    </>
  );
} 