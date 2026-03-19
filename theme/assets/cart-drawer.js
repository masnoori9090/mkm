/**
 * cart-drawer.js — Get Any Scent Theme
 * Extended cart drawer functionality (focus trap, accessibility)
 */

(function () {
  'use strict';

  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  function initFocusTrap() {
    const drawer = document.getElementById('CartDrawer');
    if (drawer) trapFocus(drawer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFocusTrap);
  } else {
    initFocusTrap();
  }

})();
