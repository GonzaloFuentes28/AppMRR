# Contributing to AppMRR

Thank you for your interest in contributing to AppMRR! 🎉

We welcome contributions from everyone. This document will guide you through the process.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Project Structure](#project-structure)

## 🤝 Code of Conduct

Be respectful, inclusive, and considerate. We're building this together!

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/appmrr.git
   cd appmrr
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/appmrr.git
   ```

## 💻 Development Setup

### Prerequisites

- Node.js 18 or higher
- PostgreSQL (for local development)
- Git

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Generate encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Add it to `.env` as `ENCRYPTION_KEY`.

3. **Set up local database**:
   ```bash
   ./setup-local.sh
   ```
   
   Or manually:
   ```bash
   createdb appmrr
   psql appmrr < schema.sql
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   
   Visit `http://localhost:4321`

## 🔨 Making Changes

### Create a Branch

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### Test Your Changes

```bash
# Run the development server
npm run dev

# Build to verify
npm run build

# Preview production build
npm run preview
```

## 📤 Submitting Changes

### Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add amazing new feature"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve encryption key validation issue"
git commit -m "docs: update installation instructions"
```

### Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### Open a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template:
   - **Title**: Clear description of changes
   - **Description**: What and why
   - **Screenshots**: If UI changes
   - **Testing**: How you tested
5. Submit!

### PR Guidelines

- Keep PRs focused on a single change
- Update documentation if needed
- Ensure the build passes
- Respond to review feedback promptly

## 📝 Code Style

### TypeScript

- Use explicit types
- Prefer `const` over `let`
- Use async/await over promises
- Add JSDoc comments for complex functions

```typescript
/**
 * Encrypts a RevenueCat API key using AES-256-GCM
 * @param apiKey - The API key to encrypt
 * @returns Encrypted key string
 */
export function encryptApiKey(apiKey: string): string {
  // Implementation
}
```

### Astro Components

- Add header comments explaining purpose
- Define Props interface
- Use scoped styles

```astro
---
/**
 * ComponentName
 * 
 * Brief description of what this component does
 * 
 * Props:
 * - prop1: description
 * 
 * Used in: parent-component.astro
 */
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<div>{title}</div>

<style>
  div {
    /* Styles */
  }
</style>
```

### CSS

- Use CSS variables for theming
- Include transitions for theme changes
- Mobile-first responsive design
- Keep specificity low

```css
.button {
  background: var(--primary);
  color: var(--primary-foreground);
  transition: background-color 0.3s ease;
}

.button:hover {
  background: var(--primary-hover);
}
```

## 🗂️ Project Structure

```
appmrr/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts
│   ├── lib/           # Utilities and business logic
│   ├── pages/         # Routes and API endpoints
│   ├── scripts/       # Client-side TypeScript
│   └── styles/        # Global styles
├── public/            # Static assets
├── schema.sql         # Database schema
└── ...config files
```

### Adding a New Component

1. Create file in `src/components/`
2. Add header comment
3. Define Props interface
4. Implement component
5. Add scoped styles
6. Import and use in pages

### Adding a New API Endpoint

1. Create file in `src/pages/api/`
2. Export GET/POST/etc. function
3. Add validation
4. Handle errors properly
5. Return JSON response

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

- **Clear title** describing the bug
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment** (OS, browser, Node version)

## 💡 Suggesting Features

Have an idea? Open an issue with:

- **Clear title** describing the feature
- **Problem** it solves
- **Proposed solution**
- **Alternatives** considered
- **Mockups** if applicable

## 📚 Resources

- [Astro Documentation](https://docs.astro.build)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org)
- [RevenueCat API](https://www.revenuecat.com/docs/api-v2)

## ❓ Questions?

Feel free to open an issue or reach out!

## 🙏 Thank You!

Your contributions make AppMRR better for everyone. Thank you for being part of the community! 🎉

---

Happy coding! 💻✨

