import { useCallback } from "react";
import { useControlled } from "../useControlled";
import { useLatest } from "../useLatest";
import type { UseDisclosureProps } from "./interface";

export const useDisclosure = (props: UseDisclosureProps = {}) => {
  const {
    defaultOpen,
    isOpen: isOpenProp,
    onClose: onCloseProp,
    onOpen: onOpenProp,
    onChange = () => {},
  } = props;

  const onOpenPropRef = useLatest(onOpenProp);
  const onClosePropRef = useLatest(onCloseProp);
  const [isOpen, setIsOpen] = useControlled(
    isOpenProp,
    defaultOpen || false,
    onChange,
  );

  const isControlled = isOpenProp !== undefined;

  const onClose = useCallback(() => {
    if (!isControlled) {
      setIsOpen(false);
    }
    onClosePropRef.current?.();
  }, [isControlled, onClosePropRef, setIsOpen]);

  const onOpen = useCallback(() => {
    if (!isControlled) {
      setIsOpen(true);
    }
    onOpenPropRef.current?.();
  }, [isControlled, onOpenPropRef, setIsOpen]);

  const onOpenChange = useCallback(() => {
    const action = isOpen ? onClose : onOpen;

    action();
  }, [isOpen, onOpen, onClose]);

  return {
    isOpen: !!isOpen,
    onOpen,
    onClose,
    onOpenChange,
    isControlled,
  };
};
