import { parse } from "yaml";
import { PageConfig, ValidationResult, CheckResult } from "./types.js";

export function parseYAML(content: string): PageConfig {
  const data = parse(content);
  
  if (!data.name) throw new Error("Missing required field: name");
  if (!data.template) throw new Error("Missing required field: template");
  if (!data.i18n) throw new Error("Missing required field: i18n");
  
  return data as PageConfig;
}

export function validateConfig(config: PageConfig): ValidationResult {
  const checks: CheckResult[] = [];
  let score = 0;

  // Check 1: Name
  if (config.name && config.name.length > 0) {
    checks.push({ name: "Name", status: "ok", message: config.name });
    score += 10;
  } else {
    checks.push({ name: "Name", status: "error", message: "Missing" });
  }

  // Check 2: Template
  const validTemplates = ["tool", "game", "social", "info", "card", "saas"];
  if (validTemplates.includes(config.template)) {
    checks.push({ name: "Template", status: "ok", message: config.template });
    score += 10;
  } else {
    checks.push({ name: "Template", status: "error", message: `Invalid: ${config.template}` });
  }

  // Check 3: i18n
  const langs = Object.keys(config.i18n);
  if (langs.includes("zh") && langs.includes("en")) {
    checks.push({ name: "i18n", status: "ok", message: `${langs.join(", ")}` });
    score += 20;
  } else {
    checks.push({ name: "i18n", status: "warn", message: "Missing zh or en" });
    score += 10;
  }

  // Check 4: Features
  if (config.features && config.features.length > 0) {
    checks.push({ name: "Features", status: "ok", message: `${config.features.length} features` });
    score += 15;
  } else {
    checks.push({ name: "Features", status: "warn", message: "No features defined" });
  }

  // Check 5: Gradient
  if (config.style?.gradient) {
    checks.push({ name: "Gradient", status: "ok", message: config.style.gradient });
    score += 10;
  } else {
    checks.push({ name: "Gradient", status: "warn", message: "Using default" });
  }

  // Check 6: SEO
  if (config.seo?.keywords && config.seo.keywords.length > 0) {
    checks.push({ name: "SEO", status: "ok", message: `${config.seo.keywords.length} keywords` });
    score += 15;
  } else {
    checks.push({ name: "SEO", status: "warn", message: "No keywords" });
  }

  // Check 7: Domain
  if (config.domain) {
    checks.push({ name: "Domain", status: "ok", message: config.domain });
    score += 10;
  } else {
    checks.push({ name: "Domain", status: "warn", message: "Not set" });
  }

  // Check 8: Description
  if (config.description) {
    checks.push({ name: "Description", status: "ok", message: `${config.description.length} chars` });
    score += 10;
  } else {
    checks.push({ name: "Description", status: "warn", message: "Missing" });
  }

  return {
    valid: !checks.some(c => c.status === "error"),
    score: Math.min(score, 100),
    checks
  };
}
