# CHANGELOG Generation Guide

This document explains how semantic-release automatically generates the `CHANGELOG.md` file in Aurswift.

## 🎯 How CHANGELOG.md is Generated

### 1. Commit Analysis (Angular Convention)

The `.releaserc.json` configuration uses the **Angular preset**, which parses commits in this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**

```
feat(cashier): add receipt printing functionality

Implemented thermal printer integration with ESC/POS support.

Closes #123
```

### 2. Section Mapping (Type → Heading)

The changelog sections are generated based on commit **types**:

| **Commit Type**    | **CHANGELOG Section**           | **Included in Release?** | **Version Bump** |
| ------------------ | ------------------------------- | ------------------------ | ---------------- |
| `feat:`            | ### ✨ Features                 | ✅ Yes                   | Minor (x.Y.0)    |
| `fix:`             | ### 🐛 Bug Fixes                | ✅ Yes                   | Patch (x.y.Z)    |
| `perf:`            | ### ⚡ Performance Improvements | ✅ Yes                   | Patch (x.y.Z)    |
| `refactor:`        | ### ♻️ Code Refactoring         | ✅ Yes                   | Patch (x.y.Z)    |
| `revert:`          | ### ⏪ Reverts                  | ✅ Yes                   | Patch (x.y.Z)    |
| `docs:`            | (Not included)                  | ❌ No                    | None             |
| `style:`           | (Not included)                  | ❌ No                    | None             |
| `test:`            | (Not included)                  | ❌ No                    | None             |
| `ci:`              | (Not included)                  | ❌ No                    | None             |
| `chore:`           | (Not included)                  | ❌ No                    | None             |
| `build:`           | ### 🏗️ Build System             | ✅ Yes                   | Patch (x.y.Z)    |
| `BREAKING CHANGE:` | ### BREAKING CHANGES            | ✅ Yes                   | Major (X.0.0)    |

**Note**: Section headers include emojis for better visual appeal in client update dialogs. The emojis are added via the custom `transform.type` function in `.releaserc.js`.

### 3. Information Extraction

For each commit, semantic-release extracts three key components:

```
fix(workflows): ensure .npmrc configuration for native modules
^    ^          ^
|    |          └─── SUBJECT (becomes bullet point description)
|    └────────────── SCOPE (shows in parentheses, optional)
└─────────────────── TYPE (determines section)
```

**Rendered as:**

```markdown
### 🐛 Bug Fixes

- **workflows:** ensure .npmrc configuration for native modules ([a25fd02](https://github.com/Sam231221/Aurswift/commit/a25fd02...))
```

**Note**: The emoji prefix (🐛) is automatically added by the custom template configuration.

### 4. Special Handling

#### Breaking Changes Detection

A breaking change is triggered when:

1. Commit footer contains `BREAKING CHANGE:` or `BREAKING-CHANGE:`
2. OR type ends with `!` (e.g., `feat!:`, `refactor!:`)

**Example:**

```
feat(auth)!: remove legacy authentication system

BREAKING CHANGE: The old auth API has been removed. Use the new authApi module instead.
```

**Rendered as:**

```markdown
### BREAKING CHANGES

- **auth:** remove legacy authentication system

The old auth API has been removed. Use the new authApi module instead.
```

#### Automatic Links Generation

Semantic-release automatically generates:

- **Commit SHA links** → Clickable link to GitHub commit
- **Issue references** (e.g., `fixes #123`, `closes #456`) → Linked to GitHub issues
- **Compare links** → Between version tags (e.g., `v3.1.0...v3.2.0`)
- **Pull request links** → If PR number in commit message

### 5. Configuration in `.releaserc.js`

The configuration uses a JavaScript file (`.releaserc.js`) instead of JSON to enable custom template functions for better release notes formatting.

```javascript
module.exports = {
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular", // ← Parses commit structure
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          // ... more rules
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular", // ← Generates markdown sections
        writerOpts: {
          commitsSort: ["subject", "scope"], // ← Sorts commits alphabetically
          transform: {
            // Custom transform function to add emojis to section headers
            // This improves UX in client update dialogs
            type: (type) => {
              const typeMap = {
                feat: "✨ Features",
                fix: "🐛 Bug Fixes",
                perf: "⚡ Performance Improvements",
                refactor: "♻️ Code Refactoring",
                // ... more mappings
              };
              return typeMap[type] || type;
            },
          },
        },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md", // ← Output file
        changelogTitle: "# Changelog\n\nAll notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.",
      },
    ],
  ],
};
```

