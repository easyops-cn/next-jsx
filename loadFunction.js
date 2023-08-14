import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import babelGenerator from "@babel/generator";
import babelTraverse from "@babel/traverse";

const { default: traverse } = babelTraverse;
const { default: generate } = babelGenerator;

/**
 * @param {string} url
 * @param {string} from
 */
export default function loadFunction(url, from) {
  const jsPath = path.resolve(fileURLToPath(from), "..", url);
  const tsPath = jsPath.replace(/\.js$/, ".ts");
  const typescript = (!existsSync(jsPath) && existsSync(tsPath)) || undefined;
  const resolvedPath = typescript ? tsPath : jsPath;
  const [name] = path.basename(resolvedPath).split(".");
  const source = readFileSync(resolvedPath, "utf-8");

  // Remove all import declarations,
  // and replace `export default function() {}` with `function () {}`
  const ast = parse(source, {
    plugins: typescript ? ["typescript"] : [],
    sourceType: "module",
  });
  traverse(ast, {
    ImportDeclaration(path) {
      path.remove();
    },
    ExportDefaultDeclaration(path) {
      path.replaceWith(path.node.declaration);
    },
  });
  const { code } = generate(ast);

  return {
    name,
    typescript,
    source: code,
  };
}
