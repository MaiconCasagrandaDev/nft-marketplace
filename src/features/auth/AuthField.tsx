import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { Input } from "@/components/ui/input"

type Props = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  id: string
  label: string
  error?: string
}

export const AuthField = forwardRef<HTMLInputElement, Props>(function AuthField(
  { id, label, error, ...props },
  ref,
) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})