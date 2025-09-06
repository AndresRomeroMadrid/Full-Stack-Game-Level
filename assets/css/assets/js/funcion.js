// ========= Configuración de descuento Duoc =========
const DUOC_DOMAINS = ['duoc.cl', 'duocuc.cl', 'alumnos.duoc.cl', 'mail.duoc.cl'];
const DUOC_DISCOUNT = 0.20; // 20%

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initAddToCartButtons();
  initCategoryShortcuts();
  initRegistroFormValidation();
  initCategoryCarousel();   // Carrusel de categorías

  // Si estamos en carrito.html, renderizamos
  if (location.pathname.endsWith('carrito.html')) {
    renderCart();
  }
});

/* ====== Carrito en localStorage ====== */
function getCart(){
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); }
  catch { return []; }
}
function saveCart(cart){
  localStorage.setItem('cart', JSON.stringify(cart));
}
function addToCart(item){
  const cart = getCart();
  const idx = cart.findIndex(p => p.codigo === item.codigo);
  if (idx >= 0){ cart[idx].cantidad += 1; }
  else { cart.push({...item, cantidad: 1}); }
  saveCart(cart);
  updateCartBadge();
}
function emptyCart(){
  localStorage.removeItem('cart');
  updateCartBadge();
}
function countCartItems(){
  return getCart().reduce((acc, it) => acc + (it.cantidad || 0), 0);
}
function updateCartBadge(){
  const badge = document.getElementById('cart-badge');
  if (badge){ badge.textContent = String(countCartItems()); }
}

/* ====== Botones "Agregar" ====== */
function initAddToCartButtons(){
  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.product');
      if (!card) return;
      const item = {
        codigo: card.dataset.codigo,
        nombre: card.dataset.nombre,
        precio: Number(card.dataset.precio || 0)
      };
      addToCart(item);
      announce(`${item.nombre} agregado al carrito. Total items: ${countCartItems()}.`);
    });
  });
}

/* ====== Atajos de categorías (Inicio -> Catálogo con ?cat=) ====== */
function initCategoryShortcuts(){
  const cats = document.querySelectorAll('.cat');
  cats.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.cat || '';
      window.location.href = `catalogo.html?cat=${encodeURIComponent(cat)}`;
    });
  });
}

