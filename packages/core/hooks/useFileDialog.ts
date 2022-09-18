import { useCallback, useState } from "react";
import { useRef } from "react";

export interface UseFileDialogOptions {
  /**
   * @default true
   */
  multiple?: boolean;
  /**
   * @default '*'
   */
  accept?: string;
  /**
   * Select the input source for the capture file.
   * @see [HTMLInputElement Capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
   */
  capture?: string;
}

const DEFAULT_OPTIONS: UseFileDialogOptions = {
  multiple: true,
  accept: "*",
};

export default function useFileDialog(
  options: UseFileDialogOptions = {}
): readonly [
  FileList | null,
  (localOptions?: Partial<UseFileDialogOptions>) => void,
  () => void
] {
  const [files, setFiles] = useState<FileList | null>(null);

  const inputRef = useRef<HTMLInputElement>();
  const initFn = useCallback(() => {
    if (!document) {
      return undefined;
    }
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (event: Event) => {
      const result = event.target as HTMLInputElement;
      setFiles(result.files);
    };
    return input;
  }, []);
  inputRef.current = initFn();

  const open = (localOptions?: Partial<UseFileDialogOptions>) => {
    if (!inputRef.current) {
      return;
    }
    const _options = {
      ...DEFAULT_OPTIONS,
      ...options,
      ...localOptions,
    };

    inputRef.current.multiple = _options.multiple!;
    inputRef.current.accept = _options.accept!;
    inputRef.current.capture = _options.capture!;

    inputRef.current.click();
  };

  const reset = () => {
    setFiles(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return [files, open, reset] as const;
}
