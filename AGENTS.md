# Agent Rules

## Automated Task Logging
After completing any implementation or task, append an entry to `docs/AI_LOG.md`.

### Guidelines
1. **Strict Append-Only**:
   - NEVER read, view, grep, analyze, or load `docs/AI_LOG.md` into context.
   - Treat `docs/AI_LOG.md` strictly as an append-only file.
   - Use direct append operations (e.g., shell append `cat >> docs/AI_LOG.md << 'EOF'`) without checking existing file contents.

### Entry Format
```markdown
[Time Stamp]
## User Request
[User Prompt]
## Agent Response
[Agent summarized response]
-------
```

### Fields
- `[Time Stamp]`: Tagged with ISO timestamp (e.g. `[YYYY-MM-DDTHH:MM:SS±HH:MM]`).
- `[User Prompt]`: The user's prompt/request.
- `[Agent summarized response]`: Summarized agent response.
- `-------`: Entry separator.
