const Cart = require("../model/Cart");
const Product = require("../model/Product");

/* GET CART */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );
    console.log("Fetched cart:", cart);
    res.json(cart || { user: req.user.id, items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ADD TO CART */
exports.addToCart = async (req, res) => {
  try {
    const { productId, qty = 1, size, color } = req.body;

    const selectedSize = size || null;
    const selectedColor = color || null;

    // validate product & stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.stock || product.stock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // new cart: just ensure requested qty <= stock
      if (qty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} item(s) available in stock` });
      }

      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, size: selectedSize, color: selectedColor, quantity: qty }]
      });

      return res.json(cart);
    }

    // total quantity in cart for this product (all sizes/colors)
    const currentTotalForProduct = cart.items.reduce((sum, i) => {
      return i.product.toString() === productId ? sum + (i.quantity || 0) : sum;
    }, 0);

    if (currentTotalForProduct + qty > product.stock) {
      const remaining = Math.max(product.stock - currentTotalForProduct, 0);
      return res
        .status(400)
        .json({
          message:
            remaining > 0
              ? `Only ${remaining} more item(s) available in stock`
              : "No more stock available for this product",
        });
    }

    // match on product + size + color so variants become separate lines
    const item = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        String(i.size || "") === String(selectedSize || "") &&
        String(i.color || "") === String(selectedColor || "")
    );

    if (item) {
      item.quantity += qty;
      console.log("Updated quantity for item:", item);
    } else {
      cart.items.push({ product: productId, size: selectedSize, color: selectedColor, quantity: qty });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("Error in addToCart:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE QUANTITY */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, qty, size, color } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // use same matching logic as addToCart (product + size + color)
    const selectedSize = size || null;
    const selectedColor = color || null;

    const item = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        String(i.size || "") === String(selectedSize || "") &&
        String(i.color || "") === String(selectedColor || "")
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = qty;
    await cart.save();

    // Populate product data before sending response
    await cart.populate("items.product");

    console.log("Updated item quantity:", item);
    res.json(cart);
  } catch (err) {
    console.error("Error in updateCartItem:", err);
    res.status(500).json({ message: err.message });
  }
};

/* REMOVE ITEM */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color } = req.query; // receive from query for reliability

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const selectedSize = size || null;
    const selectedColor = color || null;

    // find exact variant index (product + size + color)
    const index = cart.items.findIndex(
      (i) =>
        i.product.toString() === productId &&
        String(i.size || "") === String(selectedSize || "") &&
        String(i.color || "") === String(selectedColor || "")
    );

    if (index === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    cart.items.splice(index, 1);
    await cart.save();
    await cart.populate("items.product");

    console.log("Removed item. Updated cart:", cart);
    res.json(cart);
  } catch (err) {
    console.error("Error in removeFromCart:", err);
    res.status(500).json({ message: err.message });
  }
};

/* CLEAR CART AFTER ORDER */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } },
      { new: true }
    );
    return res.json(cart || { user: req.user.id, items: [] });
  } catch (err) {
    console.error("Error in clearCart:", err);
    return res.status(500).json({ message: err.message });
  }
};
