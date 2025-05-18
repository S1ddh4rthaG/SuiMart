import { ConnectButton, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { networkConfig } from "./networkConfig.js"

import "@mysten/dapp-kit/dist/index.css"
import App from "./App.js"
import { SharedStateProvider, useSharedState } from "./sharedState.js"
import "./styles.css"

function Overlay() {
  const { text, setText, desc, setDesc, price, setPrice, user, setUser } = useSharedState()

  return (
    <>
      <div className="dot" />
      <p className="hovertext">{text}</p>
      <p className="pricetext">
        {price} {price && "MIST"}
      </p>
      <p className="useraddress">
        <ConnectButton 
          onClick={() => {
            setText("Hover over products to see details")
            setDesc("Product Details")
            setPrice("")
          }}
        >Connect Wallet</ConnectButton>
      </p>
      <p className="desc" id="desc">
        💡{desc}
        {desc && (
          <>
            {" "}
            <br />
            🛒 Click on the product to buy{" "}
          </>
        )}
      </p>
      <App />
    </>
  )
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <SharedStateProvider>
            <Overlay />
          </SharedStateProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
