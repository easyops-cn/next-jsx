import _ from "lodash";
import moment from "moment";
import { pipes as PIPES } from "@easyops-cn/brick-next-pipes";

export {
  _,
  moment,
  PIPES,
};

export const location: Readonly<{
  href: string;
  origin: string;
  host: string;
  hostname: string;
}>;

export const BASE_URL: string;
export const IMG: Readonly<{
  get(name: string): string;
}>;
export const I18N: (key: string, defaultValue?: string) => string;
export const I18N_TEXT: (data: unknown) => string | undefined;
export const PERMISSIONS: Readonly<{
  check(...actions: string[]): boolean;
}>;
export const THEME: Readonly<{
  getTheme(): string;
}>;

export const ANCHOR: string | null;
export const APP: Readonly<{
  id: string;
  homepage: string;
  name: string;
  localeName: string;
  config: Readonly<Record<string, any>>;
  getMenu(menuId: string): any;
}>;
export const CTX: Readonly<Record<string,  any>>;
export const DATA: any;
export const EVENT: CustomEvent;
export const FLAGS: Readonly<Record<string, boolean>>;
export const HASH: string;
export const INSTALLED_APPS: Readonly<{
  has(appId: string, matchVersion?: string): boolean;
}>;
export const ITEM: any;
export const LOCAL_STORAGE: Readonly<{
  getItem(name: string): any;
}>;
export const MEDIA: Readonly<{
  breakpoint: "xLarge" | "large" | "medium" | "small" | "xSmall";
}>;
export const MISC: Readonly<Record<string, any>>;
export const PARAMS: URLSearchParams;
export const PATH: Readonly<Record<string, string>>;
export const PATH_NAME: string;
export const STATE: Readonly<Record<string, any>>;
export const PROCESSORS: Readonly<Record<string, Readonly<Record<string, Function>>>>;
export const QUERY: Readonly<Record<string, string | null>>;
export const QUERY_ARRAY: Readonly<Record<string, string[]>>;
export const SESSION_STORAGE: Readonly<{
  getItem(name: string): any;
}>;
export const SYS: Readonly<Record<string, any>>;

export function bind<T>(value: T): T;
export function recursive<T>(value: T): T;
