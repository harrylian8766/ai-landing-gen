import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseYAML, validateConfig } from "../core/parser.js";
import { renderTemplate, generateI18nScript } from "../core/renderer.js";
import { loadTemplate } from "../core/types.js";

export function generateLanding(yamlPath: string, outputDir: string): void {
  const content = readFileSync(resolve(yamlPath), "utf-8");
  const config = parseYAML(content);
  
  // Validate
  const validation = validateConfig(config);
  console.log(`\n  Validating: ${config.name}`);
  for (const check of validation.checks) {
    const icon = check.status === "ok" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  console.log(`  Score: ${validation.score}/100\n`);
  
  if (!validation.valid) {
    console.error("  ❌ Validation failed. Fix errors before building.\n");
    process.exit(1);
  }
  
  // Create output directory
  mkdirSync(outputDir, { recursive: true });
  
  // Load templates
  const baseTemplate = loadTemplate("_base/index.html");
  const footerTemplate = loadTemplate("_base/footer.html");
  
  // Generate i18n script
  const i18nScript = generateI18nScript(config);
  
  // Build HTML
  const gradient = config.style?.gradient || "135deg, #667eea, #764ba2";
  const icon = config.style?.icon || "🤖";
  const features = config.features || [];
  const defaultLang = Object.keys(config.i18n).includes("zh") ? "zh" : Object.keys(config.i18n)[0];
  
  // Render features section
  const featuresHtml = features.map((f, i) => `
    <div class="feature">
      <div class="feature-icon">${f.icon}</div>
      <h3 data-i18n="feature_${i}_title">${f.title}</h3>
      <p data-i18n="feature_${i}_desc">${f.description}</p>
    </div>
  `).join("\n");
  
  // Render i18n keys for features
  const featureI18n: Record<string, Record<string, string>> = {};
  for (const lang of Object.keys(config.i18n)) {
    featureI18n[lang] = {};
    features.forEach((f, i) => {
      featureI18n[lang][`feature_${i}_title`] = f.title;
      featureI18n[lang][`feature_${i}_desc`] = f.description;
    });
  }
  
  // Merge feature i18n into main i18n
  const mergedI18n = { ...config.i18n };
  for (const lang of Object.keys(mergedI18n)) {
    mergedI18n[lang] = { ...mergedI18n[lang], ...featureI18n[lang] };
  }
  
  let html = baseTemplate
    .replace(/\{\{NAME\}\}/g, config.name)
    .replace(/\{\{DESCRIPTION\}\}/g, config.description || config.name)
    .replace(/\{\{DOMAIN\}\}/g, config.domain || "")
    .replace(/\{\{GRADIENT\}\}/g, gradient)
    .replace(/\{\{ICON\}\}/g, icon)
    .replace(/\{\{DEFAULT_LANG\}\}/g, defaultLang)
    .replace(/\{\{HEADLINE\}\}/g, config.i18n[defaultLang]?.headline || config.name)
    .replace(/\{\{SUBTITLE\}\}/g, config.i18n[defaultLang]?.subtitle || "")
    .replace(/\{\{CTA\}\}/g, config.i18n[defaultLang]?.cta || "Get Started")
    .replace(/\{\{FEATURES\}\}/g, featuresHtml)
    .replace(/\{\{I18N_SCRIPT\}\}/g, i18nScript.replace("const I18N =", `const I18N = ${JSON.stringify(mergedI18n, null, 2)};\nconst DEFAULT_LANG = "${defaultLang}";\nfunction t(key) {`))
    .replace(/\{\{FOOTER\}\}/g, footerTemplate);
  
  // Write files
  writeFileSync(join(outputDir, "index.html"), html);
  writeFileSync(join(outputDir, "_validate.json"), JSON.stringify(validation, null, 2));
  
  console.log(`  ✅ Generated landing page in ${outputDir}/`);
  console.log(`     • index.html — Landing page (${Math.round(html.length / 1024)}KB)`);
  console.log(`     • _validate.json — Compliance report (${validation.score}/100)`);
  console.log();
}
