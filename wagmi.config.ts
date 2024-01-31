import { http, createConfig } from "wagmi";
import { mainnet, arbitrum } from "wagmi/chains";

export const config = createConfig({
  chains: [mainnet, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});
