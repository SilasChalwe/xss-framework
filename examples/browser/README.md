# Covian Browser Example

This is the minimal browser example for Covian.

## What this example imports

`main.js` intentionally imports only what is required:

- `createDomApi` from `../../js/index.js`
- the generated Wasm factory from `../../js/secure_engine.generated.js`

Both are required for a complete working setup.

## How to run

From the repository root, run a static server:

```bash
# Node/npm
npx serve .

# or Python
python3 -m http.server 4173
```

Open:
- `http://localhost:3000/examples/browser/` (with `npx serve`)
- `http://localhost:4173/examples/browser/` (with Python)

> Do not open `index.html` directly with `file://`; module/Wasm loading is not reliable there.

## What you should see

You should see one line rendered on the page:

`Results for: <your query value>`

If no `?q=` parameter is provided, the default payload string is shown safely as text.

If startup fails, the page now shows a clear error message instead of a blank screen.
