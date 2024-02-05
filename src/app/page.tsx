import {
  createPublicClient,
  http,
  Address,
  parseEther,
  formatEther,
  formatUnits,
} from "viem";
import { Client } from "./client";
import { mainnet, arbitrum } from "viem/chains";
import { multiSigs } from "./data/data";
import { Metadata } from "next";
import { ContractInfo, MultiSig, TokenDetails } from "./types/types";
import {
  abiBalanceOf,
  abiOwners,
  abiGetThreshold,
  abiGetName,
  abiGetSymbol,
  abiGetDecimals,
  abiPieOf,
  abiREthRate,
  abiUsdEthRate,
  abiUsdArbRate,
} from "./abi/abi";

const transport = http(process.env.ARBITRUM);
const transportMainnet = http(process.env.MAINNET);
export const revalidate = 3600;

const ARB_TOKEN_CONTRACT = "0x912CE59144191C1204E64559FE8253a0e49E6548";
const USDC_ARB_TOKEN_CONTRACT = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const arbUsdc = "0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6"; //chain link arb usdc price feed
const usdEth = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; //chain link eth usd price feed

const publicClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: arbitrum,
  transport,
});

const publicClientMainnet = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: mainnet,
  transport: transportMainnet,
});

export const metadata: Metadata = {
  title: "ARB Multisigs",
  description: "Arbitrum Multisigs",
};

export default async function Home() {
  const multiSigData = await getMultiSigData({ multisigs: multiSigs });
  const blockTimestamp = (await publicClient.getBlock()).timestamp * 1000n;

  return <Client multiSigData={multiSigData} block={blockTimestamp} />;
}

async function getMultiSigData({
  multisigs,
}: {
  multisigs: ContractInfo[];
}): Promise<MultiSig[]> {
  const addresses = multisigs.map((multisig) => multisig.address);

  // Fetch balances and multisig info for each address
  const balances = await getBalances({ addresses });
  const multiSigInfos = await getMultiSigInfo({ addresses });

  // Merge the data from balances and multiSigInfos
  return multisigs.map((multisig) => {
    // Find the corresponding balance and multisig info for each multisig
    const balance = balances.find((b) => b.address === multisig.address);
    const multiSigInfo = multiSigInfos.find(
      (info) => info.address === multisig.address
    );

    // Merge with default values for MultiSig properties if not found
    return {
      ...multisig,
      ...balance,
      signers: multiSigInfo?.signers || [], // Default to empty array if not found
      threshold: multiSigInfo?.threshold || 0, // Default to 0 if not found
      multisig: multiSigInfo?.multisig || false, // Default to false if not found
    };
  });
}

async function getBalances({
  addresses,
}: {
  addresses: Address[];
}): Promise<ContractInfo[]> {
  const arbPrice = await getPrice("ARB");
  const ethPrice = await getPrice("ETH");

  const promises = addresses.map(async (address) => {
    const arbBalance = await getTokenBalance(ARB_TOKEN_CONTRACT, address);
    const usdcBalance = await getTokenBalance(USDC_ARB_TOKEN_CONTRACT, address);
    const ethBalance = await publicClient.getBalance({ address });

    const usdValue =
      (arbBalance * arbPrice) / BigInt(10 ** 8) + // Normalize ARB to 18 decimals and multiply by price
      (ethBalance * ethPrice) / BigInt(10 ** 8) + // Normalize ETH to 18 decimals and multiply by price
      usdcBalance * BigInt(10 ** 12); // Normalize USDC to 18 decimals

    return {
      address,
      ethBalance,
      arbBalance,
      usdcBalance,
      usdValue,
    };
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error reading balance contracts:", error);
    throw error;
  }
}

// Gets signers and threshold
async function getMultiSigInfo({
  addresses,
}: {
  addresses: Address[];
}): Promise<MultiSig[]> {
  const promises = addresses.map(async (address) => {
    const signers = await publicClient.readContract({
      address,
      abi: abiOwners,
      functionName: "getOwners",
    });

    const threshold = await publicClient.readContract({
      address,
      abi: abiGetThreshold,
      functionName: "getThreshold",
    });

    return {
      address: address,
      signers: [...signers],
      threshold: threshold as number,
      multisig: true,
    };
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error reading multisig contracts:", error);
    throw error;
  }
}

async function getTokenBalance(
  tokenContractAddress: Address,
  userAddress: Address
): Promise<bigint> {
  return await publicClient.readContract({
    address: tokenContractAddress,
    abi: abiBalanceOf,
    functionName: "balanceOf",
    args: [userAddress],
  });
}

async function getPrice(token: string): Promise<bigint> {
  if (token === "ARB") {
    return await publicClient.readContract({
      address: arbUsdc,
      abi: abiUsdArbRate,
      functionName: "latestAnswer",
    });
  } else if (token === "ETH") {
    return await publicClientMainnet.readContract({
      address: usdEth,
      abi: abiUsdEthRate,
      functionName: "latestAnswer",
    });
  } else {
    return 0n;
  }
}
