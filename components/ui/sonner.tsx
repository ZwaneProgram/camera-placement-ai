"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-ink !text-white !border-none !rounded-2xl !shadow-[0_12px_30px_rgba(14,27,42,.3)] !font-semibold",
          description: "!text-white/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
