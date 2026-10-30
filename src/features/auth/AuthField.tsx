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
      <label htmlFor={id} className="sr-only">
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
            "h-11 rounded-xl border-[#4a2c1f] bg-transparent px-4 text-xs placeholder:text-[#a8825a] focus-visible:border-brand focus-visible:ring-0 md:h-10 md:rounded md:text-[13px]",
            isPassword && "pr-12",
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a6a45] hover:text-brand-hover"
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