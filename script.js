// --- ESTADO DE LA APLICACIÓN ---
let PRODUCTOS_BASE = [];
let filtrados = [];
let itemsToShow = 12; 
let carrito = [];
let descuentoAplicado = 0; 

// --- 1. CARGA DE DATOS ---
async function cargarDatos() {
    try {
        const respuesta = await fetch('./mangas.json');
        if (!respuesta.ok) throw new Error('No se pudo cargar el archivo');
        PRODUCTOS_BASE = await respuesta.json();
        
        // Aplicar descuento automático al cargar
        aplicarDescuentoAutomatico();
        
        aplicarFiltros(true);
    } catch (error) {
        console.error("Error:", error);
        const container = document.getElementById('product-grid');
        if (container) {
            container.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold">Error al cargar mangas.json</p>`;
        }
    }
}

// NUEVA: Función de Descuento Automático
function aplicarDescuentoAutomatico() {
    // Usamos la lógica de descuentos.js (asumiendo que validarDescuento existe ahí)
    // Probamos con el código de inauguración o temporada
    const resultado = validarDescuento("MANGALOVE"); // O el código que tengas activo
    if (resultado && resultado.valido) {
        descuentoAplicado = resultado.porcentaje;
        console.log(`Descuento del ${descuentoAplicado}% aplicado automáticamente.`);
    }
}

// --- 2. FILTROS ---
function aplicarFiltros(resetPagination = false) {
    const busqueda = document.getElementById('inputBusqueda')?.value.toLowerCase().trim() || "";
    const editorialSeleccionada = document.getElementById('selectEditorial')?.value.toLowerCase().trim() || "todas";
    const orden = document.getElementById('ordenarPrecio')?.value || "default";

    if(resetPagination) itemsToShow = 12;

    filtrados = PRODUCTOS_BASE.filter(p => {
        const nombreManga = (p.Título || "").toLowerCase().trim();
        const editorialManga = (p.Editorial || "").toLowerCase().trim();
        const barrasManga = (p["Codigo de barras"] || "").toString().toLowerCase().trim();
        
        const coincideBusqueda = nombreManga.includes(busqueda) || barrasManga.includes(busqueda);
        const coincideEditorial = (editorialSeleccionada === 'todas') || (editorialManga.includes(editorialSeleccionada));
        
        return coincideBusqueda && coincideEditorial;
    });

    if (orden === 'bajo') filtrados.sort((a, b) => parseFloat(a.Precio || 0) - parseFloat(b.Precio || 0));
    if (orden === 'alto') filtrados.sort((a, b) => parseFloat(b.Precio || 0) - parseFloat(a.Precio || 0));

    renderGrid();
}

