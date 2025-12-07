/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from "react";
import type { ChainConfig, WalletProvider } from "../types";

interface Web3State {
  account?: string;
  chainId?: number;
  selectedWallet?: string;
  balance?: string;
  error?: string;
}

const Web3Context = createContext<{
  state: Web3State;
  connectWallet: (provider: WalletProvider) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  clearError: () => void;
}>(null!);

export function Web3Provider({
  children,
  chains: _chains, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  children: React.ReactNode;
  chains: ChainConfig[];
}) {
  const [state, setState] = useState<Web3State>({});

  // 获取余额
  const getBalance = async (account: string, ethereumProvider?: any) => {
    const provider = ethereumProvider || (window as any).ethereum;
    if (!provider) return "0.0000";

    try {
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      // 将 wei 转换为 ETH (1 ETH = 10^18 wei)
      const balanceInEth = Number(balance) / 1e18;
      return balanceInEth.toFixed(4);
    } catch (error) {
      console.error("获取余额失败:", error);
      return "0.0000";
    }
  };

  // 监听账户变化（仅在用户主动连接后才响应）
  useEffect(() => {
    if (!(window as any).ethereum || !state.account) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      const account = accounts[0];
      if (!account) {
        // 如果账户被断开，清除状态
        setState({
          account: undefined,
          chainId: undefined,
          selectedWallet: undefined,
          balance: undefined,
        });
      } else if (account.toLowerCase() !== state.account?.toLowerCase()) {
        // 如果账户切换了，更新账户和余额
        const balance = await getBalance(account);
        setState((prev) => ({ ...prev, account, balance }));
      }
    };

    // 监听链变化，更新链ID和余额
    const handleChainChanged = async (chainId: string) => {
      const newChainId = Number(chainId);
      setState((prev) => ({
        ...prev,
        chainId: newChainId,
      }));

      // 链变化后重新获取余额
      if (state.account) {
        try {
          const balance = await getBalance(state.account);
          setState((prev) => ({
            ...prev,
            balance,
          }));
          console.log("链变化后余额已更新:", balance);
        } catch (balanceError) {
          console.error("获取余额失败:", balanceError);
          setState((prev) => ({
            ...prev,
            balance: undefined,
          }));
        }
      }
    };

    (window as any).ethereum?.on("accountsChanged", handleAccountsChanged);
    (window as any).ethereum?.on("chainChanged", handleChainChanged);

    return () => {
      (window as any).ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      (window as any).ethereum?.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [state.account]);

  // 撤销钱包授权
  const revokePermissions = async (ethereumProvider?: any) => {
    const provider = ethereumProvider || (window as any).ethereum;
    if (!provider) return;

    try {
      // 先检查是否有权限
      const permissions = await provider.request({
        method: "wallet_getPermissions",
      });

      // 如果有 eth_accounts 权限，则撤销
      const hasEthAccounts = permissions.some(
        (perm: any) => perm.parentCapability === "eth_accounts"
      );

      if (hasEthAccounts) {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      // 如果钱包不支持撤销权限，忽略错误
      console.log("撤销授权失败或不支持:", error);
    }
  };

  // 检查是否是真正的 MetaMask 提供者
  const isMetaMaskProvider = (provider: any): boolean => {
    if (!provider) return false;

    // MetaMask 的标识特征
    // 1. isMetaMask 为 true
    // 2. 不是其他钱包（Trust Wallet、Brave Wallet、Coinbase Wallet）
    const hasMetaMaskFlag = provider.isMetaMask === true;
    const isNotOtherWallet =
      !provider.isTrust &&
      !provider.isBraveWallet &&
      !provider.isCoinbaseWallet;

    const isMetaMask = hasMetaMaskFlag && isNotOtherWallet;

    // 调试信息
    if (hasMetaMaskFlag) {
      console.log("检测到 isMetaMask 标志:", {
        isMetaMask,
        isTrust: provider.isTrust,
        isBraveWallet: provider.isBraveWallet,
        isCoinbaseWallet: provider.isCoinbaseWallet,
      });
    }

    return isMetaMask;
  };

  // 根据钱包类型获取正确的提供者
  const getWalletProvider = (walletId: string) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.warn("未检测到 ethereum 提供者");
      return null;
    }

    console.log("检测钱包提供者:", {
      walletId,
      hasProviders: !!ethereum.providers,
      providersCount: ethereum.providers?.length || 0,
      isMetaMask: ethereum.isMetaMask,
      isTrust: ethereum.isTrust,
    });

    // 如果存在多个提供者（多个钱包扩展）
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      console.log(
        "检测到多个钱包提供者:",
        ethereum.providers.map((p: any) => ({
          isMetaMask: p.isMetaMask,
          isTrust: p.isTrust,
          isBraveWallet: p.isBraveWallet,
          isCoinbaseWallet: p.isCoinbaseWallet,
        }))
      );

      if (walletId === "metamask") {
        // 查找真正的 MetaMask 提供者
        const metamaskProvider = ethereum.providers.find((p: any) =>
          isMetaMaskProvider(p)
        );

        if (metamaskProvider) {
          console.log("✅ 找到 MetaMask 提供者，将使用它来连接");
          return metamaskProvider;
        }

        // 如果找不到 MetaMask，返回 null（不要回退到其他钱包）
        console.warn("❌ 未找到 MetaMask 提供者");
        return null;
      } else if (walletId === "coinbase") {
        // 查找 Coinbase Wallet 提供者
        const coinbaseProvider = ethereum.providers.find(
          (p: any) => p.isCoinbaseWallet
        );
        if (coinbaseProvider) {
          console.log("✅ 找到 Coinbase Wallet 提供者");
          return coinbaseProvider;
        }
        return null;
      } else if (walletId === "trust") {
        // 查找 Trust Wallet 提供者
        const trustProvider = ethereum.providers.find((p: any) => p.isTrust);
        if (trustProvider) {
          console.log("✅ 找到 Trust Wallet 提供者");
          return trustProvider;
        }
        return null;
      } else if (walletId === "brave") {
        // 查找 Brave Wallet 提供者
        const braveProvider = ethereum.providers.find(
          (p: any) => p.isBraveWallet
        );
        if (braveProvider) {
          console.log("✅ 找到 Brave Wallet 提供者");
          return braveProvider;
        }
        return null;
      } else if (walletId === "walletconnect") {
        // WalletConnect 通常有自己的提供者
        const walletConnectProvider = ethereum.providers.find(
          (p: any) => p.isWalletConnect
        );
        if (walletConnectProvider) return walletConnectProvider;
      }

      // 如果没找到特定的，返回 null（不要回退到第一个）
      return null;
    }

    // 单个提供者情况
    if (walletId === "metamask") {
      if (isMetaMaskProvider(ethereum)) {
        console.log("✅ 使用单个 MetaMask 提供者");
        return ethereum;
      }
      // 如果是其他钱包但用户选择了 MetaMask，返回 null 提示安装
      console.warn("❌ 当前提供者不是 MetaMask");
      return null;
    } else if (walletId === "coinbase") {
      if (ethereum.isCoinbaseWallet) {
        console.log("✅ 使用单个 Coinbase Wallet 提供者");
        return ethereum;
      }
      return null;
    } else if (walletId === "trust") {
      if (ethereum.isTrust) {
        console.log("✅ 使用单个 Trust Wallet 提供者");
        return ethereum;
      }
      return null;
    } else if (walletId === "brave") {
      if (ethereum.isBraveWallet) {
        console.log("✅ 使用单个 Brave Wallet 提供者");
        return ethereum;
      }
      return null;
    }

    // 对于其他钱包类型，返回默认提供者
    return ethereum;
  };

  const connectWallet = async (provider: WalletProvider) => {
    console.log(`🔌 开始连接钱包: ${provider.name} (${provider.id})`);

    const walletProvider = getWalletProvider(provider.id);

    if (!walletProvider) {
      console.error(`❌ 无法获取 ${provider.name} 提供者`);
      // 检查钱包是否已安装但未检测到
      const ethereum = (window as any).ethereum;
      let errorMessage: string;

      if (!ethereum) {
        // 没有检测到任何钱包
        errorMessage = `${provider.name} 未安装，请先安装钱包扩展`;
        if (provider.installUrl) {
          window.open(provider.installUrl, "_blank");
        }
      } else {
        // 检测到钱包但可能不是用户选择的类型
        errorMessage = `${provider.name} 未安装或不可用`;
        if (provider.installUrl) {
          window.open(provider.installUrl, "_blank");
        }
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }

    console.log(`✅ 已获取 ${provider.name} 提供者，准备连接...`);

    try {
      // 在连接前先撤销已有授权，确保每次都需要用户授权
      console.log("🔄 撤销已有授权...");
      await revokePermissions(walletProvider);

      // 等待一小段时间，确保撤销授权生效
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 先检查是否有已授权的账户
      const existingAccounts = await walletProvider.request({
        method: "eth_accounts",
      });

      // 如果有已授权的账户，先撤销权限
      if (existingAccounts && existingAccounts.length > 0) {
        await revokePermissions(walletProvider);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 使用 wallet_requestPermissions 明确请求权限（会强制弹出授权窗口）
      try {
        await walletProvider.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (permError: any) {
        // 如果 wallet_requestPermissions 失败，回退到 eth_requestAccounts
        // 某些钱包可能不支持 wallet_requestPermissions
        if (permError.code !== 4001) {
          // 4001 是用户拒绝，这是正常的
          console.log("使用 eth_requestAccounts 作为回退方案");
        }
      }

      // 请求账户访问（这会唤起对应的钱包插件）
      console.log("📱 正在唤起钱包插件请求授权...");
      let accounts: string[];

      try {
        accounts = await walletProvider.request({
          method: "eth_requestAccounts",
        });
        console.log("✅ 钱包插件已响应，账户:", accounts);
      } catch (requestError: any) {
        // 处理用户拒绝授权的情况
        const errorCode = requestError?.code;
        const errorMessage = requestError?.message || "未知错误";

        if (
          errorCode === 4001 ||
          errorMessage.includes("reject") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("User rejected")
        ) {
          const userRejectedError = "用户取消了连接请求";
          setState((prev) => ({ ...prev, error: userRejectedError }));
          throw new Error(userRejectedError);
        }

        const connectionError = `连接失败: ${errorMessage}`;
        setState((prev) => ({ ...prev, error: connectionError }));
        throw new Error(connectionError);
      }

      if (!accounts || accounts.length === 0) {
        const noAccountError = "未获取到账户，请确保钱包已解锁并授权";
        setState((prev) => ({ ...prev, error: noAccountError }));
        throw new Error(noAccountError);
      }

      const account = accounts[0];

      // 获取当前链 ID
      const chainIdHex = await walletProvider.request({
        method: "eth_chainId",
      });
      const chainId = Number(chainIdHex);

      const balance = await getBalance(account, walletProvider);

      console.log("钱包连接成功:", {
        wallet: provider.name,
        account,
        chainId,
        balance,
      });

      setState({
        account,
        chainId,
        selectedWallet: provider.id,
        balance,
        error: undefined, // 清除之前的错误
      });
    } catch (error) {
      console.error("连接失败:", error);
      // 如果错误信息还没有设置，设置一个通用错误
      const errorMessage =
        error instanceof Error ? error.message : "连接钱包失败";
      setState((prev) => {
        if (!prev.error) {
          return { ...prev, error: errorMessage };
        }
        return prev;
      });
      throw error;
    }
  };

  // 实现 switchChain 函数
  const switchChain = async (chainId: number) => {
    try {
      if (!state.account) {
        throw new Error("钱包未连接");
      }

      // 获取当前使用的钱包提供者
      const walletProvider = state.selectedWallet
        ? getWalletProvider(state.selectedWallet)
        : (window as any).ethereum;

      if (!walletProvider) {
        throw new Error("无法获取钱包提供者");
      }

      console.log(`🔄 正在切换到链 ID: ${chainId} (0x${chainId.toString(16)})`);

      await walletProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      console.log("✅ 网络切换成功");

      // 切换网络后更新链 ID
      setState((prev) => ({
        ...prev,
        chainId,
      }));

      // 等待一小段时间，确保链切换完成
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 切换网络后重新获取余额
      if (state.account) {
        try {
          console.log("🔄 正在获取新网络的余额...");
          const balance = await getBalance(state.account, walletProvider);
          setState((prev) => ({
            ...prev,
            balance,
          }));
          console.log("✅ 切换网络后余额已更新:", balance);
        } catch (balanceError) {
          console.error("❌ 获取余额失败:", balanceError);
          // 余额获取失败时设置为 undefined
          setState((prev) => ({
            ...prev,
            balance: undefined,
          }));
        }
      }
    } catch (error: any) {
      console.error("❌ 切换链失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "切换网络失败";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // 断开连接
  const disconnectWallet = async () => {
    // 清除应用状态
    setState({
      account: undefined,
      chainId: undefined,
      selectedWallet: undefined,
      balance: undefined,
      error: undefined,
    });

    // 撤销钱包授权
    await revokePermissions();
  };

  // 清除错误
  const clearError = () => {
    setState((prev) => ({ ...prev, error: undefined }));
  };

  return (
    <Web3Context.Provider
      value={{
        state,
        connectWallet,
        disconnectWallet,
        switchChain,
        clearError,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWeb3 = () => useContext(Web3Context);
