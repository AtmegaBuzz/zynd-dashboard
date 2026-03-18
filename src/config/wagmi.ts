import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { polygonAmoy } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
});
