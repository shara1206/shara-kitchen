/* Root service-worker stub for Shara's Kitchen.
   Must live at site root so its scope covers the whole recipe site (offline).
   All real logic + the precache manifest live in kitchen-app/. */
importScripts('kitchen-app/data/precache.js', 'kitchen-app/sw-core.js');