/* ====== Carrusel controlado por el usuario (categorías) ===== */
function initCategoryCarousel(){
  const wrap  = document.querySelector('[data-carousel="cats"]');
  if (!wrap) return;

  const track = wrap.querySelector('.carousel');
  const prev  = wrap.querySelector('.carousel-btn--prev');
  const next  = wrap.querySelector('.carousel-btn--next');

  // Cálculo dinámico del paso: ancho de tarjeta + gap
  const firstCard = track.querySelector('.cat');
  const style = getComputedStyle(track);
  const gap = parseInt(style.columnGap || style.gap || '16', 10);
  const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 280;
  const STEP = cardWidth + gap;

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };

  const scrollByStep = (dir) => {
    track.scrollBy({ left: dir * STEP, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByStep(-1));
  next.addEventListener('click', () => scrollByStep(1));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  // Arrastre con el mouse/touch (drag to scroll)
  let isDown = false, startX = 0, startLeft = 0, moved = 0;
  track.addEventListener('pointerdown', (e) => {
    isDown = true;
    moved = 0;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    moved += Math.abs(dx);
    track.scrollLeft = startLeft - dx;
  });
  track.addEventListener('pointerup', () => {
    isDown = false;
    track.classList.remove('is-dragging');
  });

  // Evita que un drag dispare click accidental en la tarjeta
  track.addEventListener('click', (e) => {
    if (moved > 5) e.preventDefault();
  }, true);

  update();
}

/* ====== Aria-live accesible ====== */
let live = null;
function announce(text){
  if (!live){
    live = document.createElement('div');
    live.setAttribute('aria-live','polite');
    live.setAttribute('aria-atomic','true');
    live.style.position='fixed';
    live.style.left='-9999px';
    document.body.appendChild(live);
  }
  live.textContent = text;
}

/* ====== Registro: validación 18+ y bandera Duoc ====== */
function isDuocEmail(email){
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return DUOC_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
}

function initRegistroFormValidation(){
  const form = document.getElementById('form-registro');
  if (!form) return;

  const $ = (sel) => form.querySelector(sel);
  const nombre = $('#nombre');
  const email  = $('#email');
  const edad   = $('#edad');
  const tyc    = $('#tyc');

  const setError = (input,msg)=>{ const f=input.closest('.field'); const h=f?.querySelector('.field__hint'); f?.classList.add('field--error'); if(h){h.textContent=msg;} };
  const clearError = (input)=>{ const f=input.closest('.field'); const h=f?.querySelector('.field__hint'); f?.classList.remove('field--error'); if(h){h.textContent='';} };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(){
    let ok = true;
    clearError(nombre); if (!nombre.value || nombre.value.trim().length < 2){ setError(nombre,'Ingresa tu nombre (mín 2).'); ok=false; }
    clearError(email);  if (!email.value || !validEmail(email.value)){ setError(email,'Ingresa un email válido.'); ok=false; }
    clearError(edad);   const n = Number(edad.value);
    if (!edad.value || Number.isNaN(n)){ setError(edad,'Ingresa tu edad (número).'); ok=false; }
    else if (n < 18){ setError(edad,'Debes ser mayor de 18 años.'); ok=false; }
    if (!tyc.checked){ setError(tyc,'Debes aceptar los términos.'); ok=false; } else { clearError(tyc); }
    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()){
      announce('El formulario tiene errores. Revisa los campos marcados.');
      return;
    }

    const emailValue = email.value.trim();
    if (isDuocEmail(emailValue)){
      localStorage.setItem('duocDiscountPct', String(DUOC_DISCOUNT)); // "0.2"
      localStorage.setItem('duocEmail', emailValue);
      announce('Registro OK. Descuento Duoc (20%) activado.');
    } else {
      localStorage.removeItem('duocDiscountPct');
      localStorage.removeItem('duocEmail');
      announce('Registro OK.');
    }

    form.reset();
  });
}

/* ====== Carrito: render con descuento ====== */
function getDuocDiscount(){
  const pct = Number(localStorage.getItem('duocDiscountPct'));
  return Number.isFinite(pct) && pct > 0 ? pct : 0;
}

function renderCart(){
  const cart = getCart();
  const cont = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const discountEl = document.getElementById('discount');
  const totalEl    = document.getElementById('total');
  const btnVaciar  = document.getElementById('btn-vaciar');

  if (cont){
    cont.innerHTML = '';
    if (cart.length === 0){
      cont.innerHTML = '<p class="muted">Tu carrito está vacío.</p>';
    } else {
      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      cart.forEach(it => {
        const li = document.createElement('li');
        li.className = 'card';
        li.style.marginBottom = '8px';
        li.innerHTML = `
          <strong>${it.nombre}</strong><br/>
          Cantidad: ${it.cantidad} • Precio: $${it.precio.toLocaleString('es-CL')}
        `;
        ul.appendChild(li);
      });
      cont.appendChild(ul);
    }
  }

  const subtotal = cart.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const duocPct  = getDuocDiscount();
  const discount = Math.round(subtotal * duocPct);
  const total    = Math.max(0, subtotal - discount);

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CL')}`;
  if (discountEl) discountEl.textContent = duocPct > 0 ? `- $${discount.toLocaleString('es-CL')} (Duoc 20%)` : '$0';
  if (totalEl)    totalEl.textContent    = `$${total.toLocaleString('es-CL')}`;

  if (btnVaciar){
    btnVaciar.onclick = () => {
      emptyCart();
      renderCart();
      announce('Carrito vaciado.');
    };
  }
}
