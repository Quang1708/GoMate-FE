# Development log

## 2026-10-15 - Root development command

### Summary

- Add `npm run dev:all` outside the FE/BE directories to start both services together.
- Use concurrently with inherited terminal input/output to preserve Expo's QR code and keyboard shortcuts; stop both services on Ctrl+C or when either exits.

### Files changed

- Root `package.json`, `package-lock.json`, `.gitignore`, `README.md`, and this log. FE and BE packages are unchanged by this task.

### Verification

- `npm install --save-dev concurrently`: passed; zero reported vulnerabilities.
- `npm run dev:all`: backend listened on port 3000 and Expo started Metro on port 8081, displaying its QR code.
- Expo `?` keyboard shortcut: displayed the interactive command list.
- Metro `/status`: returned `packager-status:running`.
- Ctrl+C: stopped both services; neither port remained listening.
- `npm ls --depth=0`: resolved concurrently 10.0.6.

### Remaining work

- None.
