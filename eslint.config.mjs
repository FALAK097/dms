import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "out/**",
      "build/**",
      "src/generated/**",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
    ],
  },
];

export default eslintConfig;
