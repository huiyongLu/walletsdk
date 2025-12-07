export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  currencySymbol: string;
}

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  installUrl?: string;
}
