# Bug Fix: schema.sql Not Found in Production

## Problem

When running the production build, the application failed with:

```
Error: ENOENT: no such file or directory, open '/app/backend/dist/lib/schema.sql'
```

## Root Cause

TypeScript's `tsc` compiler only compiles `.ts` files to `.js` files. It doesn't copy other file types (like `.sql`, `.json`, etc.) to the `dist` output directory.

The migration script (`migrate.ts`) reads `schema.sql` from the same directory, but in production builds, only the compiled JavaScript files exist in `dist/lib/`, not the SQL file.

## Solution

Updated the build script in `backend/package.json` to copy `schema.sql` after TypeScript compilation:

```json
{
  "scripts": {
    "build": "tsc && node -e \"const fs = require('fs'); const path = require('path'); fs.mkdirSync('dist/lib', {recursive: true}); fs.copyFileSync('src/lib/schema.sql', 'dist/lib/schema.sql');\""
  }
}
```

This ensures that:
1. TypeScript compiles all `.ts` files to `dist/`
2. The `schema.sql` file is copied to `dist/lib/schema.sql`
3. The production build includes all necessary files

## How It Works

### Development Mode (`yarn dev`)
- Uses `tsx` to run TypeScript directly from source
- Reads `schema.sql` from `src/lib/schema.sql`
- No build step required

### Production Mode (`yarn build && yarn start`)
- Compiles TypeScript to JavaScript in `dist/`
- Copies `schema.sql` to `dist/lib/schema.sql`
- Runs from compiled code with `node dist/index.js`

### Docker Production
- Dockerfile runs `yarn build` during build stage
- Copies entire `dist/` folder (including `schema.sql`) to runtime image
- Works correctly in production containers

## Verification

```bash
# Build the backend
cd backend
yarn build

# Verify schema.sql exists in dist
ls dist/lib/schema.sql
# Output: dist/lib/schema.sql

# Run production mode
yarn start
# Should start successfully without ENOENT error
```

## Alternative Solutions Considered

### 1. Use TypeScript's `--copyFiles` (Rejected)
- Not available in standard `tsc`
- Would require additional plugins

### 2. Use a build tool like `esbuild` or `webpack` (Rejected)
- Adds complexity
- TypeScript compilation works fine for our needs

### 3. Read SQL from source in production (Rejected)
- Requires keeping source files in production image
- Increases image size
- Goes against compiled build best practices

### 4. Embed SQL as string in TypeScript (Rejected)
- Harder to maintain
- Loses syntax highlighting
- Makes schema changes more difficult

## Future Considerations

If we add more non-TypeScript files that need to be included in the build (images, JSON configs, etc.), consider:

1. **copyfiles package**: Cross-platform file copying
   ```bash
   yarn add -D copyfiles
   # package.json
   "build": "tsc && copyfiles -u 1 src/**/*.sql dist/"
   ```

2. **Build script**: Separate Node.js build script
   ```javascript
   // scripts/build.js
   // Custom build logic with proper error handling
   ```

3. **Bundle tool**: Use esbuild or similar for complete bundling

## Related Files

- `backend/package.json` - Build script updated
- `backend/src/lib/migrate.ts` - Reads schema.sql
- `backend/src/lib/schema.sql` - Database schema
- `Dockerfile` - Uses `yarn build` (automatically includes fix)
- `Dockerfile.dev` - Uses `tsx` (no build needed)

---

**Fixed:** 2025-11-26
**Impact:** Production builds and Docker production deployments
