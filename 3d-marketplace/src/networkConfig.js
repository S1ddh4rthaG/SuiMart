import { createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_MARKETPLACE_PACKAGE_ID,
  MAINNET_MARKETPLACE_PACKAGE_ID,
  TESTNET_MARKETPLACE_PACKAGE_ID,
} from "./constants.js";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        suiMartPackageId: DEVNET_MARKETPLACE_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        suiMartPackageId: TESTNET_MARKETPLACE_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        suiMartPackageId: MAINNET_MARKETPLACE_PACKAGE_ID,
      },
    },
  });

export { networkConfig, useNetworkVariable, useNetworkVariables };
