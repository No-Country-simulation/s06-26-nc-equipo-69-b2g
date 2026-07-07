# AI Chat Feature

Owns the AI assistant experience after authentication.

This feature is intentionally isolated from `map-page` so the assistant can later be opened from different private pages. Map-specific behavior must be injected through props, callbacks, or a public adapter instead of importing map-page internals directly.

Planned internal structure:

```txt
components/
data/
store/
```
