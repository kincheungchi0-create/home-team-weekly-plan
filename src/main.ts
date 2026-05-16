type Language = "en" | "zh";
type Focus = "all" | "menu" | "hazel" | "chores" | "rules";

const languageButtons = document.querySelectorAll<HTMLButtonElement>("[data-switch-lang]");
const views = document.querySelectorAll<HTMLElement>(".lang-view");
const savedLanguageKey = "homeTeamPlanLanguage";

function getLanguageButtonValue(button: HTMLButtonElement): Language {
  return button.dataset.switchLang === "zh" ? "zh" : "en";
}

function getFocusButtonValue(button: HTMLButtonElement): Focus {
  const value = button.dataset.focus;
  if (value === "menu" || value === "hazel" || value === "chores" || value === "rules") {
    return value;
  }
  return "all";
}

function setLanguage(language: Language) {
  document.documentElement.lang = language === "zh" ? "zh-Hant" : "en";

  views.forEach((view) => {
    view.hidden = view.dataset.lang !== language;
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", getLanguageButtonValue(button) === language);
    button.setAttribute("aria-pressed", String(getLanguageButtonValue(button) === language));
  });

  try {
    localStorage.setItem(savedLanguageKey, language);
  } catch {
    // Local storage can be unavailable in private or locked-down browser contexts.
  }
}

function setFocus(view: HTMLElement, focus: Focus, activeButton: HTMLButtonElement) {
  view.querySelectorAll<HTMLButtonElement>(".reader-tools button").forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  view.querySelectorAll<HTMLElement>("section[data-section]").forEach((section) => {
    section.classList.toggle(
      "is-filtered-out",
      focus !== "all" && section.dataset.section !== focus,
    );
  });
}

function createSearchPanel(view: HTMLElement) {
  const tools = view.querySelector<HTMLElement>(".reader-tools");
  if (!tools) return;

  const label = view.dataset.lang === "zh" ? "搜尋" : "Search";
  const placeholder =
    view.dataset.lang === "zh"
      ? "搜尋菜式、時間、家務或提醒"
      : "Search meals, times, chores or reminders";

  const panel = document.createElement("div");
  panel.className = "search-panel";
  panel.innerHTML = `
    <label>
      <span>${label}</span>
      <input class="search-input" type="search" placeholder="${placeholder}" autocomplete="off">
    </label>
  `;
  tools.insertAdjacentElement("afterend", panel);

  const input = panel.querySelector<HTMLInputElement>(".search-input");
  input?.addEventListener("input", () => applySearch(view, input.value));
}

function applySearch(view: HTMLElement, rawQuery: string) {
  const query = rawQuery.trim().toLocaleLowerCase();

  view.querySelectorAll<HTMLElement>("tbody tr, .rule-list li, .summary-item").forEach((item) => {
    const matches = query.length === 0 || item.innerText.toLocaleLowerCase().includes(query);
    item.classList.toggle("is-search-hidden", !matches);
  });

  view.querySelectorAll<HTMLElement>("section[data-section]").forEach((section) => {
    const searchableItems = section.querySelectorAll<HTMLElement>("tbody tr, .rule-list li");
    const hasVisibleItem = Array.from(searchableItems).some(
      (item) => !item.classList.contains("is-search-hidden"),
    );
    section.classList.toggle("is-search-empty", query.length > 0 && searchableItems.length > 0 && !hasVisibleItem);
  });
}

function enhanceTables() {
  document.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row) => {
      row.tabIndex = 0;
    });
  });
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(getLanguageButtonValue(button)));
});

document.querySelectorAll<HTMLButtonElement>(".reader-tools button").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.closest<HTMLElement>(".lang-view");
    if (!view) return;
    setFocus(view, getFocusButtonValue(button), button);
  });
});

let savedLanguage: Language = "en";
try {
  savedLanguage = localStorage.getItem(savedLanguageKey) === "zh" ? "zh" : "en";
} catch {
  savedLanguage = "en";
}

enhanceTables();
views.forEach(createSearchPanel);
setLanguage(savedLanguage);
