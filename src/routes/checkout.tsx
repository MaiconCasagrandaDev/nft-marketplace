import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "@/features/auth/useAuth";
import {
  errorQuote,
  quoteKey,
  useConnectWallet,
  useCreateOrder,
  useQuote,
  useWallets,
} from "@/features/checkout/hooks";
import { Totals } from "@/features/checkout/Totals";
import { getApiError } from "@/lib/api";
import { formatEth } from "@/lib/format";
import { networkLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CreateOrderInput } from "@/types/checkout";
import type { Network } from "@/types/nft";

const networks = Object.keys(networkLabels) as [Network, ...Network[]];

const schema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  phone: z.string(),
  walletId: z.string().min(1, "Selecione uma carteira"),
  network: z.enum(networks),
});
type Values = z.infer<typeof schema>;

const PROVIDERS = [
  { name: "WalletConnect", letter: "W" },
  { name: "MetaMask", letter: "M" },
  { name: "Coinbase Wallet", letter: "C" },
];

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const button =
  "rounded bg-brand px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60";
const ghost =
  "rounded border border-brand px-5 py-2 text-sm font-bold text-brand hover:text-brand-hover";
const input = "h-10 w-full border border-border bg-background px-3 text-sm";
const cell = "grid content-start gap-1.5";
const label = "text-sm";
const radio =
  "size-5 shrink-0 appearance-none rounded-full border border-[#5a3a28] bg-transparent checked:border-[#D28A4C] checked:bg-[radial-gradient(circle,#D28A4C_42%,transparent_46%)]";

function Star() {
  return <span className="text-brand"> *</span>;
}

function Breadcrumb() {
  return (
    <nav aria-label="Navegação" className="hidden pt-8 text-sm font-bold md:block">
      <Link to="/" className="hover:text-brand-hover">
        Início
      </Link>
      {" / "}
      <Link to="/" hash="catalogo" className="hover:text-brand-hover">
        Mercado
      </Link>
      {" / "}
      <span>Pagamento</span>
    </nav>
  );
}

function MobileTop() {
  const router = useRouter();
  return (
    <div className="relative flex items-center justify-center py-4 md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => router.history.back()}
        className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="text-lg font-bold">Pagamento com carteira</h1>
    </div>
  );
}

