import { formatEth } from "@/lib/format"

interface Props {
  subtotal: string
  discount: string
  networkFee: string
  total: string
  couponCode?: string | null
}

export function Totals({ subtotal, discount, networkFee, total, couponCode }: Props) {
  const row = "flex justify-between text-sm"
  return (
    <dl className="grid gap-2">
      <div className={row}>
        <dt>Subtotal</dt>
        <dd>{formatEth(subtotal)} ETH</dd>
      </div>
      {Number(discount) > 0 && (
        <div className={row}>
          <dt>Desconto{couponCode ? ` (${couponCode})` : ""}</dt>
          <dd>-{formatEth(discount)} ETH</dd>
        </div>
      )}
      <div className={row}>
        <dt>Taxa de rede</dt>
        <dd>{formatEth(networkFee)} ETH</dd>
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
        <dt>Total</dt>
        <dd className="text-brand">{formatEth(total)} ETH</dd>
      </div>
    </dl>
  )
}