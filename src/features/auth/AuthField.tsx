import { Eye, EyeOff } from "lucide-react"
import { forwardRef, useState, type ComponentPropsWithoutRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  id: string
  label: string
  error?: string
}

export const AuthField = forwardRef<HTMLInputElement, Props>(function AuthField(
  { id, label, error, className, type, ...props },
  ref,
) {
  const errorId = `${id}-error`
  const [show, setShow] = useState(false)
  const isPassword = type === "password"

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only text-sm font-medium md:not-sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "max-md:h-11 max-md:rounded-xl max-md:border-[#4a2c1f] max-md:bg-transparent max-md:px-4 max-md:text-xs",
            isPassword && "max-md:pr-12",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={show ? "Ocultar" : "Mostrar"}
            aria-pressed={show}
            onClick={() => setShow((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b4430] md:hidden"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})