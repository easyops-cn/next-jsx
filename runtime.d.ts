import _ from "lodash";
import moment from "moment";
import { pipes as PIPES } from "@easyops-cn/brick-next-pipes";

export {
  _,
  moment,
  PIPES,
};

/**
 * 部分 `window.location` 对象。
 */
export const location: Readonly<{
  href: string;
  origin: string;
  host: string;
  hostname: string;
}>;

export const BASE_URL: string;

/** 用户获取图片地址 */
export const IMG: Readonly<{
  /** 根据名称获取图片地址 */
  get(name: string): string;
}>;

/** 使用国际化数据 */
export const I18N: (key: string, defaultValue?: string) => string;

/** 根据国际化配置转换数据 */
export const I18N_TEXT: (data: unknown) => string | undefined;

/** 用于权限校验 */
export const PERMISSIONS: Readonly<{
  /** 校验当前用户是否具有指定的一个或多个权限 */
  check(...actions: string[]): boolean;
}>;

/** 主题 */
export const THEME: Readonly<{
  /** 获取当前主题 */
  getTheme(): string;
}>;

/** URL hash 参数去掉前缀 `#` */
export const ANCHOR: string | null;

/** 当前应用 */
export const APP: Readonly<{
  /** 应用 ID */
  id: string;
  /** 应用主页地址 */
  homepage: string;
  /** 应用名称 */
  name: string;
  /** 应用本地化名称 */
  localeName: string;
  /** 应用配置 */
  config: Readonly<Record<string, any>>;
  /** 根据菜单 ID 获取菜单数据 */
  getMenu(menuId: string): any;
}>;

/** 当前页面的上下文状态数据 */
export const CTX: Readonly<Record<string,  any>>;

/** 给 `useBrick` 和 `transform` 传递的原始数据 */
export const DATA: any;

/** 事件处理器中的当前事件对象 */
export const EVENT: CustomEvent;

/** 特性开关 */
export const FLAGS: Readonly<Record<string, boolean>>;

/** URL hash 参数 */
export const HASH: string;

/** 已安装应用 */
export const INSTALLED_APPS: Readonly<{
  /** 检查是否已安装指定应用 */
  has(appId: string, matchVersion?: string): boolean;
}>;

/** 用于 `ForEach` 子节点中获取对应的数据项 */
export const ITEM: any;

/** 用于 `ForEach` 子节点中获取对应的数据项的索引，从 `0` 开始计数 */
export const INDEX: number;

/** 本地存储（JSON） */
export const LOCAL_STORAGE: Readonly<{
  /** 获取本地存储的指定数据（JSON） */
  getItem(name: string): any;
}>;

/** 媒体查询 */
export const MEDIA: Readonly<{
  /** 当前媒体查询的断点信息 */
  breakpoint: "xLarge" | "large" | "medium" | "small" | "xSmall";
}>;

/** 杂项配置 */
export const MISC: Readonly<Record<string, any>>;

/** 当前页面的 `URLSearchParams` 对象 */
export const PARAMS: URLSearchParams;

/** 当前页面路径参数对象 */
export const PATH: Readonly<Record<string, string>>;

/** 当前页面路径名 */
export const PATH_NAME: string;

/** JSX 组件（模板）中的状态数据 */
export const STATE: Readonly<Record<string, any>>;

/** 自定义处理函数 */
export const PROCESSORS: Readonly<Record<string, Readonly<Record<string, Function>>>>;

/** URL query 参数 */
export const QUERY: Readonly<Record<string, string | null>>;

/** URL query 参数（按数组返回每项参数值） */
export const QUERY_ARRAY: Readonly<Record<string, string[]>>;

/** 会话存储（JSON） */
export const SESSION_STORAGE: Readonly<{
  /** 获取会话存储的指定数据（JSON） */
  getItem(name: string): any;
}>;

/**
 * 系统信息
 */
export const SYS: Readonly<Record<string, any>>;

/**
 * 按原样返回输入的数据，并激活绑定模式。
 */
export function bind<T>(value: T): T;

/**
 * 按原样返回输入的数据，但是标注其内部的表达式可以被递归解析。
 *
 * 等同于 `<%~ value %>`
 */
export function recursive<T>(value: T): T;
