"use client";

import {useRef, type InputHTMLAttributes, type MouseEvent} from "react";

type SmartDateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  type?: "date" | "datetime-local";
};

export function SmartDateInput({type = "date", onClick, ...props}: SmartDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker(event: MouseEvent<HTMLInputElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    try {
      inputRef.current?.showPicker?.();
    } catch {
      // The native field remains fully usable when a browser blocks showPicker().
    }
  }

  return <input ref={inputRef} type={type} onClick={openPicker} {...props} />;
}
