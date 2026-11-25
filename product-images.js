// Show an explicit empty state when a product photo cannot be loaded.
(() => {
    const style = document.createElement('style');
    style.textContent = `
        .product-image-notice {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 12px; padding: 24px;
            color: #b6b6bd; text-align: center; font: 500 13px/1.4 sans-serif;
            position: relative; z-index: 1; pointer-events: none;
        }
        .product-image-notice svg { width: 36px; height: 36px; color: #bc642c; }
        .product-image-container.photo-unavailable {
            background: radial-gradient(ellipse at center, #1d1916, #101012) !important;
        }
        .product-image-container.photo-unavailable::after { display: none; }
        .pdp-image-col > .product-image-notice { flex: 1; width: 100%; min-height: 240px; }
        .product-photo-hidden { display: none !important; }
        .cart-photo-notice {
            width: 70px; height: 70px; flex-shrink: 0; padding: 5px;
            display: grid; place-items: center; border-radius: 8px;
            background: #202024; color: #aaa; font: 10px/1.2 sans-serif; text-align: center;
        }
    `;
    document.head.append(style);

    function notice() {
        const el = document.createElement('div');
        el.className = 'product-image-notice';
        el.setAttribute('role', 'status');
        el.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="4"/><circle cx="11" cy="12" r="2"/><path d="m5 23 7-7 5 5 4-4 6 6"/></svg><span>Imagen no disponible</span>';
        return el;
    }

    function checkBackground(el) {
        if (el.dataset.photoChecked) return;
        const match = el.style.backgroundImage.match(/^url\((["']?)(.*?)\1\)$/);
        if (!match) return;
        el.dataset.photoChecked = 'true';
        const probe = new Image();
        probe.onerror = () => {
            if (!el.isConnected) return;
            el.classList.add('photo-unavailable');
            el.append(notice());
        };
        probe.src = match[2];
    }

    function imageFailed(img) {
        if (!(img instanceof HTMLImageElement)) return;
        if (img.id === 'pdpImage') {
            img.classList.add('product-photo-hidden');
            if (!img.parentElement.querySelector('.product-image-notice')) {
                img.before(notice());
            }
        } else if (img.closest('#pdpThumbnails')) {
            img.classList.add('product-photo-hidden');
        } else if (img.classList.contains('cart-item-img')) {
            img.classList.add('product-photo-hidden');
            if (!img.previousElementSibling?.classList.contains('cart-photo-notice')) {
                const el = document.createElement('span');
                el.className = 'cart-photo-notice';
                el.textContent = 'Sin imagen';
                img.before(el);
            }
        }
    }

    document.addEventListener('error', event => imageFailed(event.target), true);
    document.addEventListener('load', event => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        img.classList.remove('product-photo-hidden');
        if (img.id === 'pdpImage') img.parentElement.querySelector('.product-image-notice')?.remove();
        if (img.classList.contains('cart-item-img') && img.previousElementSibling?.classList.contains('cart-photo-notice')) {
            img.previousElementSibling.remove();
        }
    }, true);

    function refresh() {
        document.querySelectorAll('.product-image-container').forEach(checkBackground);
        document.querySelectorAll('#pdpImage, #pdpThumbnails img, .cart-item-img').forEach(img => {
            if (img.complete && img.naturalWidth === 0) imageFailed(img);
        });
    }
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
    refresh();
})();
