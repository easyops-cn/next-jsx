import path from "node:path";
import { spawn } from "node:child_process";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parse } from "@babel/parser";
import babelGenerator from "@babel/generator";
import * as t from "@babel/types";
import babelTraverse from "@babel/traverse";
import { codeFrameColumns } from "@babel/code-frame";
import { babel, babelConfigFile } from "./babel.js";
import { transpile } from "./transpile.js";

const { default: traverse } = babelTraverse;
const { default: generate } = babelGenerator;

const builtins = new Set([
  "Array",
  "Boolean",
  "Date",
  "Infinity",
  "JSON",
  "Math",
  "NaN",
  "Number",
  "Object",
  "String",
  "atob",
  "btoa",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  // "location",
  "undefined",
]);

start();

function start() {
  const task = spawn(babel, [
    "src",
    "--config-file",
    babelConfigFile,
    "--out-dir",
    "temp",
    "--ignore",
    "*",
    "--copy-files",
    "--delete-dir-on-start",
    "--watch",
  ]);

  task.stdout.on("data", async (data) => {
    const out = String(data);
    console.log(out);
    if (out.includes("Successfully compiled ")) {
      try {
        await processFunctions();
        await processExpressions();
      } catch (e) {
        console.error("Transpile failed:", e);
        return;
      }

      transpile();
    }
  });

  task.stderr.on("data", (data) => {
    console.error(`${data}`);
  });

  task.on("close", (code) => {
    console.log(`Transpile exited with code ${code}`);
  });
}

async function processFunctions() {
  const functionsIndexJsPath = path.resolve(
    "temp/resources/functions/index.js"
  );
  if (!existsSync(functionsIndexJsPath)) {
    return;
  }
  const content = await readFile(functionsIndexJsPath, "utf-8");
  const ast = parse(content, { sourceType: "module" });
  const importsMap = new Map();
  const functions = new Set();
  traverse(ast, {
    ImportDeclaration({ node }) {
      for (const specifier of node.specifiers) {
        if (specifier.type === "ImportDefaultSpecifier") {
          importsMap.set(specifier.local.name, node.source.value);
        }
      }
    },
    ExportDefaultDeclaration({ node }) {
      if (node.declaration.type === "ObjectExpression") {
        for (const prop of node.declaration.properties) {
          if (prop.value.type === "Identifier") {
            functions.add(prop.value.name);
          }
        }
      }
    },
  });

  if (functions.size === 0) {
    return;
  }

  const statements = [
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("loadFunction"),
          t.identifier("loadFunction")
        ),
      ],
      t.stringLiteral("next-jsx")
    ),

    t.exportDefaultDeclaration(
      t.objectExpression(
        [...functions].map((fn) =>
          t.objectProperty(
            t.identifier(fn),
            t.callExpression(t.identifier("loadFunction"), [
              t.stringLiteral(importsMap.get(fn)),
              t.memberExpression(
                t.memberExpression(
                  t.identifier("import"),
                  t.identifier("meta")
                ),
                t.identifier("url")
              ),
            ])
          )
        )
      )
    ),
  ];

  const { code } = generate(t.program(statements, undefined, "module"));

  await writeFile(functionsIndexJsPath, code);
}

function processExpressions() {
  return Promise.all([
    processExpressionsInFile("temp/routes.jsx"),
    processExpressionsInDir("temp/views", true),
    processExpressionsInDir("temp/components", true),
    processExpressionsInDir("temp/resources/menus"),
  ]);
}

