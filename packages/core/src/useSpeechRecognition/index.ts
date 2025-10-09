import { useEffect, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import { useEvent } from '../useEvent'
import { useUnmount } from '../useUnmount'
import { defaultWindow } from '../utils/browser'
import type { SpeechRecognition, SpeechRecognitionErrorEvent } from './types'
import type { UseSpeechRecognition, UseSpeechRecognitionOptions } from './interface'

export const useSpeechRecognition: UseSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    interimResults = true,
    continuous = true,
    maxAlternatives = 1,
    lang = 'en-US',
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isFinal, setIsFinal] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState<SpeechRecognitionErrorEvent | undefined>(undefined)

  const recognitionRef = useRef<SpeechRecognition | undefined>(undefined)

  const SpeechRecognitionClass = defaultWindow && (
    (defaultWindow as any).SpeechRecognition
    || (defaultWindow as any).webkitSpeechRecognition
  )

  const isSupported = useSupported(() => SpeechRecognitionClass)

  const start = useEvent((startOptions?: Partial<UseSpeechRecognitionOptions>) => {
    if (!recognitionRef.current) {
      return
    }

    // Apply options to recognition instance
    const {
      interimResults: newInterimResults = interimResults,
      continuous: newContinuous = continuous,
      maxAlternatives: newMaxAlternatives = maxAlternatives,
      lang: newLang = lang,
    } = startOptions || {}

    recognitionRef.current.interimResults = newInterimResults
    recognitionRef.current.continuous = newContinuous
    recognitionRef.current.maxAlternatives = newMaxAlternatives
    recognitionRef.current.lang = newLang

    setIsListening(true)
  })

  const stop = useEvent(() => {
    setIsListening(false)
  })

  const toggle = useEvent((value = !isListening, startOptions?: Partial<UseSpeechRecognitionOptions>) => {
    if (value) {
      start(startOptions)
    }
    else {
      stop()
    }
  })

  // Initialize recognition when supported
  useEffect(() => {
    if (!isSupported || !SpeechRecognitionClass) {
      return
    }

    const recognition = new SpeechRecognitionClass() as SpeechRecognition
    recognitionRef.current = recognition

    // Set up event listeners
    recognition.onstart = () => {
      setIsListening(true)
      setIsFinal(false)
    }

    recognition.onresult = event => {
      const currentResult = event.results[event.resultIndex]
      const { transcript } = currentResult[0]

      setIsFinal(currentResult.isFinal)
      setResult(transcript)
      setError(undefined)
    }

    recognition.onerror = event => {
      setError(event)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [isSupported, SpeechRecognitionClass])

  // Handle listening state changes
  useEffect(() => {
    if (!recognitionRef.current) {
      return
    }

    if (isListening) {
      try {
        recognitionRef.current.start()
      }
      catch (err) {
        console.warn('Failed to start speech recognition:', err)
        setIsListening(false)
      }
    }
    else {
      try {
        recognitionRef.current.stop()
      }
      catch (err) {
        console.warn('Failed to stop speech recognition:', err)
      }
    }
  }, [isListening])

  // Cleanup on unmount
  useUnmount(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
  })

  return {
    isSupported,
    isListening,
    isFinal,
    recognition: recognitionRef.current,
    result,
    error,
    toggle,
    start,
    stop,
  } as const
}

export type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from './interface'
export type { SpeechRecognition, SpeechRecognitionErrorEvent } from './types'
