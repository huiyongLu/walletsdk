# walletsdk

Web3 钱包连接 SDK，支持多个主流钱包和网络。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS v4
- EIP-1193 标准

## 功能特性

- ✅ 支持多个钱包：MetaMask、Coinbase Wallet、Trust Wallet、Brave Wallet
- ✅ 支持多个网络：Ethereum、Sepolia、BNB Chain
- ✅ 自动检测已安装的钱包
- ✅ 网络切换功能
- ✅ 余额显示和更新
- ✅ 用户友好的错误提示

## 使用方法

### 1. 基本使用

```tsx
import { Web3Provider } from "./provider";
import WalletConnector from "./connector";

const chains = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_KEY",
    currencySymbol: "ETH",
  },
  {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
    currencySymbol: "ETH",
  },
];

function App() {
  return (
    <Web3Provider chains={chains}>
      <WalletConnector chains={chains} />
    </Web3Provider>
  );
}
```

### 2. 使用 useWeb3 Hook

```tsx
import { useWeb3 } from "./provider";

function MyComponent() {
  const {
    state,
    connectWallet,
    disconnectWallet,
    switchChain,
    clearError,
  } = useWeb3();

  return (
    <div>
      {state.account ? (
        <div>
          <p>账户: {state.account}</p>
          <p>余额: {state.balance} {state.chainId === 1 ? "ETH" : "ETH"}</p>
          <button onClick={disconnectWallet}>断开连接</button>
        </div>
      ) : (
        <button onClick={() => connectWallet({ id: "metamask", name: "MetaMask" })}>
          连接钱包
        </button>
      )}
    </div>
  );
}
```

## 支持的网络

- **Ethereum Mainnet** (链 ID: 1)
- **Sepolia Testnet** (链 ID: 11155111)
- **BNB Chain** (链 ID: 56)

## 支持的钱包

- **MetaMask** - 最流行的以太坊钱包
- **Coinbase Wallet** - Coinbase 官方钱包
- **Trust Wallet** - 多链钱包
- **Brave Wallet** - Brave 浏览器内置钱包
- **WalletConnect** - 跨平台钱包连接协议

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```
