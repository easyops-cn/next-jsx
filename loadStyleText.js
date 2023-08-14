import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * @param {string} url
 * @param {string} from
 */
export default function loadStyleText(url, from) {
  const textContent = readFileSync(
    path.resolve(fileURLToPath(from), "..", url),
    "utf-8"
  );
  return textContent;
}
