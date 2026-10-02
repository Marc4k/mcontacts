import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Checkmate Club",
    short_name: "Checkmate",
    description: "Elo rankings and a chess clock for over-the-board games with friends.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f3f5",
    theme_color: "#f3f3f5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
