const productos = [
    { id: 1, nombre: "Arepas Clásicas", precio: 7000, desc: "5 unidades. Maíz pilado y sal, 100% artesanales." },
    { id: 2, nombre: "Arepas Premium", precio: 8000, desc: "5 unidades. Maiz Pilado, Queso mozzarella, leche, azúcar y saborizante." },
    { id: 3, nombre: "La Arepa Consentida", precio: 8000, desc: "5 unidades. Maiz Pilado, Queso mozzarella y sal, 100% artesanales." }
];

const productContainer = document.getElementById('product-container');

// Renderizado inicial
productos.forEach(p => {
    productContainer.innerHTML += `
        <div class="card">
            <h3>${p.nombre}</h3>
            <p>${p.desc}</p>
            <p class="price">$${p.precio.toLocaleString()}</p>
            <div style="margin-top:10px;">
                <label>Paquetes: </label>
                <input type="number" class="qty-input" data-id="${p.id}" value="0" min="1" oninput="actualizarTotales()">
            </div>
        </div>
    `;
});

function actualizarTotales() {
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(input => {
        const cant = parseInt(input.value) || 0;
        if (cant < 0) input.value = 0;
        const p = productos.find(prod => prod.id == input.dataset.id);
        total += (cant * p.precio);
    });
    document.getElementById('grand-total').innerText = `$${total.toLocaleString()}`;
}

// Modal logic
const orderModal = document.getElementById('order-modal');

document.getElementById('btn-open-modal').onclick = () => {
    let html = '';
    let total = 0;
    let valid = false;

    document.querySelectorAll('.qty-input').forEach(input => {
        const cant = parseInt(input.value) || 0;
        if (cant > 0) {
            const p = productos.find(prod => prod.id == input.dataset.id);
            const sub = cant * p.precio;
            html += `<p style="text-align:left;">• ${p.nombre} x${cant}: <b>$${sub.toLocaleString()}</b></p>`;
            total += sub;
            valid = true;
        }
    });

    if (!valid) return alert("Por favor selecciona al menos una cantidad.");

    document.getElementById('order-details-list').innerHTML = html;
    document.getElementById('modal-total-amount').innerText = `$${total.toLocaleString()}`;
    orderModal.style.display = 'flex';
};

function closeOrderModal() { orderModal.style.display = 'none'; }
function openZoom(src) { document.getElementById('img-zoom').src = src; document.getElementById('zoom-modal').style.display = 'flex'; }

// ENVÍO A GOOGLE SHEETS Y WHATSAPP
async function sendOrder() {
    const nombre = document.getElementById('client-name').value;
    const telefono = document.getElementById('client-phone').value;
    const googleSheetURL = "https://script.google.com/macros/s/AKfycbwy5t2cx3I7wDlImRO5H_o7sTQblKFaQlKclrw9ZynF6qCSi0xjqQdYexry7AFoT1ahfA/exec"; 

    if (!nombre || !telefono) return alert("Por favor completa tus datos.");

    // Inicializamos variables para el desglose
    let datosPedido = {
        clasica: { cant: 0, sub: 0 },
        premium: { cant: 0, sub: 0 },
        consentida: { cant: 0, sub: 0 }
    };
    
    let granTotal = 0;
    let waMsg = `*AREPAS LA NONNA - NUEVO PEDIDO*\nCliente: ${nombre}\n\n`;

    // Procesamos cada input para identificar el producto
    document.querySelectorAll('.qty-input').forEach(input => {
        const cant = parseInt(input.value) || 0;
        if (cant > 0) {
            const p = productos.find(prod => prod.id == input.dataset.id);
            const sub = cant * p.precio;
            granTotal += sub;
            waMsg += `✅ ${p.nombre} (x${cant}) - $${sub.toLocaleString()}\n`;

            // Mapeo según el nombre para la base de datos
            if (p.nombre.includes("Clásicas")) {
                datosPedido.clasica = { cant, sub };
            } else if (p.nombre.includes("Premium")) {
                datosPedido.premium = { cant, sub };
            } else if (p.nombre.includes("Consentida")) {
                datosPedido.consentida = { cant, sub };
            }
        }
    });

    if (granTotal === 0) return alert("Selecciona al menos un producto.");

    waMsg += `\n*TOTAL: $${granTotal.toLocaleString()}*`;

    // Estructura exacta para Google Sheets
    const payload = {
        fecha: new Date().toLocaleString(),
        nombre: nombre,
        telefono: telefono,
        cantClasica: datosPedido.clasica.cant,
        subClasica: datosPedido.clasica.sub,
        cantPremium: datosPedido.premium.cant,
        subPremium: datosPedido.premium.sub,
        cantConsentida: datosPedido.consentida.cant, 
        subConsentida: datosPedido.consentida.sub,
        total: granTotal
    };

    // Envío a Google Sheets
    fetch(googleSheetURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    });

    // Abrir WhatsApp
    window.open(`https://wa.me/573025990381?text=${encodeURIComponent(waMsg)}`, '_blank');
    closeOrderModal();
}