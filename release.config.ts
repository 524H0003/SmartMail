import type { GlobalConfig } from "semantic-release";

const config: GlobalConfig = {
  tagFormat: "v${version}",
  repositoryUrl: "https://github.com/524H0003/SmartMail",
  branches: ["main", { name: "dev-*", prerelease: "dev" }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", { npmPublish: false }],
    "@semantic-release/github",
  ],
};

export default config;