**Note**: The custom `transform.type` function adds emoji-prefixed section headers (e.g., "✨ Features", "🐛 Bug Fixes") to make release notes more visually appealing and easier to read in client update dialogs.

## 📋 CHANGELOG Structure Breakdown

```markdown
# Changelog ← Title from changelogTitle in .releaserc.json

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.0.0 (2025-10-23) ← Version + Date (auto-generated)

### Bug Fixes ← Section based on fix: commits

- **tests:** correct btoa function exposure and improve Electron test visibility ([f0babfd](link))
  ↑ ↑ ↑
  scope subject from commit message commit link

- disable AutoUpdater during tests to prevent GitHub Actions failures ([1441612](link))
  ↑ Commit without scope (scope is optional)

- **workflows:** ensure .npmrc configuration for native modules ([a25fd02](link))

### Code Refactoring ← Section for refactor: commits

- **ci:** integrate semantic-release into unified workflow ([13c13a3](link))

### ✨ Features ← Section for feat: commits (emoji added by template)

- :fire: Added weight based products implementation. ([8ddf299](link))
  ↑ Emoji preserved from commit message

- **app:** :fire: Fixed DraweR Component,Product Management Functionality ([df0c0cf](link))
  ↑ ↑
  scope emoji + description

- **test:** trigger release with correct permissions ([8db5026](link))

### BREAKING CHANGES ← Special section for breaking changes

- **ci:** workflow structure changed, old release.yml disabled
  ↑ Extracted from commit footer with "BREAKING CHANGE:" or type with !
```

## 🔍 Real Example from Aurswift

Looking at the generated CHANGELOG.md, semantic-release found these commits and organized them:

- **11 `fix:` commits** → Generated "Bug Fixes" section
- **11 `feat:` commits** → Generated "Features" section
- **1 `refactor:` commit** → Generated "Code Refactoring" section
- **1 commit with `BREAKING CHANGE:` footer** → Generated "BREAKING CHANGES" section

## 📝 Commit Message Best Practices

### ✅ Good Examples

```bash
# Feature with scope
feat(sales): add barcode scanner support

# Bug fix with scope
fix(printer): resolve thermal printer connection timeout

# Performance improvement
perf(database): optimize product search query

# Breaking change with exclamation
feat(api)!: migrate to new authentication system

BREAKING CHANGE: Old login endpoints removed. Use /api/v2/auth instead.

# Multiple scopes (choose most relevant)
fix(cashier): prevent negative quantities in cart

# With issue reference
fix(inventory): correct stock calculation logic

Fixes #234
```

### ❌ Bad Examples

```bash
# Missing type
Added new feature

# Missing colon
feat add printer support

# Vague description
fix: bug fix

# Wrong type for release
docs: update readme  # Won't trigger release

# Emoji before type (breaks parser)
🔥 feat: add feature  # Should be: feat: 🔥 add feature
```

## 🎨 Emoji Usage

Emojis are **preserved** in the changelog but should come **after** the type:

```bash
# ✅ Correct
feat: ✨ add sparkly new dashboard
fix: 🐛 resolve login timeout issue

# ❌ Wrong (breaks parsing)
✨ feat: add sparkly new dashboard
🐛 fix: resolve login timeout issue
```

## 🔄 Workflow Process

1. **Developer makes commit** with conventional format

   ```bash
   git commit -m "feat(printer): add USB thermal printer support"
   ```

2. **Push to main branch**

   ```bash
   git push origin main
   ```

3. **GitHub Actions runs semantic-release**
   - Analyzes all commits since last release
   - Determines version bump (major/minor/patch)
   - Generates CHANGELOG.md content
   - Updates package.json version
   - Creates git tag
   - Commits changes with `[skip ci]`
   - Creates GitHub Release

4. **Pull changes locally**
   ```bash
   git pull origin main
   ```

## 🎯 Key Takeaways

1. **Commit types control sections** → `feat:`, `fix:`, `refactor:` create different sections
2. **Scopes become bold labels** → `(workflows)`, `(test)`, `(ci)` → `**workflows:**`
3. **Emojis are preserved** → `:fire:`, `:sparkles:` appear in changelog
4. **Links auto-generated** → Commit SHAs and compare URLs become clickable
5. **Sorting is alphabetical** → Within each section, commits sorted by subject/scope
6. **Breaking changes** → Trigger special section and major version bump
7. **Non-release commits ignored** → `docs:`, `chore:`, `ci:` don't appear in changelog

## 📚 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated:** October 23, 2025  
**Project:** Aurswift POS System  
**Maintained by:** Development Team
