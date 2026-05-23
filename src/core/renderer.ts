import { PageConfig } from "./types.js";

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;
  
  // Simple variable replacement: {{ key }}
  result = result.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : "";
  });
  
  // Condition blocks: {% if key %}...{% endif %}
  result = result.replace(/\{%\s*if\s*(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (match, key, content) => {
    const value = data[key];
    return value ? content : "";
  });
  
  // Loop blocks: {% for item in items %}...{% endfor %}
  result = result.replace(/\{%\s*for\s*(\w+)\s*in\s*(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, (match, itemName, arrayName, content) => {
    const array = data[arrayName] as Array<Record<string, unknown>>;
    if (!Array.isArray(array)) return "";
    return array.map(item => {
      let itemContent = content;
      itemContent = itemContent.replace(new RegExp(`\\{\\{\\s*${itemName}\.(\w+)\\s*\\}\\}`, "g"), (_m: string, prop: string) => {
        return item[prop] !== undefined ? String(item[prop]) : "";
      });
      return itemContent;
    }).join("");
  });
  
  return result;
}

export function generateI18nScript(config: PageConfig): string {
  const langs = Object.keys(config.i18n);
  const defaultLang = langs.includes("zh") ? "zh" : langs[0];
  
  return `
const I18N = ${JSON.stringify(config.i18n, null, 2)};
const DEFAULT_LANG = "${defaultLang}";

function t(key) {
  const lang = document.documentElement.lang || DEFAULT_LANG;
  return I18N[lang]?.[key] || I18N[DEFAULT_LANG]?.[key] || key;
}

function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key && I18N[lang]?.[key]) {
      el.textContent = I18N[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && I18N[lang]?.[key]) {
      el.placeholder = I18N[lang][key];
    }
  });
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.remove("active");
  });
  const activeBtn = document.getElementById("btn-" + (lang === "zh-Hant" ? "zht" : lang));
  if (activeBtn) activeBtn.classList.add("active");
}
`;
}
