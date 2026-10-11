# Automated Task Logging Rule

After completing any implementation or task, append an entry to `docs/AI_LOG.md`.

## Guidelines
1. **Strict Append-Only**:
   - NEVER read, view, grep, analyze, or load `docs/AI_LOG.md` into context.
   - Treat `docs/AI_LOG.md` strictly as an append-only file.
   - Use direct append operations (e.g., shell append `cat >> docs/AI_LOG.md << 'EOF'`) without checking existing file contents.

2. **Log Entry Format**:
   Each log entry must follow this exact format:

[Time Stamp]
## User Request
[User Prompt]
## Agent Response
[Agent response]

-------

3. **Fields**:
   - `[Time Stamp]`: ISO 8601 timestamp (e.g., `[YYYY-MM-DDTHH:MM:SSZ]` or `[YYYY-MM-DDTHH:MM:SS±HH:MM]`).
   - `[User Prompt]`: The user's request.
   - `[Agent response]`: Summarized agent response describing what was completed, written in normal text format (always leave a blank line before `-------` so markdown renders it as regular paragraph text, not a Setext heading).
   - `-------`: Divider between entries.
