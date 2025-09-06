// ========= Configuración de descuento Duoc =========
const DUOC_DOMAINS = ['duoc.cl', 'duocuc.cl', 'alumnos.duoc.cl', 'mail.duoc.cl'];
const DUOC_DISCOUNT = 0.20; // 20%

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initAddToCartButtons();
  initCategoryShortcuts();
  initRegistroFormValidation();

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
    clearError(nombre); 
    if (!nombre.value || nombre.value.trim().length < 2)
      { setError(nombre,'Manco debes ingresar tu nombre '); ok=false; 
        document.querySelector('.field__hint').classList.add('visible');
      } 
    else
      { document.querySelector('.field__hint').classList.remove('visible'); }

    clearError(email); 
     if (!email.value || !validEmail(email.value))
      { setError(email,'Manco el mail ingresado no es válido.'); ok=false;  
       
      } 
      

     

    clearError(edad);   const n = Number(edad.value);
    if (!edad.value || Number.isNaN(n)){ setError(edad,'Manco solo se permiten números'); ok=false; }
    else if (n < 18|| n >= 60)
        { setError(edad,'La edad debe estar entre 18 y 60 años.'); ok=false; }

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
    
    alert('Manco Registrado con exito. ¡Gracias por registrarte!');

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
          Cantidad: ${it.cantidad} • Precio: $${it.precio.toLocaleString('es-CL')}<br/>
		      <a href="#" class="btn-eliminar" data-codigo="${it.codigo}">Eliminar Item</a>
		  
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

  // Se agrega evento para eliminar items del carrito de compra
const deleteButtons = cont.querySelectorAll('.btn-eliminar');
deleteButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const codigo = e.currentTarget.dataset.codigo;
    removeFromCart(codigo);
  });
});

  function removeFromCart(codigo){
  let cart = getCart();
  //alert('El item con código ' + codigo + ' será eliminado del carrito.');
  // Filtra el producto fuera del carrito
  cart = cart.filter(it => it.codigo !== codigo);
  saveCart(cart);
  updateCartBadge();
  renderCart();
  announce('Producto eliminado del carrito.');
}




}
