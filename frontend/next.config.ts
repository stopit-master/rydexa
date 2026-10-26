import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // A parent-level lockfile exists outside this repository. Keep Next's
  // tracing boundary local so it does not infer the parent directory.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
