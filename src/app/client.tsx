"use client";
import Image from "next/image";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Checkbox } from "@/components/ui/checkbox";
import { useEnsName } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Address, formatUnits } from "viem";
import { MultiSig } from "./types/types";
import { useState } from "react";

export function Client({
  multiSigData,

  block,
}: {
  multiSigData: MultiSig[];

  block: bigint;
}) {
  const [selectedWg, setSelectedWg] = useState<string>("all");
  const [showZeroBalance, setShowZeroBalance] = useState<boolean>(false);

  const handleCheckboxChange = (value: boolean) => {
    setShowZeroBalance(value);
  };

  const filteredData = multiSigData
    .filter((multisig) => {
      return (
        (selectedWg === "all" || multisig.label === selectedWg) &&
        (showZeroBalance ||
          !isZero(multisig.ethBalance || 0n, 18) ||
          !isZero(multisig.usdcBalance || 0n, 6) ||
          !isZero(multisig.arbBalance || 0n, 18))
      );
    })
    .sort((a, b) => {
      // Handle cases where label might be undefined or null
      const labelA = a.arbBalance || 0;
      const labelB = b.arbBalance || 0;

      // Compare for alphabetical sorting
      if (labelA > labelB) {
        return -1;
      }
      if (labelA < labelB) {
        return 1;
      }
      return 0;
    });

  const totalEth = filteredData.reduce(
    (acc, curr) => acc + (curr.ethBalance || 0n),
    0n
  );
  const totalArb = filteredData.reduce(
    (acc, curr) => acc + (curr.arbBalance || 0n),
    0n
  );

  const totalUsdc = filteredData.reduce(
    (acc, curr) => acc + (curr.usdcBalance || 0n),
    0n
  );

  const totalUsd = filteredData.reduce(
    (acc, curr) => acc + (curr.usdValue || 0n),
    0n
  );

  const date = new Date(Number(block));
  console.log(date.toString());

  return (
    <main className="flex min-h-screen flex-col  items-center sm:p-24 mx-auto">
      <h1 className="sm:text-3xl text-2xl sm:mt-0 my-10 font-extrabold ">
        Arbitrum Multisigs
      </h1>
      <div className="absolute mt-9 text-xs hidden sm:block  text-gray-200">
        {date.toLocaleDateString()}
      </div>

      <div>
        {/*Desktop Table*/}
        <Table className="hidden sm:block">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48  text-lg text-center">
                {/* <Select onValueChange={(value) => setSelectedWg(value)}>
                  <SelectTrigger className="w-[180px] text-lg">
                    <SelectValue placeholder="Working Group" />
                  </SelectTrigger>
                  <SelectContent className="text-lg">
                    <SelectItem value="all">Working Group</SelectItem>
                    <SelectItem value="Public Goods">Public Goods</SelectItem>
                    <SelectItem value="Ecosystem">Ecosystem</SelectItem>
                    <SelectItem value="Metagov">Metagov</SelectItem>
                  </SelectContent>
                </Select> */}
                Multisig
              </TableHead>
              <TableHead className="text-center text-lg   min-w-48">
                Signers
              </TableHead>
              <TableHead className="text-right text-lg w-60">
                Balances
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((multisig, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-base  min-w-52">
                  <div className="text-left pt-2 text-gray-700">
                    {multisig.label}
                  </div>
                  <WalletAddress address={multisig.address} />
                  <div className="text-left  text-gray-400">
                    Signers: {multisig.threshold.toLocaleString()}/
                    {multisig.signers.length}
                  </div>
                </TableCell>

                <TableCell className="flex flex-col   min-w-56 max-w-96 flex-wrap">
                  {multisig.signers.map((signer, signerIndex) => (
                    <DisplaySigner
                      key={signerIndex}
                      address={signer as Address}
                    />
                  ))}
                </TableCell>

                <TableCell className="text-right font-mono  ">
                  <div className="flex text-right font-mono flex-col">
                    <span>
                      {formatCurrency(multisig.ethBalance as bigint, 18, 1)}{" "}
                      &nbsp;ETH
                    </span>

                    <span>
                      {formatCurrency(
                        multisig.usdcBalance as bigint,
                        6,
                        1,
                        true
                      )}{" "}
                      USDC
                    </span>
                    <span>
                      {formatCurrency(
                        multisig.arbBalance as bigint,
                        18,
                        1,
                        true
                      )}{" "}
                      &nbsp;ARB
                    </span>

                    <span className="overline decoration-double mb-1">
                      {formatCurrency(multisig.usdValue as bigint, 18, 1, true)}{" "}
                      &nbsp;USD
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="text-lg font-bold">
              <TableCell className="font-normal text-sm text-gray-400 flex gap-1">
                <Checkbox
                  onCheckedChange={handleCheckboxChange}
                  checked={showZeroBalance}
                />
                Show Zero Balance
              </TableCell>
              <TableCell className="text-right">Total</TableCell>

              <TableCell className="text-right">
                <div className="flex text-right font-mono flex-col">
                  <span>
                    {formatCurrency(totalEth as bigint, 18, 1)} &nbsp;ETH
                  </span>
                  <span>
                    {formatCurrency(totalUsdc as bigint, 6, 1, true)} USDC
                  </span>
                  <span>
                    {formatCurrency(totalArb as bigint, 18, 1, true)} &nbsp;ARB
                  </span>
                  <span className="overline decoration-double mb-1">
                    {formatCurrency(totalUsd as bigint, 18, 1, true)} &nbsp;USD
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {/*Mobile Table*/}
        <div>
          <Table className="sm:hidden w-full ">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">
                  {/* <Select onValueChange={(value) => setSelectedWg(value)}>
                    <SelectTrigger className="max-w-36">
                      <SelectValue placeholder="Working Group" />
                    </SelectTrigger>
                    <SelectContent className="text-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Public Goods">Public Goods</SelectItem>
                      <SelectItem value="Ecosystem">Ecosystem</SelectItem>
                      <SelectItem value="Metagov">Metagov</SelectItem>
                    </SelectContent>
                  </Select> */}
                  Multisig
                </TableHead>
                <TableHead className="text-center">Signers</TableHead>
                <TableHead className="text-center">Balances</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((multisig, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium  text-xs max-w-9 p-1">
                    <div className="text-xs text-left pt-2 text-gray-800">
                      {multisig.label}
                    </div>
                    <WalletAddress address={multisig.address} />
                    <div className="text-xs text-left pt-2 text-gray-400">
                      Signers: {multisig.threshold.toLocaleString()}/
                      {multisig.signers.length}
                    </div>
                  </TableCell>

                  <TableCell className="flex flex-col max-w-28">
                    {multisig.signers.map((signer, signerIndex) => (
                      <DisplaySigner
                        key={signerIndex}
                        address={signer as Address}
                        mobile={true}
                      />
                    ))}
                  </TableCell>
                  {/*Balance Summary*/}
                  <TableCell className="text-xs">
                    <div className="flex text-right font-mono flex-col">
                      <span>
                        {formatCurrency(multisig.ethBalance as bigint, 18, 1)}{" "}
                        &nbsp;ETH
                      </span>
                      <span>
                        {formatCurrency(
                          multisig.usdcBalance as bigint,
                          6,
                          1,
                          true
                        )}{" "}
                        USDC
                      </span>
                      <span>
                        {formatCurrency(
                          multisig.arbBalance as bigint,
                          18,
                          1,
                          true
                        )}{" "}
                        &nbsp;ARB
                      </span>

                      <span className="overline decoration-double mb-1">
                        {formatCurrency(
                          multisig.usdValue as bigint,
                          18,
                          1,
                          true
                        )}{" "}
                        &nbsp;USD
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-normal text-sm text-gray-400 flex gap-1">
                  <Checkbox
                    onCheckedChange={handleCheckboxChange}
                    checked={showZeroBalance}
                  />
                  Show Zero Balance
                </TableCell>
                <TableCell className="text-right  text-base font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right text-xs font-mono font-bold">
                  <div className="flex flex-col">
                    <span>{formatCurrency(totalEth, 18, 1)} &nbsp;ETH</span>
                    <span>{formatCurrency(totalUsdc, 6, 0, true)} USDC</span>
                    <span>
                      {formatCurrency(totalArb, 18, 0, true)} &nbsp;ARB
                    </span>
                    <span className="overline decoration-double mb-1">
                      {formatCurrency(totalUsd, 18, 0, true)} &nbsp;USD
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}

function DisplaySigner({
  address,
  mobile = false,
}: {
  address: Address;
  mobile?: boolean;
}) {
  const { data: ensName, isLoading: isLoadingEnsName } = useEnsName({
    address,
  });

  const displayAddress =
    address.substring(0, 6) + "..." + address.substring(address.length - 4);

  return (
    <span className="py-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex text-lg">
            {!mobile && (
              <Avatar className="w-10 h-10 drop-shadow-md">
                <AvatarImage
                  className="cursor-pointer "
                  src={`https://metadata.ens.domains/mainnet/avatar/${ensName}`}
                />
                <AvatarFallback></AvatarFallback>
              </Avatar>
            )}
            <span className=" text-xs mt-0 pl-0 sm:text-base text-left sm:mt-2 sm:pl-2 ">
              {ensName || displayAddress}
            </span>
          </TooltipTrigger>
          <TooltipContent copyText={address} className="">
            {address}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

function WalletAddress({ address }: { address: Address }) {
  const { data: ensName, isLoading } = useEnsName({
    address: address,
  });
  const displayAddress =
    address.substring(0, 6) + "..." + address.substring(address.length - 4);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={() =>
            openEtherScan({
              address: address,
              chain: "arb",
            })
          }
          className="flex flex-col gap-1"
        >
          <span className="text-xs sm:text-base truncate text-gray-700 w-full text-left ">
            {ensName
              ? ensName.length > 15
                ? ensName.substring(0, 15) + "..."
                : ensName
              : ""}
          </span>
          <span className="w-full  text-xs sm:text-base  text-gray-400 text-left">
            {displayAddress}
          </span>
        </TooltipTrigger>
        <TooltipContent
          copyText={address}
          onClick={() =>
            openEtherScan({
              address: address,
              chain: "arb",
            })
          }
          className=""
        >
          {address}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatCurrency(
  amount: bigint,
  tokenDecimals: number,
  displayDecimals: number,
  short: boolean = false // Default to false if not provided
): string {
  const formattedNumber = parseFloat(formatUnits(amount, tokenDecimals));

  if (short) {
    return formatShort(formattedNumber);
  } else {
    const formatted = formattedNumber.toFixed(displayDecimals);
    return new Intl.NumberFormat("en-US").format(parseFloat(formatted));
  }
}

function formatShort(num: number): string {
  if (num < 1_000) return num.toFixed(1);
  if (num >= 1_000 && num < 1_000_000) return (num / 1_000).toFixed(1) + "k";
  if (num >= 1_000_000 && num < 1_000_000_000)
    return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  return num.toString(); // Fallback for very large numbers
}

//is zero checks if the balance is less than 0.01 or undefine, if so it returns true
const isZero = (amount: bigint, tokenDecimals: number): boolean => {
  if (amount === undefined) {
    return true;
  } else {
    const amountNumber = parseFloat(formatUnits(amount, tokenDecimals));

    return amountNumber <= 0.05;
  }
};

async function openEtherScan({
  address,
  chain,
}: {
  address: Address;
  chain?: string;
}) {
  // Copy address to clipboard
  await navigator.clipboard.writeText(address);
  let baseUrl;
  if (chain === "arb") {
    baseUrl = "https://arbiscan.io/address/";
  } else {
    baseUrl = "https://etherscan.io/address/";
  }

  // Define the URL to open - replace with the appropriate URL format
  const url = `${baseUrl}${address}`;
  window.open(url, "_blank");
}
