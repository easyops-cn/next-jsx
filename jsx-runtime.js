import {
  Component,
  ForEach,
  Fragment,
  If,
  Route,
  Switch,
  LegacyTemplate,
} from "./constants.js";

export { Fragment };

// Not including "children" | "slot".
const RESERVED_PROP_KEYS = new Set([
  "events",
  "lifeCycle",
  "if",
  "portal",
  "ref",
]);

const NodeType = Symbol("NodeType");
const PropNamespace = "prop:";
const ConfNamespace = "conf:";

export function jsx(type, config) {
  switch (type) {
    case Fragment: {
      const { slot, children } = config;
      return fixBrickChildren(children, slot);
    }

    case Route: {
      let route;
      if (config.type === "redirect") {
        route = config;
      } else if (config.type === "routes") {
        const { children, ...restConfig } = config;
        route = {
          ...restConfig,
          routes: [].concat(children ?? []),
        };
      } else {
        const { view, ...restConfig } = config;
        route = {
          ...restConfig,
          bricks: fixBrickChildren(view),
        };
      }
      return {
        [NodeType]: "route",
        ...route,
      };
    }

    case Component: {
      const { children, ...restConfig } = config;
      return {
        ...restConfig,
        bricks: fixBrickChildren(config.children),
      };
    }

    case ForEach:
    case If:
    case Switch: {
      const { children, value, ...restConfig } = config;
      return {
        ...restConfig,
        dataSource: value,
        brick: type === ForEach ? ":forEach" : type === If ? ":if" : ":switch",
        slots: childrenToSlots(fixBrickChildren(config.children)),
      };
    }

    case LegacyTemplate:
      return config;
  }

  if (typeof type === "function") {
    return type(config);
  }

  const properties = {};
  const reservedConfig = {};

  let slot;
  for (const [key, value] of Object.entries(config)) {
    if (key.includes(":")) {
      if (key.startsWith(PropNamespace)) {
        const k = key.substring(PropNamespace.length);
        properties[k] = value;
      } else if (key.startsWith(ConfNamespace)) {
        const k = key.substring(ConfNamespace.length);
        reservedConfig[k] = value;
      } else {
        throw new Error(`Unsupported namespace prop: "${originalKey}"`);
      }
    } else if (key === "slot") {
      slot = value;
    } else if (key === "children") {
      // Ignore
    } else if (RESERVED_PROP_KEYS.has(key)) {
      reservedConfig[key] = value;
    } else {
      properties[key] = value;
    }
  }

  let slots = undefined;
  if (config.children) {
    if (typeof config.children === "string") {
      properties.textContent = config.children;
    } else {
      const children = fixBrickChildren(config.children);
      slots = childrenToSlots(children);
      delete properties.textContent;
    }
  }

  return {
    brick: typeof type === "string" ? type.replaceAll("_", ".") : type,
    properties,
    slots,
    slot,
    ...reservedConfig,
  };
}

function fixBrickChildren(children, slot) {
  return []
    .concat(children ?? [])
    .flat(Infinity)
    .map((child) => {
      const fixedChild =
        typeof child === "string"
          ? {
              brick: "span",
              properties: {
                textContent: child,
              },
            }
          : child;
      if (slot != null) {
        fixedChild.slot = slot;
      }
      return fixedChild;
    });
}

function childrenToSlots(children) {
  const slots = {};
  for (const child of children) {
    const slot = child.slot ?? "";
    delete child.slot;
    const type = child[NodeType] === "route" ? "routes" : "bricks";
    if (!Object.prototype.hasOwnProperty.call(slots, slot)) {
      slots[slot] = {
        type,
        [type]: [],
      };
    }
    slots[slot][type].push(child);
  }
  return slots;
}

export { jsx as jsxs };