async function processExpressionsInFile(filePath, processCssAsWell) {
  const srcFilePath = filePath.replace(/^temp\//, "src/");
  const content = await readFile(srcFilePath, "utf-8");

  const isJsx = filePath.endsWith(".jsx");
  const hasCss = isJsx && processCssAsWell && /\.css['"]/.test(content);
  const plugins = isJsx ? ["jsx"] : [];
  const ast = parse(content, { plugins, sourceType: "module" });
  let transformed = false;
  let importedCss = false;
  let jsxImportDeclaration;
  let hasLoadStyleText = false;

  traverse(ast, {
    enter(path) {
      if (path.node.type === "CallExpression") {
        const bindNode = getRuntimeCallArg(
          path.node,
          path.scope,
          "bind",
          content,
          srcFilePath
        );
        let recursiveNode;
        if (bindNode) {
          if (bindNode.type === "CallExpression") {
            recursiveNode = getRuntimeCallArg(
              bindNode,
              path.scope,
              "recursive",
              content,
              srcFilePath
            );
          }
        } else {
          recursiveNode = getRuntimeCallArg(
            path.node,
            path.scope,
            "recursive",
            content,
            srcFilePath
          );
        }
        const exprNode = recursiveNode || bindNode;
        if (exprNode) {
          const exprSource = content.substring(exprNode.start, exprNode.end);
          const exprString = `<%${recursiveNode ? "~" : bindNode ? "=" : ""} ${
            recursiveNode && bindNode
              ? `"track ${
                  /\bSTATE\s*[.\[]/.test(exprSource) ? "state" : "context"
                }",`
              : ""
          }${exprSource} %>`;
          path.replaceWith(t.stringLiteral(exprString));
          transformed = true;
          return;
        }
      }
      if (isJsonCompatible(path, content, srcFilePath)) {
        return;
      }
      const exprSource = `<% ${content.substring(
        path.node.start,
        path.node.end
      )} %>`;
      path.replaceWith(t.stringLiteral(exprSource));
      transformed = true;
    },
    ImportDeclaration(path) {
      if (path.node.source.value === "next-jsx") {
        jsxImportDeclaration = path.node;
      }
    },
    ImportSpecifier(path) {
      const { node } = path;
      if (
        path.parent.source.value === "next-jsx" &&
        node.local.name === "loadStyleText" &&
        node.imported.type === "Identifier" &&
        node.imported.name === "loadStyleText"
      ) {
        hasLoadStyleText = true;
      }
    },
    ImportDefaultSpecifier(path) {
      if (
        hasCss &&
        path.parent.source.value.startsWith(".") &&
        path.parent.source.value.endsWith(".css")
      ) {
        const varDeclaration = t.variableDeclaration("const", [
          t.variableDeclarator(
            path.node.local,
            t.callExpression(t.identifier("loadStyleText"), [
              path.parent.source,
              t.memberExpression(
                t.memberExpression(
                  t.identifier("import"),
                  t.identifier("meta")
                ),
                t.identifier("url")
              ),
            ])
          ),
        ]);
        path.parentPath.replaceWith(varDeclaration);
        transformed = true;
        importedCss = true;
      }
    },
  });

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "next-jsx/runtime") {
        path.remove();
        transformed = true;
      }
    },
    ImportDefaultSpecifier(path) {
      if (
        path.parent.source.value.startsWith(".") &&
        path.node.local.name === "FN"
      ) {
        path.remove();
        transformed = true;
      }
    },
  });

  if (!transformed) {
    return;
  }

  if (importedCss) {
    if (jsxImportDeclaration) {
      if (!hasLoadStyleText) {
        jsxImportDeclaration.specifiers.push(
          t.importSpecifier(
            t.identifier("loadStyleText"),
            t.identifier("loadStyleText")
          )
        );
      }
    } else {
      ast.program.body.unshift(
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier("loadStyleText"),
              t.identifier("loadStyleText")
            ),
          ],
          t.stringLiteral("next-jsx")
        )
      );
    }
  }

  const { code } = generate(ast, {
    jsescOption: {
      minimal: true,
    },
    comments: false,
  });
  await writeFile(filePath, code);
}

async function processExpressionsInDir(dir, processCssAsWell) {
  const items = await readdir(dir, { withFileTypes: true });
  return Promise.all(
    items.map(async (item) => {
      if (item.isFile()) {
        if (/\.jsx?$/.test(item.name)) {
          const filePath = path.join(dir, item.name);
          await processExpressionsInFile(filePath, processCssAsWell);
        }
      } else if (item.isDirectory()) {
        await processExpressionsInDir(
          path.join(dir, item.name),
          processCssAsWell
        );
      }
    })
  );
}

/**
 * @param {babelTraverse.NodePath<t.Node>} path
 * @param {string} raw
 * @param {string} filePath
 * @returns {boolean}
 */
function isJsonCompatible(path, raw, filePath) {
  const { node } = path;
  switch (node.type) {
    case "ObjectProperty":
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
      return true;
    case "UnaryExpression":
      // `-1` is also JSON compatible, except for `-0`
      return (
        node.operator === "-" &&
        node.argument.type === "NumericLiteral" &&
        node.argument.value !== 0
      );
  }

  return (
    t.isJSX(node) ||
    !t.isExpression(node) ||
    (node.type === "Identifier" && isGeneralIdentifier(path, raw, filePath)) ||
    (node.type === "ObjectExpression" &&
      node.properties.every(
        (p) =>
          p.type === "ObjectProperty" &&
          (p.key.type === "StringLiteral" ||
            (p.key.type === "Identifier" && !p.computed))
      )) ||
    (node.type === "ArrayExpression" &&
      node.elements.every((e) => e.type !== "SpreadElement"))
  );
}

/**
 * @param {babelTraverse.NodePath<t.Identifier>} path
 * @param {string} raw
 * @param {string} filePath
 * @returns {boolean}
 */
function isGeneralIdentifier(path, raw, filePath) {
  const { node, parent, scope } = path;
  let binding;
  return (
    // Non-computed property keys
    (path.key === "key" &&
      parent.type === "ObjectProperty" &&
      !parent.computed) ||
    // Import specifiers
    parent.type === "ImportSpecifier" ||
    parent.type === "ImportDefaultSpecifier" ||
    ((binding = scope.getBinding(node.name))
      ? !(
          (binding.path.node.type === "ImportSpecifier" &&
            binding.path.parent.source.value === "next-jsx/runtime") ||
          (binding.path.node.type === "ImportDefaultSpecifier" &&
            node.name === "FN")
        )
      : !builtins.has(node.name) &&
        (console.warn(
          `Warn: unknown variable "%s" (%s:%s:%s)`,
          node.name,
          filePath,
          node.loc.start.line,
          node.loc.start.column
        ),
        console.warn(codeFrameColumns(raw, node.loc)),
        true))
  );
}

/**
 *
 * @param {t.CallExpression} node
 * @param {babelTraverse.Scope} scope
 * @param {string} name
 * @param {string} raw
 * @param {string} filePath
 */
function getRuntimeCallArg(node, scope, name, raw, filePath) {
  const { callee, arguments: args } = node;
  let binding;
  if (
    callee.type === "Identifier" &&
    callee.name === name &&
    (binding = scope.getBinding(name)) &&
    binding.path.node.type === "ImportSpecifier" &&
    binding.path.parent.source.value === "next-jsx/runtime" &&
    binding.path.node.local.name === name &&
    binding.path.node.imported.type === "Identifier" &&
    binding.path.node.imported.name === name
  ) {
    if (args.length !== 1) {
      const message = `\`${name}()\` expect exactly one argument, received: ${args.length}`;
      console.error(
        `${message} (${filePath}:%s:%s)`,
        node.loc.start.line,
        node.loc.start.column
      );
      console.error(codeFrameColumns(raw, node.loc));
      throw new Error(message);
    }
    return args[0];
  }
}
