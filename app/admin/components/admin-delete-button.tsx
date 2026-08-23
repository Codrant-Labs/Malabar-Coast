"use client";

export function AdminDeleteButton({label = "Delete", confirmMessage}: {label?: string; confirmMessage: string}) {
  return <button className="adminDeleteButton" type="submit" onClick={(event) => {
    if (!window.confirm(confirmMessage)) event.preventDefault();
  }}>{label}</button>;
}
