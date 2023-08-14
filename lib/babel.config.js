import presetEnv from "@babel/preset-env";
import presetReact from "@babel/preset-react";

export default function () {
  return {
    presets: [
      [
        presetEnv,
        {
          modules: false,
          targets: {
            node: "current",
          },
        },
      ],
      [
        presetReact,
        {
          runtime: "automatic",
          importSource: "next-jsx",
          throwIfNamespace: false,
        },
      ],
    ],
    comments: false,
  };
}
