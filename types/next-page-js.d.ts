// Allow imports of generated Next page JS files in .next/types validator
// This prevents TS errors like: Cannot find module '../../app/.../page.js'
declare module '*page.js' {
  import type { ComponentType } from 'react'
  // Pages export a React component. Use a generic prop shape to avoid implicit `any`.
  const Component: ComponentType<Record<string, unknown>>
  export default Component
}

// Layout and other generated runtime modules
declare module '*layout.js' {
  // Keep layout as `any` because Next's Layout typing expects a specific
  // LayoutProps shape which is hard to replicate here without importing
  // Next internal types. Using `any` avoids causing type incompatibility
  // during the build while still narrowing other generated module types.
  const Layout: any
  export default Layout
}

declare module '*route.js' {
  // Route modules can export runtime route handlers; keep as unknown to be safe.
  const Route: unknown
  export default Route
}

declare module '*server.js' {
  const ServerModule: unknown
  export default ServerModule
}

declare module '*client.js' {
  const ClientModule: unknown
  export default ClientModule
}

// Catch-all for other generated .js paths
declare module '*/*.js' {
  // Catch-all for other generated .js paths. Use `unknown` instead of `any`.
  const anyModule: unknown
  export default anyModule
}
