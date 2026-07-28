import { mountApp } from "./app";

const app = document.querySelector<HTMLElement>("#app");

if (app === null) {
  throw new Error('Application root element "#app" was not found.');
}

mountApp(app);
