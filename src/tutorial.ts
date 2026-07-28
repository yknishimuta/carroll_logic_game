import { createTutorialViewModel } from "./tutorial/model";
import { renderTutorial } from "./tutorial/domRenderer";
import type { Locale } from "./domain/locale";

export function mountTutorial(container: HTMLElement): void {
  let locale: Locale = "ja";
  const render = () => {
    const model = createTutorialViewModel(locale);
    document.documentElement.lang = locale;
    document.title = model.documentTitle;
    renderTutorial(container, model, {
      onLocaleChange(nextLocale) {
        locale = nextLocale;
        render();
        container.querySelector<HTMLElement>(
          '[data-focus-key="tutorial-locale"]',
        )?.focus();
      },
    });
  };
  render();
}

const container = document.querySelector<HTMLElement>("#tutorial-app");
if (container !== null) mountTutorial(container);
