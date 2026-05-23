# ai-landing-gen

> One YAML → One Perfect AI Landing Page

Generate beautiful, SEO-ready, i18n-supported landing pages for AI applications.

## Who's using it?

**[AI Pair](https://aipair.ai)** uses this tool to build [52 vertical AI application domains](https://aipair.ai),
covering stock analysis, dating, games, programming, and more — forming a decentralized AI application matrix.

## Quick Start

```bash
# Install globally
npm install -g ai-landing-gen

# Create from template
ai-landing-gen init my-ai-app --template tool

# Build
ai-landing-gen build my-ai-app.page.yml --output ./dist

# Validate
ai-landing-gen validate my-ai-app.page.yml

# Preview
ai-landing-gen preview ./dist
```

## Templates

| Template | Best For | Example |
|----------|----------|---------|
| `tool` | AI tools (stock, coding, writing) | aistock.hk |
| `game` | AI games | aigame.hk |
| `social` | AI social apps | ailove.hk |
| `info` | AI directories | aicity.hk |
| `card` | AI business cards | aicard.hk |
| `saas` | AI SaaS products | — |

## YAML Format

```yaml
name: AI Stock
description: AI-powered stock analysis tool
domain: aistock.hk

template: tool
style:
  gradient: "135deg, #f093fb, #f5576c"
  icon: 📈

features:
  - icon: 📊
    title: Real-time Quotes
    description: View live stock prices

i18n:
  zh:
    headline: "AI 股票分析"
    subtitle: "免费实时行情 + 智能选股"
    cta: "立即体验"
  en:
    headline: "AI Stock Analysis"
    subtitle: "Free real-time quotes + AI stock picking"
    cta: "Try Now"
```

## Features

- 🎨 **6 Templates**: tool / game / social / info / card / saas
- 🌍 **i18n Ready**: zh / zh-Hant / en out of the box
- 📱 **Mobile First**: Responsive, AI Pair v1.5 spec compliant
- 🔍 **SEO Built-in**: OG Meta, Schema.org, canonical tags
- ✅ **Auto Validation**: Built-in compliance checker
- 🚀 **Zero JS Dependency**: Pure static HTML, 90+ Lighthouse score

## License

MIT © AI Pair
