/* Root service-worker stub for Shara's Kitchen.
   Must live at site root so its scope covers the whole recipe site (offline).
   All real logic + the precache manifest live in kitchen-app/. */
/* Bump ?v= whenever kitchen-app/sw-core.js changes: changing this file makes every phone/iPad
   install the new worker on its next visit, without waiting for the browser's HTTP cache. */
importScripts('kitchen-app/data/precache.js', 'kitchen-app/sw-core.js?v=2');
