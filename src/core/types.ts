import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface PageConfig {
  name: string;
  description?: string;
  domain?: string;
  template: "tool" | "game" | "social" | "info" | "card" | "saas";
  style?: {
    gradient?: string;
    icon?: string;
  };
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  i18n: Record<string, I18nConfig>;
  seo?: {
    keywords?: string[];
    ogImage?: string;
  };
}

export interface I18nConfig {
  headline: string;
  subtitle: string;
  cta: string;
  [key: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  checks: CheckResult[];
}

export interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

export interface TemplateData {
  page: PageConfig;
  base: string;
  footer: string;
  i18nScript: string;
}

export function loadTemplate(name: string): string {
  const path = join(import.meta.dirname, "../../templates", name);
  return readFileSync(path, "utf-8");
}
