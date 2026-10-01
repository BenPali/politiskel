# Politiskel — the site

The SvelteKit front end (Svelte 5), built into static pages the Rust server
serves (`POLITISKEL_SITE=site/build`). One route is one page; addresses with an
id (`/boussole/[membre]`, `/groupes/[id]`, `/rejoindre/[code]`) are served by
the fallback page and route in the browser.

```
npm install
npm run dev      # http://localhost:5173, the API proxied to the Rust server on :8080
npm run build    # → build/
```

The model, the questionnaire and the reference data are not duplicated: they
are the files in `../tools/`, shared with the Node tools (`src/lib/model.js`).
The French copy is `src/lib/i18n/fr.js`.
