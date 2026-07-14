import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Malabar Coast",
    short_name: "Malabar Coast",
    description: "Southern Indian coastal restaurant in Holytown, Motherwell.",
    start_url: "/",
    display: "standalone",
    background_color: "#071310",
    theme_color: "#071310",
    lang: "en-GB",
    categories: ["food", "restaurant", "shopping"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
