import { inject, setYear, enableFocusVisible } from './utils.mjs';
import { updateFavCount } from './storage.js';
import { enableFavoriteButtons } from './fav-ui.js';
import { initNav } from './nav.js';

import './home.js';

await inject('#header', '/partials/header.html');
initNav();           
await inject('#footer', '/partials/footer.html');
await inject('#hero', '/partials/hero.html');
await inject('#mealdb', '/partials/mealdb.html');
await inject('#info-section', 'partials/info-section.html');
await inject('#categories', 'partials/categories.html');
setYear();
enableFocusVisible();
updateFavCount();
enableFavoriteButtons();
