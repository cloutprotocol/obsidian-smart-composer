# PRD: Mocking Service Providers for Web-Based Editor

## 1. Objective

This document outlines the strategy for adapting the **Smart Composer** plugin's service providers to function within the web-based editor proof-of-concept (POC). The primary goal is to resolve rendering-time errors caused by providers that depend on backend features unavailable in the browser, such as direct database access.

The immediate problem is the `useRAG must be used within a RAGProvider` error, which crashes the `ChatView` component. This is caused by the `RAGProvider`'s dependency on the database-backed `RAGEngine`. Similar issues are anticipated with other providers like `MCPProvider` that may have server-side dependencies.

## 2. Analysis of Integration Strategies

We have two primary options for resolving these dependency issues.

### Option 1: Mock Providers via Conditional Imports

One approach is to create separate, mock implementations of the providers within the `web-poc` directory. We can then use a build-time or run-time condition to substitute the real providers with our mock versions. For example, in `ChatView.tsx`, we could detect the environment and render a `MockRAGProvider` instead of the real one. This approach cleanly separates the mock logic from the core plugin code, treating the web-poc as a distinct build target. It keeps the plugin source code pristine, which is ideal for long-term maintenance.

### Option 2: Inline Environment Checks within Core Providers

Alternatively, we could modify the existing providers (`RAGProvider`, `MCPProvider`, etc.) to include environment-specific logic. We could introduce a flag, such as `plugin.app.isPoc`, to detect when the plugin is running in the web editor. Inside each provider, we would check for this flag and, if it's set, return a "no-op" or "mocked" version of its context. For example, `RAGProvider` could provide a `null` or disabled `RAGEngine` instance. This approach contains the logic for both environments within a single file, which can be simpler for developers to trace.

## 3. Recommendation

**Option 2: Inline Environment Checks within Core Providers** is the superior approach for our current needs.

While creating separate mock files (Option 1) is cleaner from a software architecture perspective, it introduces build complexity and would require us to replicate the provider and context structure in the `web-poc` project. This would violate our goal of "seamlessly porting" the plugin with minimal changes.

By embedding the logic directly into the existing providers, we keep the changes localized and easy to understand. We can use comments to clearly mark the code added for the POC. This strategy is more direct, requires fewer new files, and better aligns with our goal of making minimal, targeted adaptations to the plugin's source. It allows us to solve the immediate problem while keeping the core logic and mock logic side-by-side, which is beneficial for a rapidly evolving POC. This approach is the most efficient path to rendering the `ChatView` and validating our mock Obsidian API.

## 4. Next Steps

1.  **Introduce an `isPoc` flag:** Add an `isPoc: boolean` property to the mock `App` class in `web-poc/src/lib/obsidian-api.ts`.
2.  **Modify `RAGProvider`:**
    *   Update `src/contexts/rag-context.tsx`.
    *   Inside the provider, check for `plugin.app.isPoc`.
    *   If true, provide a `null` value for the `RAGContext` to gracefully disable RAG features in the web-poc.
    *   Ensure components consuming `useRAG` can handle a `null` context.
3.  **Modify `MCPProvider`:**
    *   Update `src/contexts/mcp-context.tsx`.
    *   Apply the same `isPoc` check.
    *   If true, provide a `null` value for the `MCPContext` to disable MCP-related features.
4.  **Update `ChatView.tsx`:**
    *   Wrap the `Chat` component with the `RAGProvider` and `MCPProvider` to resolve the context dependency.
    *   This ensures the component tree has the required providers, which will now gracefully disable themselves in the POC environment.