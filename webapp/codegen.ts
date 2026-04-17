import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('graphql-codegen-core').CodegenConfig} */
const config = {
  schema: path.resolve(__dirname, "../contract/schema.graphql"),
  documents: path.resolve(__dirname, "src/gql/operations.graphql"),
  generates: {
    [path.resolve(__dirname, "src/gql/generated.ts")]: {
      plugins: [
        "typescript",
        "typescript-operations",
      ],
    },
    "../contract/schema.graphql": {
      plugins: ["schema-ast"],
    },
  },
};

export default config;
