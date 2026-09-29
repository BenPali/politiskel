"use strict";
/* Loads a module of the site from a Node tool: `await site("compass/model.js")`.
   Only for modules with no Svelte in them, so that a check runs the code the
   page runs rather than a copy of it. SvelteKit's `$lib` alias is resolved
   here, since Node knows nothing of it. */

const path = require("path");
const module_ = require("node:module");
const { pathToFileURL } = require("node:url");

const LIB = path.join(__dirname, "..", "..", "site", "src", "lib");
let ready = false;

function site(file) {
  if (!ready) {
    module_.registerHooks({
      resolve(specifier, context, next) {
        return specifier.startsWith("$lib/")
          ? next(pathToFileURL(path.join(LIB, specifier.slice(5))).href, context)
          : next(specifier, context);
      }
    });
    ready = true;
  }
  return import(pathToFileURL(path.join(LIB, file)).href);
}

module.exports = { site };
