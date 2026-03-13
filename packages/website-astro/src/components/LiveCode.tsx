import React from 'react'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as ReactUse from '@reactuses/core'
import { useQRCode } from '@reactuses/core/useQRCode'

/**
 * Scope available in live code blocks - mirrors the Docusaurus ReactLiveScope
 */
const scope = {
  React,
  ...React,
  ...ReactUse,
  useQRCode,
}

interface LiveCodeProps {
  code: string
  noInline?: boolean
}

const transformCode = (code: string) => `${code}`

export default function LiveCode({ code, noInline = false }: LiveCodeProps) {
  return (
    <div className="live-code-container">
      <LiveProvider
        code={code.replace(/\n$/, '')}
        scope={scope}
        noInline={noInline}
        transformCode={transformCode}
      >
        <div className="live-code-editor">
          <div className="live-code-header">Live Editor</div>
          <LiveEditor className="live-code-editor-area" />
        </div>
        <div className="live-code-result">
          <div className="live-code-header">Result</div>
          <div className="live-code-preview">
            <LivePreview />
          </div>
          <LiveError className="live-code-error" />
        </div>
      </LiveProvider>
    </div>
  )
}
