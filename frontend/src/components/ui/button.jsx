import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[13px] font-semibold font-sans ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Botón primario (DESIGN.md "Components"): fondo #526a3a, texto
        // #e5ddb0, hover #5f7841.
        default: "bg-primary text-primary-foreground hover:bg-[#5f7841]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Botón secundario: borde #c8bf91, fondo blanco.
        outline:
          "border border-[#c8bf91] bg-white text-foreground hover:bg-[#e4d794] dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-card-hover",
        secondary:
          "bg-secondary text-secondary-foreground border border-[#c8bf91] hover:bg-[#e4d794] dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-card-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto px-[15px] py-[8px]",
        sm: "h-auto rounded-sm px-3 py-1.5 text-xs",
        lg: "h-auto rounded-sm px-6 py-2.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
