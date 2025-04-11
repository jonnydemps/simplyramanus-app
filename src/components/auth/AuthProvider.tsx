[20:58:12.460] Cloning github.com/jonnydemps/simplyramanus-app (Branch: main, Commit: 7bee183)
[20:58:13.339] Cloning completed: 878.000ms
[20:58:14.988] Restored build cache from previous deployment (3HpTo9q2LXkR9tfft6xUkUUefpjf)
[20:58:15.091] Running build in Washington, D.C., USA (East) – iad1
[20:58:15.460] Running "vercel build"
[20:58:15.852] Vercel CLI 41.5.0
[20:58:16.186] Installing dependencies...
[20:58:17.910] 
[20:58:17.911] up to date in 1s
[20:58:17.911] 
[20:58:17.912] 146 packages are looking for funding
[20:58:17.912]   run `npm fund` for details
[20:58:17.944] Detected Next.js version: 14.2.28
[20:58:17.947] Running "npm run build"
[20:58:18.062] 
[20:58:18.063] > simplyra@0.1.0 build
[20:58:18.063] > next build
[20:58:18.063] 
[20:58:19.096]   ▲ Next.js 14.2.28
[20:58:19.097] 
[20:58:19.168]    Creating an optimized production build ...
[20:58:26.163]  ✓ Compiled successfully
[20:58:26.164]    Linting and checking validity of types ...
[20:58:31.137] 
[20:58:31.140] Failed to compile.
[20:58:31.141] 
[20:58:31.141] ./src/components/auth/AuthProvider.tsx
[20:58:31.141] 3:25  Error: 'useContext' is defined but never used.  @typescript-eslint/no-unused-vars
[20:58:31.141] 123:58  Warning: React Hook useCallback has an unnecessary dependency: 'router'. Either exclude it or remove the dependency array.  react-hooks/exhaustive-deps
[20:58:31.141] 125:48  Warning: React Hook useMemo has unnecessary dependencies: 'isLoading', 'profile', 'session', 'signOut', and 'user'. Either exclude them or remove the dependency array.  react-hooks/exhaustive-deps
[20:58:31.141] 
[20:58:31.141] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
[20:58:31.171] Error: Command "npm run build" exited with 1
[20:58:31.406] 