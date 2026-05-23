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
  scan [file|dir]          Security scan for API keys and secrets
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
    case "scan": {
      if (!fileArg) {
        console.error("Error: Missing file or directory. Usage: ai-landing-gen scan <file.html|dir>");
        process.exit(1);
      }
      await cmdScan(fileArg);
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

async function cmdScan(target: string) {
  const { SecurityScanner } = await import("./core/security-scanner.js");
  const { statSync, readFileSync, readdirSync } = await import("node:fs");
  const { resolve, join, extname } = await import("node:path");
  
  const targetPath = resolve(target);
  const stats = statSync(targetPath);
  
  const scanner = new SecurityScanner();
  let totalVulns = 0;
  let totalFiles = 0;
  
  if (stats.isFile()) {
    // Scan single file
    const content = readFileSync(targetPath, "utf-8");
    const result = scanner.scan(content);
    scanner.printReport(result);
    totalVulns = result.vulnerabilities.length;
    totalFiles = 1;
  } else if (stats.isDirectory()) {
    // Scan directory recursively
    console.log(`\n🔒 Scanning directory: ${targetPath}\n`);
    
    const scanFile = (filePath: string) => {
      const content = readFileSync(filePath, "utf-8");
      const result = scanner.scan(content);
      totalFiles++;
      
      if (!result.clean) {
        totalVulns += result.vulnerabilities.length;
        console.log(`  ⚠️  ${filePath.replace(targetPath + "/", "")}`);
        for (const v of result.vulnerabilities.slice(0, 3)) {
          console.log(`     Line ${v.line}: ${v.type}`);
        }
        if (result.vulnerabilities.length > 3) {
          console.log(`     ... and ${result.vulnerabilities.length - 3} more`);
        }
      } else {
        console.log(`  ✅ ${filePath.replace(targetPath + "/", "")}`);
      }
    };
    
    const scanDir = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (extname(entry.name) === ".html" || extname(entry.name) === ".js")) {
          scanFile(fullPath);
        }
      }
    };
    
    scanDir(targetPath);
    
    console.log(`\n  ──────────────────────────────`);
    console.log(`  Scanned: ${totalFiles} files`);
    console.log(`  Issues: ${totalVulns} potential secrets`);
    if (totalVulns === 0) {
      console.log(`  Status: ✅ ALL CLEAN\n`);
    } else {
      console.log(`  Status: ❌ SECRETS FOUND\n`);
    }
  }
  
  process.exit(totalVulns > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`\n  Fatal error: ${err.message}\n`);
  process.exit(1);
});
