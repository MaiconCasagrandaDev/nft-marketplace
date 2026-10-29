export const scenarios = {
  failFavorites: false,
  orderTimeout: false,
  walletMode: "approve" as "approve" | "reject" | "disconnect",
}

export type Scenarios = typeof scenarios
export type ScenarioName = keyof Scenarios