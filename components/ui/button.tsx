import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        gradient:
          "bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)] text-ink font-bold shadow-[0_14px_30px_rgba(47,107,255,.28)] hover:brightness-105",
        outline:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        soft: "border-[1.5px] border-line bg-white text-ink hover:border-brand-teal",
        accent: "bg-line-soft text-brand-blue hover:bg-line-soft/70",
        ghost: "text-ink hover:bg-accent hover:text-accent-foreground",
        line: "bg-success-line text-white hover:brightness-105",
        facebook: "bg-facebook text-white hover:brightness-105",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        link: "text-brand-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-[52px] rounded-2xl px-7 text-base",
        pill: "h-[54px] rounded-full px-7 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
