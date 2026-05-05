import { initUI } from './ui.js';
import { initChat } from './chat.js';
import { initSearch } from './search.js';
import { initAuth } from './auth.js';
import { initForms } from './forms.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initUI();
    initChat();
    initSearch();
    initAuth();
    initForms();
});
