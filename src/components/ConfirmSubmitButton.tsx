"use client";

import type { ReactNode } from "react";

// Submit button that asks for confirmation first. Lets a Server Component
// keep a plain <form action={serverAction}> for destructive actions without
// a whole client wrapper per form.
export default function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
