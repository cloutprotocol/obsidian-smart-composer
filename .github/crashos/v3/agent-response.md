# PRD – Consistent "Apply" Experience for Smart-Composer

## Problem Statement
The first AI response in chat correctly shows an **Apply** button that lets the user merge changes into the current note.  Subsequent AI responses often return raw code blocks without the button, forcing the user to copy-paste manually.  This inconsistency slows workflow and causes user confusion.

### Root-Cause Analysis (summary)
1. **Missing `<smtcmp_block>` wrappers** – The frontend only renders an *Apply* button when the assistant wraps edited content in a `<smtcmp_block>` element.  Later LLM responses frequently omit this wrapper and fall back to plain <code>```markdown</code> fences.
2. **Prompt drift** – The system prompt tells the model to use `<smtcmp_block>`, but repetition, long chats, or model truncation can dilute this instruction.
3. **Parser rigidity** – `parseTagContents` ignores standard code fences; it exclusively recognises `<smtcmp_block>`.  Valid updates formatted with back-ticks therefore bypass the Apply pipeline.
4. **Filename heuristics** – Even with `<smtcmp_block>`, missing `filename="…"` prevents the diff viewer from knowing what to patch.

## Goals
* 100 % of assistant messages that contain file edits should surface an **Apply** button.
* Accept **both** `<smtcmp_block>` tags and conventional triple-backtick fences that start with `path/to/file`.
* Maintain backward compatibility with existing prompts, tests, and mocks.

## Non-Goals
* Changes to the underlying LLM provider selection.
* Major UI redesign.

## Proposed Solution
| Area | Change |
|------|--------|
| **Frontend Parsing** | Extend `parseTagContents` so that, when no `<smtcmp_block>` is found, it falls back to detecting a ```<filename> first-line pattern and emits a synthetic `block` identical to the current structure. |
| **Prompt Reinforcement** | Update `PromptGenerator` and `apply.ts` system prompts with _bold examples_ emphasising the required wrapper.  Add a one-sentence reminder every 10 turns. |
| **Unit Tests** | Add tests proving that both wrapper styles render an Apply button and that the diff flow works for multi-block messages. |
| **Documentation** | Document the two supported syntaxes in `/docs/prompting.md`. |

### Acceptance Criteria
1. Reproduction script (two sequential "add haiku" commands) shows Apply button twice.
2. `yarn test` covers new parsing branches.
3. No new linter or type errors.

---

## Prompt Reference Audit
Below are the key prompt constants currently shaping agent behaviour.  All of them reference `<smtcmp_block>`:

| File | Variable | Lines |
|------|----------|-------|
| `src/utils/chat/promptGenerator.ts` | `systemPrompt` / `systemPromptRAG` | 400-480 |
| `src/utils/chat/apply.ts` | `systemPrompt` | 15-35 |
| `src/settings/schema/setting.types.ts` | user-customisable `systemPrompt` | n/a |

> **Action** – after fe changes land, append fallback syntax examples to each prompt block.

---

## Open Questions
1. Should we allow `<!-- smtcmp_block -->` HTML comments as a third format?
2. Do we need to migrate existing chat history to inject wrappers for older messages?

---

*Author*: PR-o3-agent
*Date*: <!-- YYYY-MM-DD -->
