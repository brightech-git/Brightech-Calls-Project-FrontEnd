import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  transpilePackages: ["@chakra-ui/react"],
};

export default nextConfig;
