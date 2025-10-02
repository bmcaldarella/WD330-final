import { inject, setYear, enableFocusVisible } from './utils.mjs';
import { updateFavCount } from './storage.js';
import './home.js';

await inject('#header', '/partials/header.html');
await inject('#footer', '/partials/footer.html');
await inject('#hero', '/partials/hero.html');
await inject('#mealdb', '/partials/mealdb.html');
await inject('#info-section', 'partials/info-section.html');
await inject('#categories', 'partials/categories.html');
setYear();
enableFocusVisible();
updateFavCount();
