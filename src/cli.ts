#!/usr/bin/env node
/**
 * ai-landing-gen CLI
 * One YAML → One Perfect AI Landing Page
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { generateLanding } from "./generators/landing.js";

const VERSION = "0.1.0";

const HELP_TEXT = `
ai-landing-gen v${VERSION} — Generate AI application landing pages

Commands:
  init [name]              Initialize a new landing page project
  build [file]             Generate landing page from YAML
  validate [file]          Validate YAML configuration
  preview [dir]            Start local preview server

Options:
  -o, --output <dir>       Output directory (default: ./dist)
  -t, --template <name>    Template type (tool|game|social|info|card|saas)
  -h, --help               Show this help
  -v, --version            Show version

Examples:
  ai-landing-gen init my-app --template tool
  ai-landing-gen build my-app.page.yml --output ./dist
  ai-landing-gen validate my-app.page.yml
  ai-landing-gen preview ./dist
`;

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      output: { type: "string", short: "o" },
      template: { type: "string", short: "t" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
  });

  if (values.version) {
    console.log(`ai-landing-gen v${VERSION}`);
    process.exit(0);
  }

  if (values.help || positionals.length === 0) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const command = positionals[0];
  const fileArg = positionals[1];
  const outputDir = values.output || "./dist";

  switch (command) {
    case "init": {
      const name = fileArg || "my-ai-app";
      await cmdInit(name, values.template || "tool");
      break;
    }
    case "build": {
      if (!fileArg) {
        console.error("Error: Missing YAML file. Usage: ai-landing-gen build <file.yml>");
        process.exit(1);
      }
      generateLanding(fileArg, outputDir);
      break;
    }
    case "validate": {
      if (!fileArg) {
        console.error("Error: Missing YAML file. Usage: ai-landing-gen validate <file.yml>");
        process.exit(1);
      }
      await cmdValidate(fileArg);
      break;
    }
    case "preview": {
      const dir = fileArg || outputDir;
      await cmdPreview(dir);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}

async function cmdInit(name: string, template: string) {
  const yamlContent = `# ${name} Landing Page
name: ${name}
description: "Describe your AI application"
domain: "${name.toLowerCase().replace(/\s+/g, "-")}.hk"

template: ${template}
style:
  gradient: "135deg, #667eea, #764ba2"
  icon: 🤖

features:
  - icon: ⚡
    title: Feature One
    description: Describe your first feature
  - icon: 🎯
    title: Feature Two
    description: Describe your second feature

i18n:
  zh:
    headline: "${name}"
    subtitle: "用AI重新定义体验"
    cta: "立即体验"
  'zh-Hant':
    headline: "${name}"
    subtitle: "用AI重新定义体验"
    cta: "立即体验"
  en:
    headline: "${name}"
    subtitle: "Redefine experience with AI"
    cta: "Try Now"

seo:
  keywords: [AI, ${name}]
`;

  const fileName = `${name}.page.yml`;
  writeFileSync(fileName, yamlContent);
  console.log(`\n  ✅ Created ${fileName}`);
  console.log(`  Template: ${template}`);
  console.log(`  Next: ai-landing-gen build ${fileName}\n`);
}

async function cmdValidate(file: string) {
  const { parseYAML, validateConfig } = await import("./core/parser.js");
  const content = readFileSync(resolve(file), "utf-8");
  const config = parseYAML(content);
  const result = validateConfig(config);
  
  console.log(`\n  Validating: ${config.name}`);
  for (const check of result.checks) {
    const icon = check.status === "ok" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  console.log(`  Score: ${result.score}/100`);
  console.log(`  Valid: ${result.valid ? "Yes ✅" : "No ❌"}\n`);
  
  process.exit(result.valid ? 0 : 1);
}

async function cmdPreview(dir: string) {
  if (!existsSync(dir)) {
    console.error(`\n  Error: Directory not found: ${dir}\n`);
    process.exit(1);
  }
  
  console.log(`\n  Starting preview server for ${dir}`);
  console.log(`  URL: http://localhost:3000`);
  console.log(`  Press Ctrl+C to stop\n`);
  
  // Simple HTTP server using Node.js built-in
  const { createServer } = await import("node:http");
  const { readFile } = await import("node:fs/promises");
  
  const server = createServer(async (req, res) => {
    const url = req.url === "/" || !req.url ? "/index.html" : req.url;
    const filePath = join(dir, url);
    
    try {
      const content = await readFile(filePath);
      const ext = (filePath.split(".").pop() || "html") as string;
      const mimeTypes: Record<string, string> = {
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        json: "application/json",
        png: "image/png",
        jpg: "image/jpeg",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  
  server.listen(3000);
}

main().catch((err) => {
  console.error(`\n  Fatal error: ${err.message}\n`);
  process.exit(1);
});
