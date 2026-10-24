import "./fonts.css";
import "./index.css";
import { mountApp } from "./App";

/* The document is static HTML. This script mounts the interactive islands
   into it. With JavaScript disabled the page still reads end to end. */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountApp(), { once: true });
} else {
  mountApp();
}
