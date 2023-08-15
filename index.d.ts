import { ContextConf, CustomTemplateProxy } from "@next-core/types";

export const Fragment: symbol;

/**
 * 路由
 */
export function Route(props: {
  path: string;
  exact?: boolean;
  type?: "view" | "routes" | "redirect";
  context?: ContextConf[];
  children?: any[];
  redirect?: string;
  menu?: any;
  permissionsPreCheck?: string[];
  if?: any;
}): any;

/**
 * JSX 组件
 */
export function Component(props: {
  name: string;
  state?: ContextConf[];
  proxy?: CustomTemplateProxy;
  children?: any[];
}): any;

interface ControlNodeProps {
  /**
   * 控制节点使用的数据。
   *
   * 可使用绑定模式，例如 `value=bind(CTX.abc)`，当数据变化时，将自动重新渲染。
   */
  value: any;
  children?: any[];
  if?: any;
}

/**
 * 遍历 `value` 数组，循环渲染子节点，子节点可以使用 `ITEM` 访问对应的数据项。
 *
 * `value` 可使用绑定模式，例如 `value=bind(CTX.abc)`，当数据变化时，将自动重新渲染。
 */
export function ForEach(props: ControlNodeProps): any;

/**
 * 根据 `value` 决定：Truthy 时渲染默认 slot 下的子节点；Falsy 时渲染 `slot="else"` 下的子节点。
 *
 * `value` 可使用绑定模式，例如 `value=bind(CTX.abc)`，当数据变化时，将自动重新渲染。
 */
export function If(props: ControlNodeProps): any;

/**
 * 渲染 `value` 值对应的 `slot` 下的子节点。
 *
 * `value` 可使用绑定模式，例如 `value=bind(CTX.abc)`，当数据变化时，将自动重新渲染。
 */
export function Switch(props: ControlNodeProps): any;

/**
 * @deprecated
 */
export function LegacyTemplate(props: {
  template: string;
  params?: any;
  if?: any;
}): any;