// --- 3. RENDER TIENDA ---
function renderGrid() {
    const container = document.getElementById('product-grid');
    const btnLoadMore = document.getElementById('btn-load-more');
    const paginationContainer = document.getElementById('pagination-container');
    const noResults = document.getElementById('no-results');

    if (!container) return;
    
    const currentItems = filtrados.slice(0, itemsToShow);

    // Manejo de estado vacío
    if (filtrados.length === 0) {
        container.innerHTML = "";
        if (noResults) noResults.classList.remove('hidden');
        if (paginationContainer) paginationContainer.classList.add('hidden');
        return;
    } else {
        if (noResults) noResults.classList.add('hidden');
    }

    container.innerHTML = currentItems.map((p) => {
        const nombre = (p.Título || "").trim();
        const editorial = (p.Editorial || "Sin Editorial").trim();
        const precio = parseFloat(p.Precio || 0);
        const stock = parseInt(p["En inventario"] || 0);
        const imagen = p.Imagen || `https://images.placeholders.dev/?width=300&height=400&text=${nombre}&bg=0F5F5F`;
        const barras = p["Codigo de barras"] || "N/A";
        const sinStock = stock <= 0;

        return `
            <div class="group bg-white border border-[#0F5F5F]/10 p-5 rounded-[2.5rem] card-hover transition-all duration-300 shadow-sm flex flex-col">
                <div class="relative overflow-hidden rounded-[1.8rem] mb-4 aspect-[3/4]">
                    <img src="${imagen}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                    <div class="absolute top-3 left-3 bg-[#0F5F5F] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">${editorial}</div>
                    ${sinStock ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-white uppercase backdrop-blur-[2px]">Agotado</div>' : ''}
                </div>
                <div class="px-2 flex-grow flex flex-col">
                    <h4 class="font-bold text-[#0F5F5F] text-sm leading-tight mb-4 min-h-[2.5rem]">${nombre}</h4>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-xl font-black">$${precio.toFixed(2)}</span>
                        <button onclick="addToCart('${nombre.replace(/'/g, "")}', ${precio}, '${imagen}', '${editorial}', '${barras}')" 
                            class="${sinStock ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#FFD54A] hover:bg-[#0F5F5F] hover:text-white'} p-3 rounded-2xl border-2 border-[#0F5F5F] transition-all"
                            ${sinStock ? 'disabled' : ''}>
                            ${sinStock ? '🚫' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="3" stroke-linecap="round"/></svg>'}
                        </button>
                    </div>
                    <p class="text-[9px] mt-3 font-bold opacity-30 tracking-widest uppercase">Cod: ${barras}</p>
                </div>
            </div>
        `;
    }).join('');

    // Lógica del botón Cargar Más
    if (paginationContainer) {
        if (itemsToShow >= filtrados.length) {
            paginationContainer.classList.add('hidden');
        } else {
            paginationContainer.classList.remove('hidden');
        }
    }
}

// NUEVA: Función para el botón "Cargar Más"
function loadMore() {
    itemsToShow += 12; // Aumentamos de 12 en 12
    renderGrid();
}

// --- 4. GESTIÓN CARRITO ---
function addToCart(nombre, precio, img, editorial, barras) {
    const itemExistente = carrito.find(item => item.barras === barras);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ nombre, precio, img, editorial, barras, cantidad: 1 });
    }
    updateCartUI();
    showNotification(`¡${nombre} en la cesta! 🌿`);
}

function removeFromCart(barras) {
    const index = carrito.findIndex(item => item.barras === barras);
    if (index !== -1) {
        if (carrito[index].cantidad > 1) {
            carrito[index].cantidad -= 1;
        } else {
            carrito.splice(index, 1);
        }
    }
    updateCartUI();
}

