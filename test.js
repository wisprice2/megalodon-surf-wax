
        let ALL_PRODUCTS = [];
        let ACTIVE_CATEGORY = 'Todos';

        async function initCatalog() {
            try {
                const res = await fetch('/api/products?t=' + Date.now());
                if (res.ok) {
                    ALL_PRODUCTS = await res.json();
                } else {
                    console.warn('API error, loading default products');
                    ALL_PRODUCTS = getDefaultProducts();
                }
            } catch (err) {
                console.error('Fetch error, loading default products', err);
                ALL_PRODUCTS = getDefaultProducts();
            }
            
            renderFilters();
            renderProducts();
        }

        function getDefaultProducts() {
            return [
                { id: 1, name: 'Cold Water Wax', category: 'Ceras', price: 4990, compareAtPrice: null, description: 'Fórmula artesanal 100% natural. Grip brutal para el Pacífico chileno.', images: ['wax_1.png'], tags: ['Best Seller'], stock: 50, brand: 'MEGALODON', variants: [] },
                { id: 2, name: 'Cool Water Wax', category: 'Ceras', price: 4990, compareAtPrice: null, description: 'Para los días de verano. Más firme, ideal para agua fresca y viajes al norte.', images: ['wax_2.png'], tags: ['Nuevo'], stock: 40, brand: 'MEGALODON', variants: [] },
                { id: 3, name: 'Surf Pack: 3 Barras', category: 'Ceras', price: 12900, compareAtPrice: 14970, description: 'Lleva 3 barras y ahorra. El pack del surfer que siempre tiene cera en la maleta.', images: ['wax_3.png'], tags: ['Ahorro'], stock: 30, brand: 'MEGALODON', variants: [] },
                { id: 4, name: 'Polera Megalodon', category: 'Apparel', price: 18990, compareAtPrice: 24990, description: 'Polera de algodón premium con logo vintage. Hecha para el post-surf.', images: ['bf88c491-03e3-42bd-8b4b-edc8245bcec8.png'], tags: ['Apparel'], stock: 20, brand: 'MEGALODON', variants: ['S', 'M', 'L', 'XL'] },
                { id: 5, name: "Leash 9' Megalodon", category: 'Accesorios', price: 14990, compareAtPrice: 19990, description: 'Leash ultra resistente de 7mm para olas de hasta 2 metros. Seguridad total.', images: ['leash_9.png'], tags: ['Nuevo'], stock: 15, brand: 'MEGALODON', variants: [] }
            ];
        }

        function renderFilters() {
            const filterContainer = document.getElementById('categoryFilters');
            let categories = [];
            
            // Extract unique categories from products list
            categories = [...new Set(ALL_PRODUCTS.map(p => p.category))].filter(c => c);
            
            const isTodosActive = ACTIVE_CATEGORY === 'Todos';
            
            let html = `
                <button class="btn ${isTodosActive ? 'btn-primary' : 'btn-outline'}" onclick="filterCategory('Todos')" style="padding: 0.6rem 1.5rem; font-size: 0.9rem;">
                    Todos
                </button>
                <select class="category-select" id="catDropdown" onchange="filterCategory(this.value)" style="margin-left: 0.5rem;">
                    <option value="" disabled ${isTodosActive ? 'selected' : ''}>Categorías</option>
            `;
            
            categories.forEach(cat => {
                const isSelected = ACTIVE_CATEGORY === cat;
                html += `<option value="${cat}" ${isSelected ? 'selected' : ''}>${cat}</option>`;
            });
            
            html += `</select>`;
            
            filterContainer.innerHTML = html;
        }

        function filterCategory(cat) {
            ACTIVE_CATEGORY = cat;
            renderFilters();
            renderProducts();
        }

        function renderProducts() {
            const grid = document.getElementById('productsGrid');
            const filtered = ACTIVE_CATEGORY === 'Todos' 
                ? ALL_PRODUCTS 
                : ALL_PRODUCTS.filter(p => p.category === ACTIVE_CATEGORY);
                
            if (filtered.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No hay productos en esta categoría.</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(p => {
                const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : 'logo.png';
                const badge = (p.tags && p.tags.length > 0) ? p.tags[0] : '';
                const badgeHtml = badge ? `<div class="product-badge">${badge}</div>` : '';
                
                // Construct subtitle (variants size list, or category, or brand)
                let subtitle = p.brand || 'MEGALODON';
                if (p.variants && p.variants.length > 0) {
                    subtitle = p.variants.join(' / ');
                } else if (p.category === 'Ceras') {
                    if (p.name.toLowerCase().includes('cold')) {
                        subtitle = 'Agua Fría (9° - 14°C)';
                    } else if (p.name.toLowerCase().includes('cool')) {
                        subtitle = 'Agua Fresca (13° - 20°C)';
                    } else {
                        subtitle = 'Combina a tu gusto';
                    }
                }
                
                const formattedPrice = '$' + Number(p.price).toLocaleString('es-CL');
                
                let thumbHtml = '';
                if (p.images && p.images.length > 1) {
                    thumbHtml = '<div style="display:flex; gap:5px; padding: 10px 15px 0 15px; overflow-x: auto;">';
                    p.images.forEach(img => {
                        thumbHtml += `<div style="width: 40px; height: 40px; border-radius: 4px; background: url('${img}') center/contain no-repeat; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);" onclick="event.stopPropagation(); document.getElementById('img-container-${p.id}').style.backgroundImage = 'url(${img})'"></div>`;
                    });
                    thumbHtml += '</div>';
                }
                
                return `
                    <div class="product-card glass-panel" data-aos="fade-up">
                        <div class="product-image-container" id="img-container-${p.id}" style="background: url('${imgUrl}') center/contain no-repeat; cursor: pointer;" onclick="window.location.href='producto.html?id=${p.id}'">
                            ${badgeHtml}
                        </div>
                        ${thumbHtml}
                        <div class="product-info">
                            <div class="product-temp">${subtitle}</div>
                            <h3 class="product-title">${p.name}</h3>
                            <p class="product-desc">${p.description}</p>
                            <div class="product-footer">
                                <div class="product-price">${formattedPrice}</div>
                                <a href="producto.html?id=${p.id}" class="btn btn-primary" style="padding: 0.6rem 1.2rem;">Ver Detalle</a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (window.AOS) {
                AOS.refresh();
            }
        }

        document.addEventListener('DOMContentLoaded', initCatalog);
    

        // Hamburger Menu Toggle
        document.getElementById('menuToggle').addEventListener('click', function() {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Initialize Animations
        AOS.init({
            duration: 800,
            once: true,
            offset: 50,
        });

        // Navbar Scroll Effect
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 10) {
                navbar.querySelector('.navbar').style.background = 'rgba(10, 10, 15, 0.95)';
            } else {
                navbar.querySelector('.navbar').style.background = 'rgba(255, 255, 255, 0.03)';
            }
        });
    