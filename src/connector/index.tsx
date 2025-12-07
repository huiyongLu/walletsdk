import { useWeb3 } from "../provider";
import { useState, useRef, useEffect } from "react";
import type { ChainConfig, WalletProvider } from "../types";

const WALLETS: WalletProvider[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/wallets/metamask.svg",
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/wallets/coinbase.svg",
    installUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "/wallets/trust.svg",
    installUrl: "https://trustwallet.com/",
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: "/wallets/brave.svg",
    installUrl: "https://brave.com/wallet/",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "/wallets/walletconnect.svg",
  },
];

// 生成头像颜色（基于地址）
const generateAvatarColor = (address: string): string => {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#ef4444", // red
  ];
  const index = parseInt(address.slice(2, 3), 16) % colors.length;
  return colors[index];
};

// 生成头像 emoji（基于地址）
const generateAvatarEmoji = (address: string): string => {
  const emojis = ["🥦", "🌿", "🌱", "🍃", "🌾", "🌳"];
  const index = parseInt(address.slice(2, 3), 16) % emojis.length;
  return emojis[index];
};

export default function WalletConnector({ chains }: { chains: ChainConfig[] }) {
  const { state, connectWallet, disconnectWallet, switchChain, clearError } =
    useWeb3();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const walletModalRef = useRef<HTMLDivElement>(null);
  const chainModalRef = useRef<HTMLDivElement>(null);
  const accountModalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭模态框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletModalRef.current &&
        !walletModalRef.current.contains(event.target as Node)
      ) {
        setShowWalletModal(false);
      }
      if (
        chainModalRef.current &&
        !chainModalRef.current.contains(event.target as Node)
      ) {
        setShowChainModal(false);
      }
      if (
        accountModalRef.current &&
        !accountModalRef.current.contains(event.target as Node)
      ) {
        setShowAccountModal(false);
      }
    };

    if (showWalletModal || showChainModal || showAccountModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWalletModal, showChainModal, showAccountModal]);

  // 连接成功后自动关闭钱包选择弹框
  useEffect(() => {
    if (state.account && showWalletModal) {
      // 使用 setTimeout 避免在 effect 中直接调用 setState
      const timer = setTimeout(() => {
        setShowWalletModal(false);
        clearError(); // 清除错误信息
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state.account, showWalletModal, clearError]);

  // 处理钱包连接
  const handleConnectWallet = async (wallet: WalletProvider) => {
    try {
      console.log(`正在连接 ${wallet.name}...`);
      await connectWallet(wallet);
      // 连接成功后关闭弹框
      setShowWalletModal(false);
      console.log(`${wallet.name} 连接成功，弹框已关闭`);
    } catch (error) {
      console.error("连接钱包失败:", error);
      // 连接失败时不关闭弹框，让用户可以重试
    }
  };

  // 获取当前链信息
  const getCurrentChain = () => {
    return chains.find((chain) => chain.id === state.chainId) || chains[0];
  };

  // 获取当前链的货币符号
  const getCurrentCurrencySymbol = () => {
    return getCurrentChain()?.currencySymbol || "ETH";
  };

  // 处理切换网络
  const handleSwitchChain = async (chainId: number) => {
    try {
      await switchChain(chainId);
      setShowChainModal(false);
    } catch (error) {
      console.error("切换网络失败:", error);
    }
  };

  // 复制地址
  const handleCopyAddress = async () => {
    if (state.account) {
      try {
        await navigator.clipboard.writeText(state.account);
        // 可以添加提示
      } catch (error) {
        console.error("复制失败:", error);
      }
    }
  };

  // 未连接状态
  if (!state.account) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            setShowWalletModal(true);
            clearError(); // 打开弹框时清除之前的错误
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          连接钱包
        </button>

        {/* 钱包选择模态框 */}
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              ref={walletModalRef}
              className="bg-white rounded-lg shadow-xl p-6 min-w-[320px] max-w-[400px]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  选择钱包
                </h3>
                <button
                  onClick={() => {
                    setShowWalletModal(false);
                    clearError();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 错误提示 */}
              {state.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      {state.error}
                    </p>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnectWallet(wallet)}
                    className="w-full flex items-center gap-4 px-4 py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-gray-200"
                  >
                    {wallet.icon && (
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-10 h-10"
                        onError={(e) => {
                          // 如果图片加载失败，显示占位符
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">
                        {wallet.name}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 已连接状态
  const currentChain = getCurrentChain();
  const avatarColor = state.account
    ? generateAvatarColor(state.account)
    : "#10b981";
  const avatarEmoji = state.account ? generateAvatarEmoji(state.account) : "🥦";

  return (
    <div className="flex gap-3 items-center">
      {/* 网络选择器按钮 */}
      <div className="relative">
        <button
          onClick={() => {
            setShowChainModal(!showChainModal);
            setShowAccountModal(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-white text-xs">⟠</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {currentChain?.name || "Unknown"}
          </span>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 网络选择模态框 */}
        {showChainModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              ref={chainModalRef}
              className="bg-white rounded-lg shadow-xl p-4 min-w-[280px] max-h-[400px] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  选择网络
                </h3>
                <button
                  onClick={() => setShowChainModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleSwitchChain(chain.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      state.chainId === chain.id
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs">⟠</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {chain.name}
                      </div>
                    </div>
                    {state.chainId === chain.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 账户信息按钮 */}
      <div className="relative">
        <button
          onClick={() => {
            setShowAccountModal(!showAccountModal);
            setShowChainModal(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-gray-700">
            {state.balance || "0.0000"} {getCurrentCurrencySymbol()}
          </span>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: avatarColor }}
          >
            {avatarEmoji}
          </div>
          <span className="text-sm font-mono text-gray-700">
            {state.account.slice(0, 4)}...{state.account.slice(-4)}
          </span>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 账户详情模态框 */}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              ref={accountModalRef}
              className="bg-white rounded-lg shadow-xl p-6 min-w-[320px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  账户详情
                </h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarEmoji}
                </div>
                <div className="text-sm font-mono text-gray-700 mb-2 break-all text-center">
                  {state.account}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {state.balance || "0.0000"} {getCurrentCurrencySymbol()}
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleCopyAddress}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
                >
                  复制地址
                </button>
                <button
                  onClick={async () => {
                    await disconnectWallet();
                    setShowAccountModal(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  断开连接
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
