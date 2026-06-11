const Cart = {
    items: [],
    
    init() {
        // Cargar desde localStorage
        const stored = localStorage.getItem('megalodon_cart');
        if (stored) {
            try {
                this.items = JSON.parse(stored);
            } catch (e) {
                this.items = [];
            }
        }
        
        this.injectUI();
        this.updateUI();
    },
    
    save() {
        localStorage.setItem('megalodon_cart', JSON.stringify(this.items));
        this.updateUI();
    },
    
    add(product, qty, size) {
        // Generar un ID único para el ítem en el carrito
        const cartItemId = product.id + (size ? '_' + size : '');
        
        const existing = this.items.find(i => i.cartItemId === cartItemId);
        if (existing) {
            existing.qty += qty;
        } else {
            this.items.push({
                cartItemId,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: (product.images && product.images.length > 0) ? product.images[0] : 'logo.png'
                },
                qty,
                size
            });
        }
        this.save();
        this.openSidebar();
    },
    
    remove(cartItemId) {
        this.items = this.items.filter(i => i.cartItemId !== cartItemId);
        this.save();
    },
    
    updateQty(cartItemId, newQty) {
        if (newQty < 1) return;
        const item = this.items.find(i => i.cartItemId === cartItemId);
        if (item) {
            item.qty = newQty;
            this.save();
        }
    },
    
    getTotal() {
        return this.items.reduce((total, item) => total + (item.product.price * item.qty), 0);
    },
    
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.qty, 0);
    },
    
    generateWhatsAppMessage() {
        if (this.items.length === 0) return null;
        
        let msg = "Hola! Quiero realizar un pedido desde la web:\n\n";
        
        this.items.forEach(item => {
            msg += `- ${item.qty}x ${item.product.name}`;
            if (item.size) msg += ` (Talla: ${item.size})`;
            msg += ` a $${Number(item.product.price).toLocaleString('es-CL')} c/u\n`;
        });
        
        msg += `\n*Total estimado: $${Number(this.getTotal()).toLocaleString('es-CL')}*\n\n`;
        msg += "Quedo atento/a para coordinar el pago y envío.";
        
        return msg;
    },
    
    orderViaWhatsApp() {
        const msg = this.generateWhatsAppMessage();
        if (msg) {
            window.open("https://wa.me/56995068979?text=" + encodeURIComponent(msg), "_blank");
        }
    },
    
    injectUI() {
        // Estilos para el carrito
        const style = document.createElement('style');
        style.textContent = `
            .cart-floating-btn {
                position: fixed;
                bottom: 110px;
                right: 30px;
                background: var(--orange, #ff5100);
                color: #000;
                width: 65px;
                height: 65px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 30px rgba(255, 81, 0, 0.4);
                cursor: pointer;
                z-index: 998;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .cart-floating-btn:hover {
                transform: scale(1.1) rotate(-5deg);
            }
            .cart-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #fff;
                color: #000;
                font-weight: bold;
                font-size: 0.8rem;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #000;
            }
            .cart-sidebar-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(5px);
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .cart-sidebar-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .cart-sidebar {
                position: fixed;
                top: 0;
                right: -400px;
                width: 100%;
                max-width: 400px;
                height: 100vh;
                background: #0a0a0f;
                border-left: 1px solid rgba(255,255,255,0.1);
                z-index: 1001;
                display: flex;
                flex-direction: column;
                transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .cart-sidebar.active {
                right: 0;
            }
            .cart-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cart-header h2 {
                margin: 0;
                font-family: var(--font-display, 'Bebas Neue', sans-serif);
                font-size: 2rem;
                color: #fff;
            }
            .cart-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .cart-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
            }
            .cart-item {
                display: flex;
                gap: 1rem;
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1rem;
            }
            .cart-item-img {
                width: 70px;
                height: 70px;
                object-fit: contain;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            .cart-item-info {
                flex: 1;
            }
            .cart-item-title {
                font-weight: 600;
                font-size: 1rem;
                color: #fff;
                margin-bottom: 0.2rem;
            }
            .cart-item-meta {
                font-size: 0.8rem;
                color: #aaa;
                margin-bottom: 0.5rem;
            }
            .cart-item-controls {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .cart-qty-ctrl {
                display: flex;
                align-items: center;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            .cart-qty-btn {
                background: none;
                border: none;
                color: #fff;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            .cart-qty-val {
                width: 20px;
                text-align: center;
                font-size: 0.9rem;
                color: #fff;
            }
            .cart-remove-btn {
                background: none;
                border: none;
                color: #ff5100;
                cursor: pointer;
                font-size: 0.8rem;
                text-decoration: underline;
            }
            .cart-footer {
                padding: 1.5rem;
                border-top: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.5);
            }
            .cart-total {
                display: flex;
                justify-content: space-between;
                font-size: 1.5rem;
                font-weight: bold;
                color: #fff;
                margin-bottom: 1rem;
            }
            .cart-btn-buy {
                width: 100%;
                background: #25D366;
                color: white;
                border: none;
                padding: 1.2rem;
                border-radius: 50px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
            }
            .cart-btn-buy:hover {
                background: #128C7E;
                box-shadow: 0 0 20px rgba(37,211,102,0.4);
            }
            .empty-cart-msg {
                text-align: center;
                color: #aaa;
                margin-top: 2rem;
            }
        `;
        document.head.appendChild(style);

        // UI HTML
        const uiHtml = `
            <!-- Floating Button -->
            <div class="cart-floating-btn" id="cartFloatingBtn" onclick="Cart.openSidebar()">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <div class="cart-badge" id="cartBadge">0</div>
            </div>

            <!-- Sidebar Overlay -->
            <div class="cart-sidebar-overlay" id="cartOverlay" onclick="Cart.closeSidebar()"></div>

            <!-- Sidebar -->
            <div class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h2>Tu Carrito</h2>
                    <button class="cart-close" onclick="Cart.closeSidebar()">×</button>
                </div>
                <div class="cart-body" id="cartBody">
                    <!-- Items will be injected here -->
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span id="cartTotalVal">$0</span>
                    </div>
                    <button class="cart-btn-buy" onclick="Cart.orderViaWhatsApp()" id="cartBuyBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Pedir por WhatsApp
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', uiHtml);
    },
    
    openSidebar() {
        document.getElementById('cartOverlay').classList.add('active');
        document.getElementById('cartSidebar').classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    closeSidebar() {
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('cartSidebar').classList.remove('active');
        document.body.style.overflow = '';
    },
    
    updateUI() {
        const badge = document.getElementById('cartBadge');
        const body = document.getElementById('cartBody');
        const totalVal = document.getElementById('cartTotalVal');
        const buyBtn = document.getElementById('cartBuyBtn');
        
        const totalItems = this.getTotalItems();
        badge.textContent = totalItems;
        
        if (totalItems === 0) {
            body.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío</div>';
            buyBtn.style.opacity = '0.5';
            buyBtn.style.pointerEvents = 'none';
        } else {
            buyBtn.style.opacity = '1';
            buyBtn.style.pointerEvents = 'auto';
            body.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <img src="${item.product.image}" class="cart-item-img" alt="${item.product.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.product.name}</div>
                        <div class="cart-item-meta">
                            ${item.size ? `Talla: ${item.size} <br>` : ''}
                            $${Number(item.product.price).toLocaleString('es-CL')}
                        </div>
                        <div class="cart-item-controls">
                            <div class="cart-qty-ctrl">
                                <button class="cart-qty-btn" onclick="Cart.updateQty('${item.cartItemId}', ${item.qty - 1})">-</button>
                                <span class="cart-qty-val">${item.qty}</span>
                                <button class="cart-qty-btn" onclick="Cart.updateQty('${item.cartItemId}', ${item.qty + 1})">+</button>
                            </div>
                            <button class="cart-remove-btn" onclick="Cart.remove('${item.cartItemId}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        totalVal.textContent = '$' + Number(this.getTotal()).toLocaleString('es-CL');
    }
};

// Iniciar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
});
