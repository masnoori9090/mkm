/**
 * base.js — Get Any Scent Theme
 * Global JavaScript: scroll reveal, cart, product card quick-add
 */

(function () {
  'use strict';

  // =============================================
  // SCROLL REVEAL via IntersectionObserver
  // =============================================

  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }

  // Re-init on dynamic content (product recommendations, etc.)
  document.addEventListener('scroll-reveal:init', initScrollReveal);

  // =============================================
  // CART DRAWER
  // =============================================

  function initCartDrawer() {
    const drawer = document.getElementById('CartDrawer');
    const closeBtn = document.getElementById('CartDrawerClose');
    const overlay = document.getElementById('cart-overlay');
    const cartToggles = document.querySelectorAll('[data-cart-toggle]');
    const continueBtn = document.getElementById('CartContinueShopping');

    if (!drawer) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-visible');
      document.body.classList.add('cart-open');
      // Focus trap
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-visible');
      document.body.classList.remove('cart-open');
    }

    cartToggles.forEach(btn => btn.addEventListener('click', openDrawer));
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (continueBtn) continueBtn.addEventListener('click', closeDrawer);

    // Open on add to cart event
    document.addEventListener('cart:open', openDrawer);

    // Keyboard trap
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Quantity change in cart drawer
    document.addEventListener('click', async (e) => {
      const qtyBtn = e.target.closest('[data-change]');
      const removeBtn = e.target.closest('[data-remove]');

      if (qtyBtn) {
        const line = parseInt(qtyBtn.dataset.line);
        const change = parseInt(qtyBtn.dataset.change);
        const item = document.querySelector(`.cart-drawer__item[data-line="${line}"]`);
        if (!item) return;
        const qtyEl = item.querySelector('.cart-drawer__qty-value');
        const currentQty = parseInt(qtyEl.textContent || 1);
        const newQty = Math.max(0, currentQty + change);
        await updateCartLine(line, newQty);
      }

      if (removeBtn) {
        const line = parseInt(removeBtn.dataset.line);
        await updateCartLine(line, 0);
      }
    });

    // Cart item added event — refresh cart drawer
    document.addEventListener('cart:item-added', refreshCartDrawer);
  }

  async function updateCartLine(line, quantity) {
    try {
      const response = await fetch(window.theme.routes.cart_change_url + '.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ line, quantity })
      });
      const cart = await response.json();
      if (response.ok) {
        await refreshCartDrawer();
        updateCartCount(cart.item_count);
      }
    } catch (err) {
      console.error('Cart update failed', err);
    }
  }

  async function refreshCartDrawer() {
    try {
      const response = await fetch(window.location.pathname + '?sections=cart-drawer');
      const data = await response.json();
      if (data['cart-drawer']) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data['cart-drawer'], 'text/html');
        const newBody = doc.querySelector('.cart-drawer__body');
        const newFooter = doc.querySelector('.cart-drawer__footer');
        const newShipping = doc.querySelector('.cart-drawer__shipping-bar');

        const currentBody = document.querySelector('.cart-drawer__body');
        const currentFooter = document.querySelector('.cart-drawer__footer');
        const currentShipping = document.querySelector('.cart-drawer__shipping-bar');

        if (newBody && currentBody) currentBody.innerHTML = newBody.innerHTML;
        if (newFooter && currentFooter) currentFooter.innerHTML = newFooter.innerHTML;
        if (newShipping && currentShipping) currentShipping.innerHTML = newShipping.innerHTML;
      }
    } catch (err) {
      // fallback: reload
    }
  }

  function updateCartCount(count) {
    const countEls = document.querySelectorAll('#CartCount, [data-cart-count]');
    countEls.forEach(el => {
      el.textContent = count;
      if (count === 0) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }

  // =============================================
  // PRODUCT CARD — Quick Add
  // =============================================

  function initQuickAdd() {
    document.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('.product-card__add-btn');
      if (!addBtn) return;

      e.preventDefault();
      const variantId = addBtn.dataset.variantId;
      if (!variantId) return;

      addBtn.textContent = '...';

      try {
        const response = await fetch(window.theme.routes.cart_add_url + '.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        });
        const data = await response.json();
        if (response.ok) {
          document.dispatchEvent(new CustomEvent('cart:item-added', { detail: data }));
          document.dispatchEvent(new CustomEvent('cart:open'));
          updateCartCount(data.quantity + 1);
          addBtn.textContent = '✓';
          setTimeout(() => {
            addBtn.textContent = 'ADD TO BAG';
          }, 2000);
        } else {
          addBtn.textContent = 'ADD TO BAG';
        }
      } catch (err) {
        addBtn.textContent = 'ADD TO BAG';
      }
    });
  }

  // =============================================
  // INIT
  // =============================================

  function init() {
    initScrollReveal();
    initCartDrawer();
    initQuickAdd();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
