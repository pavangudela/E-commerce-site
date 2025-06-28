let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const stripe = Stripe("pk_test_51RdoC1P3aid1IbCWoG0RI8IjYWoklW83Hy05KpUNcUUOxgOJEWrCHkPQRMRCv1XrJtocFLld463fXeSe7XUJbTIE008BOfkvOl");
// ✅ Fetch products from backend
async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:8080/api/products");
    allProducts = await response.json();
    displayProducts(allProducts);
    updateCartUI();
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function displayProducts(products) {
  const productList = document.getElementById("product-list");
  if (!productList) return;

  productList.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = ` 
      <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: ₹${product.price}</p>
      <p>In Stock: ${product.quantity}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    productList.appendChild(card);
  });
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    });
  }

  saveCart();
  updateCartUI();
}

function updateCartCountOnly() {
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `(${count})`;
  }
}

function updateCartUI() {
  const cartContainer = document.getElementById("cart-items");
  const totalSpan = document.getElementById("total");

  updateCartCountOnly();

  if (!cartContainer || !totalSpan) return;

  cartContainer.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const card = document.createElement("div");
    card.className = "cart-card";
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}">
      <div>
        <h4>${item.name}</h4>
        <p>Price: ₹${item.price}</p>
        <p>Quantity: 
          <button onclick="changeQuantity(${item.id}, -1)">−</button>
          ${item.quantity}
          <button onclick="changeQuantity(${item.id}, 1)">+</button>
        </p>
        <button onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    `;
    cartContainer.appendChild(card);

    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    total += price * quantity;
  });

  totalSpan.textContent = total;
  totalSpan.classList.add("animated");
  setTimeout(() => totalSpan.classList.remove("animated"), 300);
}

function changeQuantity(productId, delta) {
  const item = cart.find(p => p.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(p => p.id !== productId);
  saveCart();
  updateCartUI();
}

function filterByCategory(category) {
  const filtered = category === 'All'
    ? allProducts
    : allProducts.filter(p => p.category === category);
  displayProducts(filtered);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ✅ FINAL checkout function (redirects to Stripe)
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
fetch("http://localhost:8080/api/payment/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cart),
})
.then(res => res.json())
.then(data => {
  if (data.url) {
    window.location.href = data.url;  // ✅ redirect to Stripe
  } else {
    alert("Payment session failed.");
  }
})
.catch(err => {
  console.error("Payment Error:", err);
  alert("Something went wrong!");
});

}

// ✅ On page load
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
