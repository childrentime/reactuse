import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v4'
import type { HooksDataManager } from './hooks-data.js'

const VUEUSE_MAP: Record<string, string> = {
  useToggle: 'useToggle',
  useStorage: 'useLocalStorage',
  useLocalStorage: 'useLocalStorage',
  useSessionStorage: 'useSessionStorage',
  useCounter: 'useCounter',
  useMouse: 'useMouse',
  useWindowSize: 'useWindowSize',
  useWindowScroll: 'useWindowScroll',
  useScroll: 'useScroll',
  useDebounce: 'useDebounce',
  useThrottle: 'useThrottle',
  useTimeout: 'useTimeout',
  useInterval: 'useInterval',
  useIntervalFn: 'useInterval',
  useTimeoutFn: 'useTimeout',
  useFullscreen: 'useFullscreen',
  useClipboard: 'useClipboard',
  useOnline: 'useOnline',
  useBattery: 'useBattery',
  useGeolocation: 'useGeolocation',
  useMediaQuery: 'useMedia',
  usePreferredDark: 'useColorMode',
  useDark: 'useColorMode',
  useColorMode: 'useColorMode',
  useDocumentVisibility: 'usePageVisibility',
  useNetwork: 'useNetwork',
  useEventListener: 'useEventListener',
  useIntersectionObserver: 'useIntersectionObserver',
  useResizeObserver: 'useResizeObserver',
  useMutationObserver: 'useMutationObserver',
  useElementSize: 'useElementSize',
  useElementVisibility: 'useElementVisibility',
  useElementBounding: 'useElementBounding',
  useClickOutside: 'useClickOutside',
  useEventSource: 'useEventSource',
  useWebSocket: 'useWebSocket',
  useFavicon: 'useFavicon',
  useTitle: 'useTitle',
  useFocus: 'useFocus',
  useFocusWithin: 'useFocusWithin',
  useKeyModifier: 'useKeyboard',
  useMagicKeys: 'useKeyboard',
  useDraggable: 'useDraggable',
  useDropZone: 'useDropZone',
  useFileDialog: 'useFileDialog',
  useTextSelection: 'useTextSelection',
  useBroadcastChannel: 'useBroadcastChannel',
  useShare: 'useShare',
  useWakeLock: 'useWakeLock',
  useSpeechRecognition: 'useSpeechRecognition',
  useSpeechSynthesis: 'useSpeechSynthesis',
  usePermission: 'usePermission',
  useMemoize: 'useMemo',
  useAsyncState: 'useAsyncEffect',
  useDeviceMotion: 'useDeviceMotion',
  useDeviceOrientation: 'useDeviceOrientation',
  useDevicePixelRatio: 'useDevicePixelRatio',
  usePreferredLanguages: 'usePreferredLanguages',
  usePreferredReducedMotion: 'useReducedMotion',
}

export function registerPrompts(server: McpServer, hooks: HooksDataManager): void {
  server.registerPrompt(
    'find_hook',
    {
      title: 'Find a ReactUse hook',
      description: 'Get a focused prompt that helps the LLM recommend ReactUse hooks for a described task.',
      argsSchema: {
        task: z.string().describe('What you want to do, e.g. "persist user settings across reloads" or "detect when an element scrolls into view".'),
      },
    },
    ({ task }) => {
      const allNames = hooks.all.map(h => `- ${h.name} (${h.category}): ${h.description}`).join('\n')
      return {
        description: `Find ReactUse hooks for: ${task}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `I need to do this in a React app: ${task}`,
                '',
                'Pick the most appropriate hook(s) from the @reactuses/core library below.',
                'For each suggestion: 1) hook name, 2) one-line why, 3) a minimal usage example with the correct import (`import { ... } from "@reactuses/core"`).',
                'Prefer 1–3 hooks. Cite the docs URL for each.',
                '',
                '## Available hooks',
                '',
                allNames,
              ].join('\n'),
            },
          },
        ],
      }
    },
  )

  server.registerPrompt(
    'migrate_from_vueuse',
    {
      title: 'Migrate from VueUse',
      description: 'Map a VueUse composable to its ReactUse equivalent (if any) with migration notes.',
      argsSchema: {
        vueuse_name: z.string().describe('The VueUse composable name, e.g. "useStorage", "useMagicKeys".'),
      },
    },
    ({ vueuse_name }) => {
      const candidate = VUEUSE_MAP[vueuse_name]
      const reactuseHook = candidate ? hooks.get(candidate) : undefined

      const lines = [
        `I'm migrating from VueUse \`${vueuse_name}\` to ReactUse (@reactuses/core).`,
        '',
      ]

      if (reactuseHook) {
        lines.push(
          `The closest ReactUse equivalent is \`${reactuseHook.name}\` (${reactuseHook.category}).`,
          `Docs: ${reactuseHook.url}`,
          '',
          'Please:',
          '1) Show a side-by-side: VueUse composable usage vs ReactUse hook usage.',
          '2) Highlight API differences (signature, return shape, options).',
          '3) Note Vue-specific concepts (refs, watchers) that need to be re-thought in React.',
          '',
          `## ${reactuseHook.name} details`,
          '',
          reactuseHook.description,
          '',
          reactuseHook.body.slice(0, 1500),
          reactuseHook.api ? `\n## API\n\n${reactuseHook.api}` : '',
        )
      }
      else {
        const candidates = hooks.search(vueuse_name.replace(/^use/, ''), 5)
        lines.push(
          `ReactUse doesn't have a direct equivalent named after \`${vueuse_name}\`. Here are the closest candidates by search:`,
          '',
          ...candidates.map(c => `- ${c.name} (${c.category}): ${c.description}`),
          '',
          'Please review each, suggest the best match, and write a small migration snippet. If none fit, explain how to implement the behaviour from primitives in @reactuses/core.',
        )
      }

      return {
        description: `Migrate VueUse ${vueuse_name} to ReactUse`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: lines.join('\n'),
            },
          },
        ],
      }
    },
  )
}
