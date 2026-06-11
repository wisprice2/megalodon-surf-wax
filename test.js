
        // Global State
        let PRODUCTS = [];
        let CATEGORIES = [];
        let ORIGINAL_PRODUCTS = [];
        let ORIGINAL_CATEGORIES = [];
        let currentVariants = [];
        let currentImages = [];
        let hasChanges = false;

        // Check active session on load
        document.addEventListener('DOMContentLoaded', async () => {
            if (sessionStorage.getItem('dragons_admin_token') && sessionStorage.getItem('isAdminLoggedIn') === 'true') {
                showDashboard();
            } else {
                showLogin();
            }
        });

        function showLogin() {
            document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('dashboardContainer').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'none';
        }

        async function showDashboard() {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('dashboardContainer').style.display = 'block';
            document.getElementById('changePassBtn').style.display = 'inline-block';
            document.getElementById('logoutBtn').style.display = 'inline-block';
            
            await loadData();
        }

        // Login Handler
        async function handleLogin(e) {
            e.preventDefault();
            const userVal = document.getElementById('username').value;
            const passVal = document.getElementById('password').value;
            const submitBtn = document.getElementById('loginSubmitBtn');
            
            submitBtn.textContent = 'Autenticando...';
            submitBtn.disabled = true;

            try {
                const res = await fetch('/api/products?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', username: userVal, password: passVal })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    sessionStorage.setItem('dragons_admin_token', data.token);
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    showDashboard();
                } else {
                    alert('Credenciales incorrectas: ' + (data.error || 'Intente de nuevo.'));
                }
            } catch (err) {
                alert('Error al intentar conectar con el servidor.');
                console.error(err);
            } finally {
                submitBtn.textContent = 'Iniciar Sesión';
                submitBtn.disabled = false;
            }
        }

        function logout() {
            sessionStorage.removeItem('dragons_admin_token');
            sessionStorage.removeItem('isAdminLoggedIn');
            showLogin();
        }

        // Fetch categories and products
        async function loadData() {
            try {
                // Fetch Categories
                const resCats = await fetch('/api/products?action=categories');
                if (resCats.ok) {
                    CATEGORIES = await resCats.json();
                } else {
                    CATEGORIES = ['Ceras', 'Apparel', 'Accesorios']; // Fallback
                }
                
                // Fetch Products
                const resProds = await fetch('/api/products');
                if (resProds.ok) {
                    PRODUCTS = await resProds.json();
                } else {
                    PRODUCTS = getDefaultProducts(); // Fallback Mock
                }

                // Deep copy originals to track changes
                ORIGINAL_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS));
                ORIGINAL_CATEGORIES = JSON.parse(JSON.stringify(CATEGORIES));
                
                hasChanges = false;
                updateSyncBar();
                renderCategories();
                renderProducts();
                populateCategoryDropdown();
            } catch (err) {
                console.error('Error al cargar datos', err);
                alert('No se pudo establecer conexión con el backend de Supabase. Corriendo en modo local/mock.');
                // Fallbacks
                CATEGORIES = ['Ceras', 'Apparel', 'Accesorios'];
                PRODUCTS = getDefaultProducts();
                ORIGINAL_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS));
                ORIGINAL_CATEGORIES = JSON.parse(JSON.stringify(CATEGORIES));
                hasChanges = false;
                updateSyncBar();
                renderCategories();
                renderProducts();
                populateCategoryDropdown();
            }
        }

        function getDefaultProducts() {
            return [
                { id: 1, name: 'Cold Water Wax', category: 'Ceras', price: 4990, compareAtPrice: null, description: 'Fórmula artesanal 100% natural. Grip brutal para el Pacífico chileno.', images: ['wax_1.png'], tags: ['best seller'], stock: 50, brand: 'MEGALODON', variants: [] },
                { id: 2, name: 'Cool Water Wax', category: 'Ceras', price: 4990, compareAtPrice: null, description: 'Para los días de verano. Más firme, ideal para agua fresca y viajes al norte.', images: ['wax_2.png'], tags: ['nuevo'], stock: 40, brand: 'MEGALODON', variants: [] },
                { id: 3, name: 'Surf Pack: 3 Barras', category: 'Ceras', price: 12900, compareAtPrice: 14970, description: 'Lleva 3 barras y ahorra. El pack perfecto para el surfer que siempre quiere tener el mejor grip asegurado.', images: ['wax_3.png'], tags: ['ahorro', 'oferta'], stock: 30, brand: 'MEGALODON', variants: [] },
                { id: 4, name: 'Polera Megalodon', category: 'Apparel', price: 18990, compareAtPrice: 24990, description: 'Camiseta premium de corte oversize en algodón pesado. Hecha para el post-surf. Diseño exclusivo Megalodon.', images: ['bf88c491-03e3-42bd-8b4b-edc8245bcec8.png'], tags: ['apparel'], stock: 20, brand: 'MEGALODON', variants: ['S', 'M', 'L', 'XL'] },
                { id: 5, name: "Leash 9' Megalodon", category: 'Accesorios', price: 14990, compareAtPrice: 19990, description: "Leash ultra resistente de 7mm de uretano premium para olas de hasta 2 metros.", images: ['leash_9.png'], tags: ['accesorios'], stock: 15, brand: 'MEGALODON', variants: [] }
            ];
        }

        function updateSyncBar() {
            const bar = document.getElementById('syncBar');
            if (hasChanges) {
                bar.style.display = 'flex';
            } else {
                bar.style.display = 'none';
            }
        }

        function checkChanges() {
            const sameProducts = JSON.stringify(PRODUCTS) === JSON.stringify(ORIGINAL_PRODUCTS);
            const sameCategories = JSON.stringify(CATEGORIES) === JSON.stringify(ORIGINAL_CATEGORIES);
            hasChanges = !sameProducts || !sameCategories;
            updateSyncBar();
        }

        // Tabs switcher
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        }

        // Render Categories
        function renderCategories() {
            const container = document.getElementById('categoriesList');
            if (CATEGORIES.length === 0) {
                container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No hay categorías creadas.</div>';
                return;
            }

            container.innerHTML = CATEGORIES.map((cat, idx) => `
                <div class="category-item">
                    <span>${cat}</span>
                    <button class="action-btn delete" onclick="deleteCategory('${cat}')">Eliminar</button>
                </div>
            `).join('');
        }

        function populateCategoryDropdown() {
            const select = document.getElementById('pCategory');
            select.innerHTML = CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        function addCategory(e) {
            e.preventDefault();
            const input = document.getElementById('newCatName');
            const name = input.value.trim();
            if (!name) return;

            if (CATEGORIES.includes(name)) {
                alert('La categoría ya existe.');
                return;
            }

            CATEGORIES.push(name);
            input.value = '';
            
            renderCategories();
            populateCategoryDropdown();
            checkChanges();
        }

        function deleteCategory(name) {
            // Check if any product is in this category
            const hasProducts = PRODUCTS.some(p => p.category === name);
            if (hasProducts) {
                alert('No se puede eliminar la categoría porque hay productos asignados a ella.');
                return;
            }

            if (confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
                CATEGORIES = CATEGORIES.filter(c => c !== name);
                renderCategories();
                populateCategoryDropdown();
                checkChanges();
            }
        }

        // Render Products
        function renderProducts() {
            const body = document.getElementById('productsTableBody');
            const query = document.getElementById('productSearch').value.toLowerCase();
            
            const filtered = PRODUCTS.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
            );

            if (filtered.length === 0) {
                body.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron productos.</td></tr>';
                return;
            }

            body.innerHTML = filtered.map(p => {
                const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : 'logo.png';
                const variantsHtml = (p.variants && p.variants.length > 0) 
                    ? p.variants.map(v => `<span class="badge">${v}</span>`).join('') 
                    : '<span style="color: var(--text-muted); font-size: 0.85rem;">Ninguna</span>';
                
                return `
                    <tr>
                        <td><img src="${imgUrl}" class="product-thumb" alt="${p.name}" onerror="this.src='logo.png'"></td>
                        <td style="font-weight: 600;">${p.name}</td>
                        <td><span class="badge" style="background: rgba(255,255,255,0.05); color: #fff; border-color: var(--border);">${p.category}</span></td>
                        <td style="font-weight: 500; color: var(--accent-secondary);">$${Number(p.price).toLocaleString('es-CL')}</td>
                        <td>${p.stock} uds</td>
                        <td>${variantsHtml}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="action-btn" onclick="editProduct(${p.id})">Editar</button>
                                <button class="action-btn delete" onclick="deleteProduct(${p.id})">Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Product CRUD Modals
        function openProductModal(prod = null) {
            const modal = document.getElementById('productModal');
            const form = document.getElementById('productForm');
            
            form.reset();
            currentVariants = [];
            currentImages = [];
            
            if (prod) {
                document.getElementById('modalTitle').textContent = 'Editar Producto';
                document.getElementById('editProductId').value = prod.id;
                document.getElementById('pName').value = prod.name;
                document.getElementById('pCategory').value = prod.category;
                document.getElementById('pPrice').value = prod.price;
                document.getElementById('pComparePrice').value = prod.compareAtPrice || '';
                document.getElementById('pStock').value = prod.stock;
                document.getElementById('pBrand').value = prod.brand || 'MEGALODON';
                document.getElementById('pDesc').value = prod.description || '';
                document.getElementById('pTags').value = prod.tags ? prod.tags.join(', ') : '';
                
                currentVariants = prod.variants ? [...prod.variants] : [];
                currentImages = prod.images ? [...prod.images] : [];
            } else {
                document.getElementById('modalTitle').textContent = 'Nuevo Producto';
                document.getElementById('editProductId').value = '';
                document.getElementById('pBrand').value = 'MEGALODON';
                document.getElementById('pStock').value = 10;
            }

            renderVariants();
            renderImages();
            modal.classList.add('active');
        }

        function closeProductModal() {
            document.getElementById('productModal').classList.remove('active');
        }

        function editProduct(id) {
            const prod = PRODUCTS.find(p => p.id === id);
            if (prod) {
                openProductModal(prod);
            }
        }

        function deleteProduct(id) {
            if (confirm('¿Estás seguro de eliminar este producto? Se eliminará localmente hasta que sincronices.')) {
                PRODUCTS = PRODUCTS.filter(p => p.id !== id);
                renderProducts();
                checkChanges();
            }
        }

        // Save local product details
        function saveProduct(e) {
            e.preventDefault();
            const idVal = document.getElementById('editProductId').value;
            const name = document.getElementById('pName').value.trim();
            const category = document.getElementById('pCategory').value;
            const price = parseFloat(document.getElementById('pPrice').value);
            const compPriceVal = document.getElementById('pComparePrice').value;
            const compareAtPrice = compPriceVal ? parseFloat(compPriceVal) : null;
            const stock = parseInt(document.getElementById('pStock').value);
            const brand = document.getElementById('pBrand').value.trim();
            const description = document.getElementById('pDesc').value.trim();
            const tagsInput = document.getElementById('pTags').value;
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

            if (idVal) {
                // Edit mode
                const idx = PRODUCTS.findIndex(p => p.id == idVal);
                if (idx !== -1) {
                    PRODUCTS[idx] = {
                        ...PRODUCTS[idx],
                        name, category, price, compareAtPrice, stock, brand, description, tags,
                        variants: currentVariants,
                        images: currentImages
                    };
                }
            } else {
                // Add mode: Assign a numeric timestamp BIGINT id
                const newId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
                PRODUCTS.push({
                    id: newId,
                    name, category, price, compareAtPrice, stock, brand, description, tags,
                    variants: currentVariants,
                    images: currentImages
                });
            }

            closeProductModal();
            renderProducts();
            checkChanges();
        }

        // Variants Tag Manager
        function renderVariants() {
            const container = document.getElementById('variantsContainer');
            container.innerHTML = currentVariants.map(v => `
                <span class="variant-tag">
                    ${v}
                    <button type="button" onclick="removeVariant('${v}')">×</button>
                </span>
            `).join('');
        }

        function handleVariantInput(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = e.target.value.trim().replace(',', '');
                if (val && !currentVariants.includes(val)) {
                    currentVariants.push(val);
                    e.target.value = '';
                    renderVariants();
                }
            }
        }

        function addPresetVariant(val) {
            if (!currentVariants.includes(val)) {
                currentVariants.push(val);
                renderVariants();
            }
        }

        function removeVariant(val) {
            currentVariants = currentVariants.filter(v => v !== val);
            renderVariants();
        }

        // Images Manager and Multipart Uploader
        function renderImages() {
            const container = document.getElementById('imageThumbnails');
            container.innerHTML = currentImages.map((img, idx) => `
                <div class="thumb-container">
                    <img src="${img}" onerror="this.src='logo.png'">
                    <button type="button" class="remove-thumb-btn" onclick="removeImage(${idx})">×</button>
                </div>
            `).join('');
        }

        function removeImage(index) {
            currentImages.splice(index, 1);
            renderImages();
        }

        async function handleImageUpload(e) {
            const files = e.target.files;
            if (!files.length) return;

            const token = sessionStorage.getItem('dragons_admin_token');
            const progress = document.getElementById('uploadProgress');
            progress.style.display = 'block';

            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('image', files[i]);

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.url) {
                            currentImages.push(data.url);
                        }
                    } else {
                        const errData = await res.json();
                        alert(`Error al subir imagen "${files[i].name}": ${errData.error || 'Código incorrecto'}`);
                        
                        // Local Fallback (convert to base64 if upload endpoint fails or unauthorized)
                        const b64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => resolve(ev.target.result);
                            reader.readAsDataURL(files[i]);
                        });
                        currentImages.push(b64);
                    }
                } catch (err) {
                    console.error('Error uploading image', err);
                    
                    // FileReader Base64 fallback on network failure
                    const b64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => resolve(ev.target.result);
                        reader.readAsDataURL(files[i]);
                    });
                    currentImages.push(b64);
                }
            }

            progress.style.display = 'none';
            renderImages();
            e.target.value = ''; // clear input
        }

        // Database Synchronization
        async function syncWithDatabase() {
            const token = sessionStorage.getItem('dragons_admin_token');
            const syncBtn = document.querySelector('#syncBar .btn-primary');
            const originalText = syncBtn.textContent;
            
            syncBtn.textContent = 'Sincronizando...';
            syncBtn.disabled = true;

            try {
                // 1. Sync Categories
                const resCats = await fetch('/api/products?action=save_categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(CATEGORIES)
                });

                if (!resCats.ok) {
                    const err = await resCats.json();
                    throw new Error(`Sincronización de categorías falló: ${err.error}`);
                }

                // 2. Sync Products
                const resProds = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(PRODUCTS)
                });

                if (!resProds.ok) {
                    const err = await resProds.json();
                    throw new Error(`Sincronización de productos falló: ${err.error}`);
                }

                alert('¡Datos guardados y sincronizados con Supabase de manera exitosa!');
                
                // Reset state
                ORIGINAL_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS));
                ORIGINAL_CATEGORIES = JSON.parse(JSON.stringify(CATEGORIES));
                hasChanges = false;
                updateSyncBar();
            } catch (err) {
                alert(`Error al sincronizar: ${err.message}`);
                console.error(err);
            } finally {
                syncBtn.textContent = originalText;
                syncBtn.disabled = false;
            }
        }

        function revertChanges() {
            if (confirm('¿Deseas descartar todos los cambios no guardados en la nube?')) {
                PRODUCTS = JSON.parse(JSON.stringify(ORIGINAL_PRODUCTS));
                CATEGORIES = JSON.parse(JSON.stringify(ORIGINAL_CATEGORIES));
                hasChanges = false;
                
                updateSyncBar();
                renderCategories();
                renderProducts();
                populateCategoryDropdown();
            }
        }

        // Hamburger Menu Toggle
        document.getElementById('menuToggle').addEventListener('click', function() {
            document.getElementById('navLinks').classList.toggle('active');
        });
    

        function openPasswordModal() {
            document.getElementById('passwordModal').style.display = 'flex';
            document.getElementById('passwordForm').reset();
        }

        function closePasswordModal() {
            document.getElementById('passwordModal').style.display = 'none';
        }

        async function handlePasswordChange(e) {
            e.preventDefault();
            const currentPass = document.getElementById('currentPass').value;
            const newPass = document.getElementById('newPass').value;
            const confirmPass = document.getElementById('confirmPass').value;

            if (newPass !== confirmPass) {
                alert('Las contraseñas nuevas no coinciden.');
                return;
            }

            const btn = document.getElementById('savePassBtn');
            btn.textContent = 'Guardando...';
            btn.disabled = true;

            try {
                const token = sessionStorage.getItem('dragons_admin_token') || '';
                const res = await fetch('/api/products?action=change_password', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
                });

                const data = await res.json();
                
                if (data.success) {
                    alert('Contraseña cambiada exitosamente. Debes iniciar sesión nuevamente.');
                    closePasswordModal();
                    logout();
                } else {
                    alert('Error: ' + (data.error || 'No se pudo cambiar la contraseña.'));
                }
            } catch (err) {
                console.error(err);
                alert('Error de conexión al servidor.');
            } finally {
                btn.textContent = 'Guardar';
                btn.disabled = false;
            }
        }
    