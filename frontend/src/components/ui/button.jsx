import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[13px] font-semibold font-sans ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Botón primario (DESIGN.md "Components"): fondo #5a7d52, texto
        // #faf7ef, hover #4f7047.
        default: "bg-primary text-primary-foreground hover:bg-[#4f7047]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Botón secundario: borde #ddd5c2, fondo blanco.
        outline:
          "border border-[#ddd5c2] bg-white text-foreground hover:bg-[#f0ead9]",
        secondary:
          "bg-secondary text-secondary-foreground border border-[#ddd5c2] hover:bg-[#f0ead9]",
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
