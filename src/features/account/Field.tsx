import { ChevronDown, Eye, EyeOff } from "lucide-react"
import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

const inputClass =
  "h-10 w-full rounded-[3px] border border-border bg-background px-3 text-sm placeholder:text-text-soft/60 focus-visible:outline-2 focus-visible:outline-brand"

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm leading-5">
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-base text-[#e8704a]">
          *
        </span>
      )}
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-red-400">
      {message}
    </p>
  )
}

type FieldProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  id: string
  label: string
  error?: string
  required?: boolean
  adornment?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, error, required, adornment, className, ...props },
  ref,
) {
  const errorId = `${id}-error`
  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(inputClass, adornment && "pr-10", className)}
          {...props}
        />
        {adornment}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
})

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type" | "adornment">>(
  function PasswordField(props, ref) {
    const [show, setShow] = useState(false)
    return (
      <Field
        ref={ref}
        {...props}
        type={show ? "text" : "password"}
        adornment={
          <button
            type="button"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-text-soft hover:text-brand-hover"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
    )
  },
)

export const SelectBox = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<"select">>(
  function SelectBox({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-[3px] border border-border bg-background pl-3 pr-9 text-sm focus-visible:outline-2 focus-visible:outline-brand",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-soft"
        />
      </div>
    )
  },
)

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "id"> & {
  id: string
  label: string
  error?: string
  required?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, error, required, children, ...props },
  ref,
) {
  const errorId = `${id}-error`
  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <SelectBox
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {children}
      </SelectBox>
      <FieldError id={errorId} message={error} />
    </div>
  )
})

export const EnsField = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<"input">, "id"> & { error?: string; required?: boolean }
>(function EnsField({ error, required, className, ...props }, ref) {
  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor="ensName" required={required}>
        Nome ENS
      </FieldLabel>
      <div className="flex gap-2.5">
        <div className="w-[78px] shrink-0">
          <SelectBox aria-label="Domínio ENS" defaultValue=".eth">
            <option value=".eth">.eth</option>
          </SelectBox>
        </div>
        <input
          id="ensName"
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? "ensName-error" : undefined}
          className={cn(inputClass, "min-w-0 flex-1", className)}
          {...props}
        />
      </div>
      <FieldError id="ensName-error" message={error} />
    </div>
  )
})