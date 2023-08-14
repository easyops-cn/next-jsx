import path from "node:path";
import { writeFile } from "node:fs/promises";
import yaml from "js-yaml";

const { safeDump, JSON_SCHEMA } = yaml;

export async function build() {
  const [
    {
      default: { appId },
    },
    { default: storyboard },
  ] = await Promise.all([
    import(path.resolve(process.cwd(), "next-jsx.config.js")),
    import(path.resolve(process.cwd(), "dist/index.js")),
  ]);

  storyboard.meta = {
    ...storyboard.resources.meta,
    customTemplates: storyboard.components,
    functions: Object.values(storyboard.resources.functions),
    menus: storyboard.resources.menus,
    contracts: storyboard.resources.contracts,
    i18n: storyboard.resources.i18n,
  };
  delete storyboard.resources;
  delete storyboard.components;

  await Promise.all([
    writeFile(
      path.resolve(
        process.cwd(),
        `./mock-micro-apps/${appId}`,
        "storyboard.yaml"
      ),
      safeDump(storyboard, {
        indent: 2,
        schema: JSON_SCHEMA,
        skipInvalid: true,
        noRefs: true,
        noCompatMode: true,
      })
    ),
    writeFile(
      path.resolve(
        process.cwd(),
        `./mock-micro-apps/${appId}`,
        "storyboard.json"
      ),
      JSON.stringify(storyboard, null, 2)
    ),
  ]);
}

const start = performance.now();
build().then(
  () => {
    console.log("Build done!", `(${Math.round(performance.now() - start)}ms)`);
  },
  (err) => {
    console.error("Build failed:", err);
  }
);