export function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useSession();
  const quote = useQuote();
  const wallets = useWallets();
  const connect = useConnectWallet();
  const createOrder = useCreateOrder();
  const lastInput = useRef<CreateOrderInput | null>(null);

  const [step, setStep] = useState<"form" | "review">("form");
  const [connectedKey, setConnectedKey] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviewedQuoteId, setReviewedQuoteId] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [provider, setProvider] = useState("Coinbase Wallet");

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      walletId: "",
      network: "ethereum",
    },
  });

  const values = watch();
  const currentKey = `${values.walletId}:${values.network}`;
  const connected = connectedKey === currentKey;

  useEffect(() => {
    if (!user) return;
    if (!getValues("fullName")) setValue("fullName", user.displayName);
    if (!getValues("email")) setValue("email", user.email);
  }, [user, getValues, setValue]);

  useEffect(() => {
    if (!wallets.data || getValues("walletId")) return;
    const main = wallets.data.find((w) => w.primary) ?? wallets.data[0];
    if (main) {
      setValue("walletId", main.id);
      setValue("network", main.network);
    }
  }, [wallets.data, getValues, setValue]);

  if (quote.isPending || wallets.isPending) {
    return (
      <div>
        <Breadcrumb />
        <MobileTop />
        <div
          className="grid gap-8 py-6 lg:grid-cols-[1fr_405px]"
          aria-busy="true"
        >
          <div className="shimmer h-96 bg-card" />
          <div className="shimmer h-64 bg-card" />
        </div>
      </div>
    );
  }

  if (quote.isError || wallets.isError) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar o pagamento.</p>
        <button
          type="button"
          className={button}
          onClick={() => {
            quote.refetch();
            wallets.refetch();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const q = quote.data;
  if (q.items.length === 0 && step === "form") {
    return (
      <div>
        <MobileTop />
        <div className="py-16 text-center">
          <h2 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h2>
          <Link to="/" className="text-brand hover:text-brand-hover">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  const selectedWallet = wallets.data.find((w) => w.id === values.walletId);
  // a cotação mudou depois que o usuário revisou: exige nova confirmação
  const changed =
    step === "review" &&
    !uncertain &&
    reviewedQuoteId !== null &&
    reviewedQuoteId !== q.quoteId;

  function pickWallet(id: string) {
    const picked = wallets.data?.find((x) => x.id === id);
    setValue("walletId", id, { shouldValidate: true });
    if (picked) setValue("network", picked.network);
    setConnectError(null);
  }

  function onConnect() {
    setConnectError(null);
    connect.mutate(
      { walletId: values.walletId, network: values.network },
      {
        onSuccess: () => setConnectedKey(currentKey),
        onError: (error) => {
          setConnectedKey(null);
          setConnectError(getApiError(error).message);
        },
      },
    );
  }

  async function onReview() {
    setNotice(null);
    setSubmitError(null);
    if (!connected) {
      setConnectError("Conecte a carteira antes de revisar o pedido.");
      return;
    }
    // revalida preço, disponibilidade, cupom e taxas antes da revisão
    const fresh = (await quote.refetch()).data;
    if (!fresh || fresh.items.length === 0) {
      setNotice("Seu carrinho está vazio.");
      return;
    }
    if (fresh.issues.length > 0) {
      setNotice(
        "A disponibilidade de algum item mudou. Ajuste o carrinho antes de continuar.",
      );
    }
    setStep("review");
    setReviewedQuoteId(fresh.quoteId);
  }

  function onConfirm() {
    if (changed) {
      // o usuário reconhece os novos valores antes de poder enviar
      setReviewedQuoteId(q.quoteId);
      setNotice(null);
      return;
    }
    // nova tentativa após falha de rede: reenvia exatamente o mesmo pedido
    const retrying = uncertain && lastInput.current !== null;
    setNotice(null);
    setSubmitError(null);
    setUncertain(false);
    const v = getValues();
    const input: CreateOrderInput =
      retrying && lastInput.current
        ? lastInput.current
        : {
            quoteId: q.quoteId,
            walletId: v.walletId,
            network: v.network,
            collector: {
              fullName: v.fullName.trim(),
              email: v.email.trim(),
              phone: v.phone,
            },
          };
    lastInput.current = input;

    createOrder.mutate(input, {
      onSuccess: (order) => {
        lastInput.current = null;
        router.navigate({ to: "/order/$id", params: { id: order.id } });
      },
      onError: (error) => {
        const apiError = getApiError(error);
        if (apiError.code !== "NETWORK") lastInput.current = null;
        const fresh = errorQuote(error);
        if (fresh) qc.setQueryData(quoteKey, fresh);

        switch (apiError.code) {
          case "QUOTE_CHANGED":
            setNotice(
              "Os valores do pedido mudaram. Revise o novo total e confirme novamente.",
            );
            break;
          case "AVAILABILITY_CHANGED":
            setNotice(
              "A disponibilidade de algum item mudou. Ajuste o carrinho antes de continuar.",
            );
            break;
          case "VALIDATION":
            if (apiError.fields) {
              for (const [name, message] of Object.entries(apiError.fields)) {
                setError(name as keyof Values, { message });
              }
            }
            setStep("form");
            break;
          case "NETWORK":
            setUncertain(true);
            setSubmitError(
              "Não recebemos resposta do servidor. Tente de novo: o pedido não será duplicado.",
            );
            break;
          default:
            setSubmitError(apiError.message);
        }
      },
    });
  }

  return (
    <div>
      <Breadcrumb />
      <MobileTop />

      <div className="grid gap-6 pb-10 pt-2 md:gap-10 md:pb-16 md:pt-6 lg:grid-cols-[1fr_405px] lg:gap-[30px]">
        <div className="grid content-start gap-6">
          {notice && (
            <p role="alert" className="border border-brand p-3 text-sm">
              {notice}
            </p>
          )}

                    {/* tela mobile do Figma: carteira, carteira e rede, total */}
          {step === "form" && (
            <section aria-label="Pagamento com carteira" className="grid gap-5 md:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {connected ? "Carteira conectada" : "Selecione a carteira"}
                </h2>
                {connected && (
                  <button
                    type="button"
                    onClick={() => setConnectedKey(null)}
                    className="text-xs font-bold text-brand"
                  >
                    Trocar carteira
                  </button>
                )}
              </div>

              <ul className="grid gap-4">
                {wallets.data.map((w) => (
                  <li key={w.id}>
                    <label className="flex cursor-pointer items-start gap-4 rounded-2xl bg-card p-5 has-[:checked]:ring-1 has-[:checked]:ring-brand/60">
                      <input
                        type="radio"
                        name="m-wallet"
                        value={w.id}
                        checked={values.walletId === w.id}
                        onChange={() => pickWallet(w.id)}
                        className={`${radio} mt-0.5`}
                      />
                      <span className="grid flex-1 gap-1">
                        <span className="text-sm font-bold">{w.label}</span>
                        <span className="text-xs text-text-soft">{shortAddress(w.address)}</span>
                        <span className="text-xs text-text-soft">
                          Rede {networkLabels[w.network]}
                        </span>
                      </span>
                      <MoreVertical
                        aria-hidden="true"
                        className="size-4 shrink-0 self-center text-brand"
                      />
                    </label>
                  </li>
                ))}
              </ul>
              {errors.walletId && (
                <p role="alert" className="text-sm text-red-400">
                  {errors.walletId.message}
                </p>
              )}

              <h2 className="text-sm font-bold">Carteira e rede</h2>
              <ul className="grid gap-3">
                {PROVIDERS.map((p) => (
                  <li key={p.name}>
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-card px-4 py-4">
                      <span
                        aria-hidden="true"
                        className="grid size-10 place-items-center rounded-full bg-[#3a2217] text-xs font-bold text-brand"
                      >
                        {p.letter}
                      </span>
                      <span className="flex-1 text-xs">{p.name}</span>
                      <input
                        type="radio"
                        name="m-provider"
                        value={p.name}
                        checked={provider === p.name}
                        onChange={() => setProvider(p.name)}
                        className={radio}
                      />
                    </label>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-end gap-6 text-sm font-bold">
                <span>Total:</span>
                <span
                  aria-hidden="true"
                  data-v={`${formatEth(q.total)} ETH`}
                  className="text-base text-brand before:content-[attr(data-v)]"
                />
              </div>

              {connectError && (
                <p role="alert" className="text-sm text-red-400">
                  {connectError}
                </p>
              )}
              {(errors.fullName || errors.email) && (
                <p role="alert" className="text-sm text-red-400">
                  Complete nome e e-mail da conta para continuar.
                </p>
              )}

              {connected ? (
                <button
                  type="submit"
                  form="checkout-form"
                  className="mt-6 h-14 rounded-full bg-gradient-to-r from-[#d99a5f] to-[#a8683a] text-sm font-bold text-primary-foreground"
                >
                  Revisar pedido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={!values.walletId || connect.isPending}
                  className="mt-6 h-14 rounded-full bg-gradient-to-r from-[#d99a5f] to-[#a8683a] text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                  {connect.isPending ? "Conectando..." : "Conectar carteira"}
                </button>
              )}
            </section>
          )}

          {step === "form" && (
            <section aria-labelledby="c-perfil" className="hidden gap-5 md:grid">
              <h1 id="c-perfil" className="text-base font-bold">
                Perfil do colecionador
              </h1>
              <form
                id="checkout-form"
                onSubmit={handleSubmit(onReview)}
                noValidate
                className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
              >
                <div className={cell}>
                  <label htmlFor="fullName" className={label}>
                    Nome de exibição
                    <Star />
                  </label>
                  <input
                    id="fullName"
                    autoComplete="name"
                    aria-invalid={!!errors.fullName}
                    className={input}
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p role="alert" className="text-sm text-red-400">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className={cell}>
                  <label htmlFor="username" className={label}>
                    Nome de usuário
                  </label>
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    className={input}
                  />
                </div>

                <div className={cell}>
                  <label htmlFor="network" className={label}>
                    Rede
                    <Star />
                  </label>
                  <select
                    id="network"
                    className={input}
                    {...register("network", {
                      onChange: () => setConnectError(null),
                    })}
                  >
                    {networks.map((n) => (
                      <option key={n} value={n}>
                        {networkLabels[n]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={cell}>
                  <label htmlFor="profile" className={label}>
                    Nome do perfil
                  </label>
                  <input id="profile" name="profile" className={input} />
                </div>

                <div className={cell}>
                  <label htmlFor="address" className={label}>
                    Endereço da carteira
                    <Star />
                  </label>
                  <input
                    id="address"
                    readOnly
                    aria-readonly="true"
                    value={selectedWallet?.address ?? ""}
                    placeholder="Endereço 0x da carteira"
                    className={input}
                  />
                </div>

                <div className={cell}>
                  <label htmlFor="secondary" className="sr-only">
                    ENS ou carteira secundária (opcional)
                  </label>
                  <input
                    id="secondary"
                    name="secondary"
                    placeholder="ENS ou carteira secundária (opcional)"
                    className={`${input} sm:mt-[26px]`}
                  />
                </div>

                <div className={cell}>
                  <label htmlFor="walletType" className={label}>
                    Tipo de carteira
                    <Star />
                  </label>
                  <select
                    id="walletType"
                    className={input}
                    value={values.walletId}
                    onChange={(e) => pickWallet(e.target.value)}
                  >
                    {wallets.data.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={cell}>
                  <label htmlFor="referral" className={label}>
                    Código de indicação
                  </label>
                  <input id="referral" name="referral" className={input} />
                </div>

                <div className={cell}>
                  <label htmlFor="email" className={label}>
                    E-mail
                    <Star />
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    className={input}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p role="alert" className="text-sm text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className={cell}>
                  <label htmlFor="ens" className={label}>
                    Nome ENS
                  </label>
                  <select
                    id="ens"
                    name="ens"
                    className="h-10 w-[78px] border border-border bg-background px-2 text-sm"
                  >
                    <option>.eth</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name="otherWallet"
                    className="size-4 accent-[#D28A4C]"
                  />
                  Usar outra carteira?
                </label>

                <div className={`${cell} sm:col-span-2`}>
                  <label htmlFor="note" className={label}>
                    Observação do colecionador (opcional)
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    className="h-36 w-full max-w-[350px] border border-border bg-background p-3 text-sm"
                  />
                </div>
              </form>
            </section>
          )}

          {step === "review" && (
            <section
              aria-labelledby="c-revisao"
              className="grid gap-4 rounded-2xl bg-card p-6 md:rounded-none"
            >
              <h2 id="c-revisao" className="text-lg font-bold">
                Revisão do pedido
              </h2>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-text-soft">Colecionador</dt>
                  <dd>
                    {values.fullName} · {values.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-soft">Carteira</dt>
                  <dd>
                    {selectedWallet?.label} (
                    {selectedWallet && shortAddress(selectedWallet.address)})
                  </dd>
                </div>
                <div>
                  <dt className="text-text-soft">Rede</dt>
                  <dd>{networkLabels[values.network]}</dd>
                </div>
              </dl>

              {changed && (
                <p role="alert" className="border border-brand p-3 text-sm">
                  Os valores do pedido mudaram. Confira o resumo ao lado e
                  confirme os novos valores para continuar.
                </p>
              )}

              {submitError && (
                <p role="alert" className="text-sm text-red-400">
                  {submitError}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={createOrder.isPending || q.issues.length > 0}
                  className={cn(button, "max-md:h-14 max-md:flex-1 max-md:rounded-full max-md:text-base")}
                >
                  {createOrder.isPending
                    ? "Enviando pedido..."
                    : changed
                      ? "Confirmar novos valores"
                      : submitError
                        ? "Tentar novamente"
                        : "Confirmar compra"}
                </button>
                <button
                  type="button"
                  className={ghost}
                  disabled={createOrder.isPending}
                  onClick={() => {
                    setStep("form");
                    setNotice(null);
                    setSubmitError(null);
                  }}
                >
                  Editar dados
                </button>
                {q.issues.length > 0 && (
                  <Link to="/cart" className={ghost}>
                    Ajustar carrinho
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>

        <aside
          aria-label="Resumo do pedido"
          className={cn(
            "content-start gap-4",
            step === "form" ? "hidden md:grid" : "grid",
          )}
        >
          <h2 className="text-base font-bold">Seus NFTs</h2>

          <div className="flex justify-between border-b border-border pb-2 text-sm font-bold">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>

          <ul className="grid gap-3">
            {q.items.map((l) => {
              const issue = q.issues.find((i) => i.nftId === l.nft.id);
              return (
                <li
                  key={l.nft.id}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-3 bg-card p-1.5"
                >
                  <img
                    src={l.nft.image}
                    alt={l.nft.name}
                    className="size-16 rounded object-cover"
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-bold">{l.nft.name}</p>
                    <p className="text-xs text-text-soft">
                      ID do token: {l.nft.tokenId}
                    </p>
                    {issue && (
                      <p role="alert" className="text-xs text-red-400">
                        {issue.code === "UNAVAILABLE"
                          ? "Indisponível"
                          : `Restam apenas ${issue.available}`}
                      </p>
                    )}
                  </div>
                  <p className="text-right text-sm">
                    <span className="text-text-soft">(x {l.quantity})</span>{" "}
                    <span className="font-bold text-brand">
                      {formatEth(l.lineTotal)} ETH
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="text-center text-sm">
            Tem um código promocional?{" "}
            <Link to="/cart" className="text-brand hover:text-brand-hover">
              Aplique aqui
            </Link>
          </p>

          <Totals
            subtotal={q.subtotal}
            discount={q.discount}
            networkFee={q.networkFee}
            total={q.total}
            couponCode={q.coupon?.code}
          />

          {step === "form" && (
            <section aria-labelledby="c-carteira" className="grid gap-3">
              <h2 id="c-carteira" className="text-center text-base font-bold">
                Carteira e rede
              </h2>

              <fieldset className="grid gap-2">
                <legend className="sr-only">Carteira</legend>
                {wallets.data.map((w) => (
                  <label
                    key={w.id}
                    className="flex cursor-pointer items-center gap-3 border border-border p-3 has-[:checked]:border-white"
                  >
                    <input
                      type="radio"
                      value={w.id}
                      className="accent-[#D28A4C]"
                      {...register("walletId", {
                        onChange: (e: { target: { value: string } }) =>
                          pickWallet(e.target.value),
                      })}
                    />
                    <span>
                      <span className="block text-sm font-bold">
                        {w.label}
                        {w.primary &&
                          !/principal/i.test(w.label) &&
                          " (principal)"}
                      </span>
                      <span className="block text-xs text-text-soft">
                        {shortAddress(w.address)} · {networkLabels[w.network]}
                      </span>
                    </span>
                  </label>
                ))}
                {errors.walletId && (
                  <p role="alert" className="text-sm text-red-400">
                    {errors.walletId.message}
                  </p>
                )}
              </fieldset>

              <button
                type="button"
                onClick={onConnect}
                disabled={!values.walletId || connect.isPending || connected}
                className={`${ghost} w-full`}
              >
                {connect.isPending
                  ? "Conectando..."
                  : connected
                    ? "Carteira conectada"
                    : "Conectar carteira"}
              </button>
              {connected && selectedWallet && (
                <p role="status" className="text-center text-sm text-brand">
                  {shortAddress(selectedWallet.address)} conectada
                </p>
              )}
              {connectError && (
                <p role="alert" className="text-sm text-red-400">
                  {connectError}
                </p>
              )}

              <button
                type="submit"
                form="checkout-form"
                className={`${button} w-full py-3`}
              >
                Revisar pedido
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}