function procesarCupon() {
    const input = document.getElementById('input-cupon');
    if (!input) return;
    const resultado = validarDescuento(input.value);
    if (resultado.valido) {
        descuentoAplicado = resultado.porcentaje;
        showNotification(resultado.mensaje);
    } else {
        descuentoAplicado = 0;
        showNotification("Código inválido o expirado ❌");
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const montoDescuento = subtotal * (descuentoAplicado / 100);
    const totalFinal = subtotal - montoDescuento;

    if (countEl) countEl.innerText = carrito.reduce((sum, p) => sum + p.cantidad, 0);

    if (totalEl) {
        if (descuentoAplicado > 0) {
            totalEl.innerHTML = `
                <div class="text-right">
                    <span class="text-xs line-through text-gray-400 font-normal block">$${subtotal.toFixed(2)}</span>
                    <span class="text-[#0F5F5F]">$${totalFinal.toFixed(2)}</span>
                    <p class="text-[10px] text-green-600 font-bold uppercase">Desc. ${descuentoAplicado}% Aplicado</p>
                </div>`;
        } else {
            totalEl.innerText = `$${totalFinal.toFixed(2)}`;
        }
    }

    if (container) {
        container.innerHTML = carrito.map((item) => `
            <div class="flex gap-4 items-center bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                <div class="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="${item.img}" class="w-full h-full object-cover">
                </div>
                <div class="flex-grow">
                    <h5 class="font-bold text-sm text-[#0F5F5F] leading-tight">${item.nombre}</h5>
                    <p class="text-[10px] font-black text-[#1B8A8F] uppercase">${item.editorial}</p>
                    <p class="text-[9px] text-gray-400 font-bold">Cod: ${item.barras}</p>
                    <p class="font-black text-[#111] mt-1">$${item.precio.toFixed(2)} <span class="text-[#0F5F5F] text-xs ml-1">x${item.cantidad}</span></p>
                </div>
                <button onclick="removeFromCart('${item.barras}')" class="text-red-400 p-2 text-xl">&times;</button>
            </div>
        `).join('');
    }
}

// --- 5. INTERFAZ ---
function toggleCart() { 
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.toggle('hidden'); 
}

function updateDeliveryFields() {
    const method = document.getElementById('delivery-method').value;
    const extra = document.getElementById('extra-fields');
    if (extra) extra.classList.toggle('hidden', method !== 'envio');
}

function showNotification(mensaje) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = "fixed top-24 right-6 z-[200] bg-[#0F5F5F] text-white px-6 py-4 rounded-2xl border-2 border-[#FFD54A] font-bold animate-bounce";
    toast.innerText = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- GENERADOR DE NÚMERO DE PEDIDO (Formato: 16MAR2601) ---
function generarNumeroPedido() {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString().slice(-2);
    // Usamos el tamaño del carrito + un random para el correlativo de 2 dígitos
    const correlativo = (carrito.length + Math.floor(Math.random() * 90) + 1).toString().padStart(2, '0');
    
    return `${dia}${mes}${anio}${correlativo}`;
}

function sendWhatsApp() {
    if (carrito.length === 0) return alert("¡Tu cesta está vacía!");
    
    const nombreCliente = document.getElementById('client-name').value.trim();
    if (!nombreCliente) return alert("Por favor, ingresa el nombre de quien recibe.");

    const numPedido = generarNumeroPedido();
    const fechaActual = new Date().toLocaleDateString('en-US'); // Formato MM/DD/YYYY según tu ejemplo
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const montoDescuento = subtotal * (descuentoAplicado / 100);
    const totalFinal = subtotal - montoDescuento;
    const delivery = document.getElementById('delivery-method').options[document.getElementById('delivery-method').selectedIndex].text;

    // --- CONSTRUCCIÓN DEL DETALLE LIMPIO ---
    const itemsMsg = carrito.map(p => {
        return `*${p.nombre}*, ${p.editorial}\nCód. ${p.barras}\n${p.cantidad} x $${p.precio.toFixed(2)}`;
    }).join('\n\n');

    // --- FORMATO FINAL DEL MENSAJE ---
    const mensaje = `*Manga Collector*
"Tu rincón del manga en la UP"

Multiservicios AR
*Fecha:* ${fechaActual}
*Número de pedido:* ${numPedido}
*Destinatario:* ${nombreCliente}

*Detalle de compra:*

${itemsMsg}

*Sub-total:* $ ${subtotal.toFixed(2)}
*Descuento:* $ ${montoDescuento.toFixed(2)}
*Total:* $ ${totalFinal.toFixed(2)}

*Métodos de pago:* - Yappy
 - Efectivo
 - Transferencia

*Tipo de entrega:* ${delivery.toUpperCase()}

¡Gracias por tu compra!
** Envía tu comprobante aquí **`;

    // Abrir WhatsApp con el mensaje codificado
    window.open(`https://wa.me/50764221421?text=${encodeURIComponent(mensaje)}`, '_blank');
}
function aplicarDescuentoAutomatico() {
    // Usamos directamente la constante del archivo descuentos.js
    if (typeof CONFIG_DESCUENTOS !== 'undefined') {
        const resultado = validarDescuento(CONFIG_DESCUENTOS.codigoActivo);
        if (resultado && resultado.valido) {
            descuentoAplicado = resultado.porcentaje;
            console.log(`Descuento automático del ${descuentoAplicado}% activado.`);
            // No mostramos notificación aquí para no molestar al entrar, 
            // pero el precio ya aparecerá con el descuento en el carrito.
        }
    }
}
window.onload = cargarDatos;

// --- LÓGICA DE LA BARRA: SLIDER ESTÁTICO (FADE) ---
function iniciarPromoSliderFade() {
    const bar = document.getElementById('promo-bar');
    const content = document.getElementById('promo-content');
    let currentIndex = 0;

    const mensajes = [
        { 
            html: '🌸 PRÓXIMA PARADA: <span class="text-white uppercase">MedMarket </span> • ENVIAMOS A TODO PANAMÁ 🇵🇦',
            bg: '#0F5F5F', // Verde Boticaria
            text: '#FFD54A' 
        },
        { 
            html: '🎉 ¡PROMO DE INAUGURACIÓN: <span class="bg-[#0F5F5F] text-white px-2 py-0.5 rounded ml-1 uppercase">20% OFF</span> EN TODO!',
            bg: '#FFD54A', 
            text: '#0F5F5F' 
        },
        { 
            html: '⏰ HORARIO: <span class="text-white uppercase">Lunes a Sábado • 9:00 AM - 6:00 PM</span>',
            bg: '#0F5F5F', 
            text: '#FFD54A' 
        },
        { 
            html: '<a href="https://wa.me/50764221421" target="_blank" class="text-white no-underline hover:opacity-80 transition-opacity">💬 ¿DUDAS? <span class="underline decoration-2">CHATEA CON NOSOTROS</span> 🌿</a>',
            bg: '#1B8A8F', 
            text: '#FFFFFF' 
        },
        { 
        html: '✨ <span class="uppercase text-[#FFD54A]">¡Estamos mejorando el sitio web! </span>Muy pronto verás todas las imágenes de los productos. ',
        bg: '#0F5F5F', 
        text: '#FFFFFF' 
    },
    ];

    if (!bar || !content) return;

    function cambiarMensaje() {
        // 1. Desvanecer texto actual
        content.classList.remove('fade-in');
        content.classList.add('fade-out');

        setTimeout(() => {
            const data = mensajes[currentIndex];

            // 2. Cambiar colores y contenido mientras es invisible
            bar.style.backgroundColor = data.bg;
            bar.style.color = data.text;
            content.innerHTML = data.html;

            // 3. Mostrar nuevo mensaje
            content.classList.remove('fade-out');
            content.classList.add('fade-in');

            currentIndex = (currentIndex + 1) % mensajes.length;
        }, 600); // Espera a que termine el fade-out
    }

    // Iniciar el ciclo
    cambiarMensaje();
    setInterval(cambiarMensaje, 5000); // Cambia cada 5 segundos
}

// Llamar en el onload
window.addEventListener('load', () => {
    if(typeof cargarDatos === 'function') cargarDatos();
    iniciarPromoSliderFade();
});

// --- 3. REDIRIGIR AL CHECKOUT (PÁGINA NUEVA) ---
function irAlCheckout() {
    // 1. Validar que el carrito no esté vacío
    if (carrito.length === 0) return alert("¡Tu cesta está vacía!");

    // 2. Capturar los datos del modal del carrito
    const nombreCliente = document.getElementById('client-name').value.trim();
    const entregaSeleccionada = document.getElementById('delivery-method');
    const textoEntrega = entregaSeleccionada.options[entregaSeleccionada.selectedIndex].text;

    // 3. Validar que puso un nombre
    if (!nombreCliente) {
        alert("Por favor, dinos quién recibe el pedido.");
        document.getElementById('client-name').focus();
        return;
    }

    // 4. Calcular montos
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const montoDescuento = subtotal * (descuentoAplicado / 100);

    // 5. Crear el objeto de datos incluyendo lo que pediste
    const checkoutData = {
        items: carrito,
        subtotal: subtotal,
        descuento: montoDescuento,
        total: subtotal - montoDescuento,
        numPedido: generarNumeroPedido(),
        cliente: nombreCliente, // <--- AQUÍ SE GUARDA EL NOMBRE
        metodoEntrega: textoEntrega // <--- AQUÍ SE GUARDA LA ENTREGA
    };
    
    // 6. Guardar en localStorage y saltar
    localStorage.setItem('manga_checkout', JSON.stringify(checkoutData));
    window.location.href = 'checkout.html';
}