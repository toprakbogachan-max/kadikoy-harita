import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    /* Alt çizgiyle başlayan parametre "bilerek kullanılmıyor" demek.
       Kategori rengi arayüzden çekilince fotoZemin/zeminSimgeRengi gibi
       fonksiyonlar tür parametresini artık okumuyor ama imzayı koruyorlar
       (otuzdan fazla çağıran var). Bu, uyarı değil bilgi. */
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
