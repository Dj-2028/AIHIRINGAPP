"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import type { ButtonVariantProps } from "@/components/ui/button-variants"

export interface ButtonProps
  extends ButtonPrimitive.Props,
    ButtonVariantProps {}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
