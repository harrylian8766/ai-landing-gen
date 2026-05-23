/**
 * Security Scanner for AI Landing Page Generator
 * Detects API keys, tokens, secrets, and other sensitive information
 */

export interface SecurityVulnerability {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  line: number;
  preview: string;
  pattern: string;
}

export interface SecurityScanResult {
  clean: boolean;
  vulnerabilities: SecurityVulnerability[];
  scanTime: string;
  scannedBytes: number;
}

/**
 * Patterns for detecting sensitive information in HTML/JavaScript
 */
const SECRET_PATTERNS = [
  // OpenAI / Anthropic API Keys
  { pattern: /sk-[a-zA-Z0-9]{48,}/g, type: "OpenAI/Anthropic API Key", severity: "critical" as const },
  // GitHub Personal Access Token
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, type: "GitHub Token", severity: "critical" as const },
  { pattern: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g, type: "GitHub Fine-Grained Token", severity: "critical" as const },
  // AWS Access Key ID
  { pattern: /AKIA[0-9A-Z]{16}/g, type: "AWS Access Key ID", severity: "critical" as const },
  // Alibaba Cloud
  { pattern: /LTAI[0-9A-Za-z]{12,20}/g, type: "Alibaba Cloud Access Key", severity: "critical" as const },
  // Tencent Cloud
  { pattern: /AKID[0-9A-Za-z]{32,40}/g, type: "Tencent Cloud Secret ID", severity: "critical" as const },
  // Google API Key
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, type: "Google API Key", severity: "high" as const },
  // Slack Token
  { pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}(-[a-zA-Z0-9]{24})?/g, type: "Slack Token", severity: "critical" as const },
  // Generic Bearer Token
  { pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/gi, type: "Bearer Token", severity: "high" as const },
  // Generic API Key in code
  { pattern: /api[_-]?key['\"]?\s*[:=]\s*['\"][a-zA-Z0-9_-]{16,}['\"]/gi, type: "API Key in Code", severity: "high" as const },
  // Generic Secret
  { pattern: /secret['\"]?\s*[:=]\s*['\"][a-zA-Z0-9_-]{16,}['\"]/gi, type: "Secret in Code", severity: "high" as const },
  // Private Key (RSA/PEM)
  { pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, type: "Private Key", severity: "critical" as const },
  // Password in code
  { pattern: /password['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]/gi, type: "Password in Code", severity: "high" as const },
  // DeepSeek API Key
  { pattern: /sk-[0-9a-f]{32,48}/gi, type: "DeepSeek API Key", severity: "critical" as const },
  // Zhipu AI / GLM Key
  { pattern: /[0-9a-f]{32}\.[0-9a-f]{16}/gi, type: "Zhipu/GLM API Key", severity: "critical" as const },
  // Generic Token
  { pattern: /token['\"]?\s*[:=]\s*['\"][a-zA-Z0-9_-]{20,}['\"]/gi, type: "Token in Code", severity: "medium" as const },
  // URL with embedded credentials (must have : before @)
  { pattern: /https?:\/\/[^\s\"]+:[^\s\"]+@[a-zA-Z0-9.-]+/g, type: "URL with Credentials", severity: "critical" as const },
];

/**
 * Whitelist: patterns that look like secrets but are safe
 */
const WHITELIST_PATTERNS = [
  // CSS color values
  /^#[0-9a-fA-F]{6}$/,
  /^#[0-9a-fA-F]{3}$/,
  // Common CSS values
  /^(rgba?|hsla?)\(/,
  // Font awesome / emoji unicode
  /^\\[0-9a-fA-F]{4,6}$/,
  // Common words that might trigger false positives
  /^(password|secret|token|key|api)$/i,
];

export class SecurityScanner {
  /**
   * Scan HTML content for potential secrets
   */
  scan(html: string): SecurityScanResult {
    const vulnerabilities: SecurityVulnerability[] = [];
    const lines = html.split("\n");
    
    for (const { pattern, type, severity } of SECRET_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const matchedText = match[0];
        
        // Check whitelist
        if (this.isWhitelisted(matchedText)) {
          continue;
        }
        
        // Find line number
        const lineIndex = this.getLineNumber(html, match.index);
        const line = lines[lineIndex] || "";
        
        // Create preview (mask the actual secret)
        const preview = this.maskSecret(matchedText, line);
        
        vulnerabilities.push({
          type,
          severity,
          line: lineIndex + 1,
          preview,
          pattern: matchedText.slice(0, 20) + "...",
        });
      }
    }
    
    return {
      clean: vulnerabilities.length === 0,
      vulnerabilities,
      scanTime: new Date().toISOString(),
      scannedBytes: html.length,
    };
  }
  
  /**
   * Check if a matched string is whitelisted (safe)
   */
  private isWhitelisted(text: string): boolean {
    // Check against whitelist patterns
    for (const pattern of WHITELIST_PATTERNS) {
      if (pattern.test(text.trim())) {
        return true;
      }
    }
    
    // Check common false positives
    const falsePositives = [
      "rgba", "hsla", "linear-gradient", "font-family",
      "display", "position", "background", "border",
      "class=", "id=", "style=",
    ];
    
    if (falsePositives.some(fp => text.toLowerCase().includes(fp))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get line number from character index
   */
  private getLineNumber(text: string, index: number): number {
    let lineCount = 0;
    for (let i = 0; i < index; i++) {
      if (text[i] === "\n") {
        lineCount++;
      }
    }
    return lineCount;
  }
  
  /**
   * Mask secret in preview for safe display
   */
  private maskSecret(secret: string, line: string): string {
    // Find the secret position in the line
    const secretIndex = line.indexOf(secret);
    if (secretIndex === -1) {
      // Secret spans multiple lines, just mask it directly
      return this.maskString(secret);
    }
    
    const prefix = line.slice(0, secretIndex);
    const suffix = line.slice(secretIndex + secret.length);
    
    // Show 10 chars before and after for context
    const contextPrefix = prefix.slice(-10);
    const contextSuffix = suffix.slice(0, 10);
    
    return `${contextPrefix}[REDACTED - ${secret.length} chars]${contextSuffix}`;
  }
  
  /**
   * Mask a string, showing only first/last 2 chars
   */
  private maskString(str: string): string {
    if (str.length <= 8) {
      return "***";
    }
    return str.slice(0, 2) + "***" + str.slice(-2);
  }
  
  /**
   * Print security report to console
   */
  printReport(result: SecurityScanResult): void {
    console.log("\n🔒 Security Scan Report\n");
    console.log(`  Scanned: ${result.scannedBytes} bytes`);
    console.log(`  Time: ${result.scanTime}`);
    
    if (result.clean) {
      console.log("  Status: ✅ CLEAN - No secrets detected\n");
      return;
    }
    
    console.log(`  Status: ❌ FOUND ${result.vulnerabilities.length} potential secrets\n`);
    
    // Group by severity
    const bySeverity: Record<string, SecurityVulnerability[]> = {};
    for (const v of result.vulnerabilities) {
      if (!bySeverity[v.severity]) {
        bySeverity[v.severity] = [];
      }
      bySeverity[v.severity].push(v);
    }
    
    const severities: Array<"critical" | "high" | "medium" | "low"> = ["critical", "high", "medium", "low"];
    for (const severity of severities) {
      const items = bySeverity[severity];
      if (!items || items.length === 0) continue;
      
      const icon = severity === "critical" ? "🔴" : severity === "high" ? "🟠" : severity === "medium" ? "🟡" : "🟢";
      console.log(`  ${icon} ${severity.toUpperCase()} (${items.length})`);
      
      for (const v of items) {
        console.log(`     Line ${v.line}: ${v.type}`);
        console.log(`     ${v.preview}`);
      }
      console.log();
    }
    
    console.log("  ⚠️  ACTION REQUIRED: Remove all secrets before deploying!\n");
  }
}
