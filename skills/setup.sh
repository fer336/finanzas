#!/bin/bash

# Setup script for AI Skills
# Inspired by Prowler Cloud AI Skills structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setting up AI Skills for Sistema de Gastos..."

# Create skills directory if it doesn't exist
mkdir -p "$SCRIPT_DIR"

# Create README for skills
cat > "$SCRIPT_DIR/README.md" << 'EOF'
# AI Skills - Sistema de Gastos

Este directorio contiene **Skills** (habilidades) estructuradas que guían a los asistentes de IA para escribir código consistente con los estándares del proyecto.

## 📋 Skills Disponibles

### Skills Genéricos
- `react-19.md` - React 19 patterns, compiler optimization
- `tailwind-css.md` - Tailwind CSS, utility-first
- `fastapi.md` - FastAPI async patterns
- `sqlalchemy.md` - SQLAlchemy ORM
- `pydantic.md` - Data validation
- `postgresql.md` - PostgreSQL patterns

### Skills Específicos del Proyecto
- `frontend-react.md` - Frontend Agent ruleset
- `backend-fastapi.md` - Backend Agent ruleset
- `api-design.md` - API Agent ruleset
- `database-postgresql.md` - Database Agent ruleset
- `ai-agent-tools.md` - AI Agent ruleset
- `react-modern-ui.md` - Modern UI patterns
- `modal-system.md` - Modal system patterns
- `repository-pattern.md` - Repository pattern

## 🎯 Uso

Los asistentes de IA deben:
1. Identificar qué agente es responsable
2. Leer el skill correspondiente
3. Seguir los patrones definidos
4. No salirse del contexto del agente

## 📁 Estructura

Cada skill es un archivo Markdown con:
- **Patrones de código** específicos
- **Reglas CRÍTICAS** no negociables
- **Ejemplos** de uso correcto/incorrecto
- **Anti-patrones** a evitar

## 🔗 Referencias

- [AGENTS.md](../AGENTS.md) - Master ruleset
- [Prowler AI Skills](https://github.com/prowler-cloud/prowler/tree/master/skills)
EOF

echo "✅ Created skills/README.md"

# Create symlinks for AI tools (agentskills.io standard)
create_symlink() {
    local target_dir="$1"
    local parent_dir="$(dirname "$target_dir")"
    
    # Create parent directory if it doesn't exist
    mkdir -p "$parent_dir"
    
    if [ ! -e "$target_dir" ]; then
        ln -s "$SCRIPT_DIR" "$target_dir"
        echo "✅ Created symlink: $target_dir -> skills/"
    else
        echo "⚠️  $target_dir already exists, skipping"
    fi
}

cd "$PROJECT_ROOT"

# Claude Desktop / Code
create_symlink ".claude/skills"

# GitHub Copilot
create_symlink ".github/skills"

# OpenCode
create_symlink ".opencode/skills"

# Codex (OpenAI)
create_symlink ".codex/skills"

# Gemini CLI
create_symlink ".gemini/skills"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your AI coding assistant"
echo "   2. Skills will be automatically loaded"
echo "   3. Read AGENTS.md for usage guide"
echo ""
echo "🔗 Skills directory: $SCRIPT_DIR"
echo "🔗 Symlinks created in: .claude/, .github/, .opencode/, .codex/, .gemini/"

