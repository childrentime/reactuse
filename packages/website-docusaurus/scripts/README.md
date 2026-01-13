# Documentation Scripts

This directory contains scripts for maintaining and generating documentation files.

## Scripts

### generateLlmTxt.ts

Automatically generates an `llm.txt` file that provides a comprehensive, LLM-friendly overview of all ReactUse hooks.

**Purpose:**
- Creates a structured documentation file optimized for Large Language Models (LLMs)
- Includes all hooks organized by category with descriptions and usage examples
- Helps AI assistants better understand and recommend ReactUse hooks

**What it generates:**
- Overview and key features
- Installation instructions
- Quick start guide
- Complete hook reference with 112+ hooks
- Links to detailed documentation
- Community and support information

**Output location:**
- `static/llm.txt` - This file is automatically copied to the root of the built site

**When it runs:**
- Automatically on `pnpm dev` (development server)
- Automatically on `pnpm build` (production build)
- Manually with `pnpm generate-llm`

**File size:** ~28 KB

**Access URL:**
Once deployed, the file will be accessible at: `https://reactuse.com/llm.txt`

### index.ts

Copies the changelog from the core package to the documentation with proper frontmatter.

## Usage

### Generate llm.txt manually

```bash
pnpm generate-llm
```

### Run in development (auto-generates llm.txt)

```bash
pnpm dev
```

### Build for production (auto-generates llm.txt)

```bash
pnpm build
```

## Adding New Hooks

When you add new hooks to the documentation:

1. Create the `.mdx` file in the appropriate category folder
2. Include proper frontmatter with `title`, `sidebar_label`, and `description`
3. The `llm.txt` file will automatically include the new hook on next build

## File Structure

```
scripts/
├── README.md              # This file
├── index.ts              # Changelog copier
└── generateLlmTxt.ts     # LLM.txt generator
```

## LLM.txt Format

The generated `llm.txt` follows these conventions:

1. **Markdown format** - Easy for both humans and LLMs to parse
2. **Structured sections** - Clear hierarchy with headers
3. **Direct links** - Every hook links to its full documentation
4. **Code examples** - Usage examples for quick reference
5. **Metadata footer** - Generation timestamp and statistics

## Why llm.txt?

The `llm.txt` file makes it easier for AI assistants and LLMs to:
- Quickly understand the full scope of ReactUse
- Recommend appropriate hooks for specific use cases
- Provide accurate code examples
- Direct users to detailed documentation

This is inspired by the growing practice of providing LLM-optimized documentation formats for better AI integration.

