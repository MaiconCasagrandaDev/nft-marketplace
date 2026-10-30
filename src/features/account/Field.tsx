import { forwardRef, type ComponentPropsWithoutRef } from "react"

type Props = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  id: string
  label: string
  error?: string
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { id, label, error, ...props },
  ref,
) {
  const errorId = `${id}-error`
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
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