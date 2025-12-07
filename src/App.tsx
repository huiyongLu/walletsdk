import "./App.css";
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
  {
    id: 56,
    name: "BNB Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    currencySymbol: "BNB",
  },
];

function App() {
  return (
    <>
      <Web3Provider chains={chains}>
        <div className="p-8">
          <WalletConnector chains={chains} />
        </div>
      </Web3Provider>
    </>
  );
}

export default App;
