const { Coupon, Cart, Order, Product } = require('../model');

function mapAdminToCoupon(payload) {
  const body = { ...payload };
  // type (Percentage/Fixed) -> discountType ('percentage'|'fixed')
  if (body.type !== undefined) {
    const t = String(body.type).trim().toLowerCase();
    body.discountType = t === 'percent' ? 'percent' : 'fixed';
    delete body.type;
  }
  // discount -> amount (number)
  if (body.discount !== undefined) {
    const amt = Number(body.discount);
    if (!Number.isNaN(amt)) body.amount = amt;
    delete body.discount;
  }
  // expiryDate -> endDate (Date)
  if (body.expiryDate !== undefined) {
    const d = new Date(body.expiryDate);
    if (!Number.isNaN(d.getTime())) body.endDate = d;
    delete body.expiryDate;
  }
  // status -> active (boolean)
  if (typeof body.status === 'string') {
    body.active = body.status === 'Active';
    delete body.status;
  }
  // normalize maxUses to number if provided
  if (body.maxUses !== undefined) {
    const m = Number(body.maxUses);
    if (!Number.isNaN(m)) body.maxUses = m; else delete body.maxUses;
  }
  // trim code if provided
  if (typeof body.code === 'string') {
    body.code = body.code.trim();
  }
  // conditions: keep as string (admin provided description or rule text)
  if (body.conditions !== undefined) {
    if (body.conditions === null) delete body.conditions;
    else body.conditions = String(body.conditions).trim();
  }
  // rules: validate and normalize rules array if provided
  if (Array.isArray(body.rules)) {
    body.rules = body.rules
      .filter(r => r && r.type) // only include rules with a type
      .map(r => ({
        type: String(r.type).trim(),
        value: r.value !== undefined ? r.value : null,
        productId: r.productId ? String(r.productId).trim() : undefined,
        categories: Array.isArray(r.categories) ? r.categories.map(c => String(c).trim()) : undefined,
        products: Array.isArray(r.products) ? r.products.map(p => String(p).trim()) : undefined,
        from: r.from ? new Date(r.from) : undefined,
        to: r.to ? new Date(r.to) : undefined,
        name: r.name ? String(r.name).trim() : undefined,
      }))
      .filter(r => Object.keys(r).length > 1); // exclude rules with only type
  }
  // allowedCountries: array of country codes (e.g. ["IN", "SG"]). Empty = valid for all countries.
  if (body.allowedCountries !== undefined) {
    if (!Array.isArray(body.allowedCountries)) {
      body.allowedCountries = [];
    } else {
      body.allowedCountries = body.allowedCountries
        .map(c => (typeof c === 'string' ? c.trim().toUpperCase() : String(c).trim().toUpperCase()))
        .filter(Boolean);
    }
  }
  return body;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const [items, total] = await Promise.all([
      Coupon.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      Coupon.countDocuments(query),
    ]);
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.listActive = async (req, res) => {
  try {
    const now = new Date();
    const countryCode = (req.query.countryCode || "").trim().toUpperCase();

    const query = {
      active: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      ],
      $expr: {
        $or: [
          { $eq: ["$maxUses", 0] },
          { $lt: ["$used", "$maxUses"] }
        ]
      }
    };

    // If countryCode provided, return only coupons valid for that country (allowedCountries empty or contains code)
    if (countryCode) {
      query.$and = [
        {
          $or: [
            { allowedCountries: { $exists: false } },
            { allowedCountries: { $size: 0 } },
            { allowedCountries: countryCode }
          ]
        }
      ];
    }

    const coupons = await Coupon.find(query).sort("-createdAt");

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.get = async (req, res) => {
  try {
    const item = await Coupon.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = mapAdminToCoupon(req.body);
    // Require admin to provide a condition or rules when creating a coupon
    if (!body.conditions || String(body.conditions).trim() === "") {
      return res.status(400).json({ message: 'Condition / Notes is required when creating a coupon' });
    }
    const item = await Coupon.create(body);
    return res.status(201).json({ item });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = mapAdminToCoupon(req.body);
    // Update the coupon by id (admin edit)
    const item = await Coupon.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Coupon.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Validate coupon by code
exports.validate = async (req, res) => {
  try {
    const { code } = req.body;
    let { subtotal } = req.body;

    console.log("\n=== COUPON VALIDATION START ===");
    console.log("Request headers:", req.headers.authorization ? "Auth header present" : "No auth header");
    console.log("req.user:", req.user);
    console.log("req.user?.id:", req.user?.id);
    console.log("Coupon code:", code);
    console.log("Subtotal:", subtotal);

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Normalize subtotal
    let subtotalNum = 0;
    if (typeof subtotal === "string") {
      subtotalNum = Number(subtotal.replace(/[^0-9.]/g, "")) || 0;
    } else {
      subtotalNum = Number(subtotal) || 0;
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      active: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    const now = new Date();

    // Expiry check
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ message: "Coupon not active yet" });
    }

    if (coupon.maxUses > 0 && coupon.used >= coupon.maxUses) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Country restriction: if coupon has allowedCountries, request must send countryCode and it must be in the list
    const allowedCountries = coupon.allowedCountries || [];
    if (allowedCountries.length > 0) {
      const countryCode = (req.body.countryCode || "").trim().toUpperCase();
      if (!countryCode) {
        return res.status(400).json({ message: "Country is required to apply this coupon" });
      }
      if (!allowedCountries.includes(countryCode)) {
        return res.status(400).json({ message: "This coupon is not valid for your selected country" });
      }
    }

    // Fetch cart securely
    let cartItems = [];
    let cartProductIds = [];
    let cartCategoryIds = [];

    if (req.user?.id) {
      const cart = await Cart.findOne({ user: req.user.id })
        .populate({ path: "items.product", select: "_id categories" });

      if (cart?.items?.length) {
        cartItems = cart.items;
        cartProductIds = cart.items.map(i => String(i.product._id));
        cartCategoryIds = cart.items.flatMap(i =>
          (i.product.categories || []).map(String)
        );
      }
    }

    const ctx = {
      subtotal: subtotalNum,
      cartItems,
      cartProductIds,
      cartCategoryIds,
      userId: req.user?.id || null,
      getUserOrdersCount: async (uid) =>
        uid ? await Order.countDocuments({ user: uid }) : 0,
      getUserCouponUsageCount: async (uid) =>
        uid
          ? await Order.countDocuments({ user: uid, couponCode: coupon.code })
          : 0,
    };

    console.log("Coupon found:", coupon.code);
    console.log("Coupon rules:", coupon.rules);
    console.log("Context userId:", ctx.userId);
    
    if (ctx.userId) {
      // Get ALL orders for this user
      const allOrders = await Order.find({ user: ctx.userId }).select('_id code createdAt status');
      console.log(`\n[USER ORDERS QUERY]`);
      console.log(`UserId: ${ctx.userId}`);
      console.log(`Total Orders Found: ${allOrders.length}`);
      console.log(`Orders:`, allOrders.map(o => ({
        id: o._id,
        code: o.code,
        status: o.status,
        date: o.createdAt
      })));
      
      const orderCount = await ctx.getUserOrdersCount(ctx.userId);
      console.log(`\nOrder count via ctx function: ${orderCount}`);
    }

    const ruleCheck = await validateCouponRules(coupon, ctx);
    console.log("Rule validation result:", ruleCheck);
    if (!ruleCheck.ok) {
      console.log("=== COUPON VALIDATION FAILED ===\n");
      return res.status(400).json({ message: ruleCheck.message });
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discountType === "percent") {
      discountAmount = (subtotalNum * coupon.amount) / 100;
    } else {
      discountAmount = coupon.amount;
    }

    if (discountAmount > subtotalNum) {
      discountAmount = subtotalNum;
    }

    // Get dynamic usage data
    const userOrderCount = req.user?.id ? await ctx.getUserOrdersCount(req.user.id) : 0;
    const userCouponUsageCount = req.user?.id ? await ctx.getUserCouponUsageCount(req.user.id) : 0;

    console.log("=== COUPON VALIDATION SUCCESS ===");
    console.log("Discount amount:", discountAmount);
    console.log("User coupon usage count:", userCouponUsageCount);
    console.log("=== END ===\n");

    return res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        amount: coupon.amount,
        discountAmount,
      },
      usage: {
        totalUses: coupon.used,
        maxUses: coupon.maxUses,
        userUsageCount: userCouponUsageCount,
        userOrderCount: userOrderCount,
      },
    });

  } catch (err) {
    console.error("Coupon validation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

async function validateCouponRules(coupon, ctx) {
  const rules = coupon.rules || [];

  console.log(`\n[RULE VALIDATION] Total rules to check: ${rules.length}`);

  for (const r of rules) {
    console.log(`[RULE CHECK] Type: ${r.type}, Value: ${r.value}`);
    
    switch (r.type) {

      case "minSubtotal":
        if (ctx.subtotal < Number(r.value || 0)) {
          return { ok: false, message: `Minimum cart value ₹${r.value} required` };
        }
        break;

      case "firstTimeUser":
        if (r.value === true) {
          const count = await ctx.getUserOrdersCount(ctx.userId);
          if (count > 0) {
            return { ok: false, message: "Valid only for first-time users" };
          }
        }
        break;

      case "allowedCategories":
        if (!ctx.cartCategoryIds.some(cid => r.categories?.includes(cid))) {
          return { ok: false, message: "Coupon valid only for selected categories" };
        }
        break;

      case "excludedCategories":
        if (ctx.cartCategoryIds.some(cid => r.categories?.includes(cid))) {
          return { ok: false, message: "Coupon not valid for selected category items" };
        }
        break;

      case "requiredProducts":
        if (!r.products?.every(p => ctx.cartProductIds.includes(String(p)))) {
          return { ok: false, message: "Required product missing in cart" };
        }
        break;

      case "maxUsesPerUser":
        const used = await ctx.getUserCouponUsageCount(ctx.userId);
        if (used >= Number(r.value || 0)) {
          return { ok: false, message: "Coupon usage limit reached for user" };
        }
        break;

      case "dateRange":
        const now = new Date();
        if (r.from && new Date(r.from) > now) {
          return { ok: false, message: "Coupon not yet active" };
        }
        if (r.to && new Date(r.to) < now) {
          return { ok: false, message: "Coupon expired" };
        }
        break;

      case "minOrder":
        if (!ctx.userId) {
          console.log(`[RULE FAILED] minOrder: No user ID, user not logged in`);
          return { ok: false, message: "Please login to use this coupon" };
        }
        const minOrderCount = await ctx.getUserOrdersCount(ctx.userId);
        
        // Get detailed order info
        const minOrderDetails = await Order.find({ user: ctx.userId }).select('_id code status createdAt');
        console.log(`\n[RULE CHECK] minOrder:`);
        console.log(`  userId: ${ctx.userId}`);
        console.log(`  userOrderCount: ${minOrderCount}`);
        console.log(`  required: ${r.value}`);
        console.log(`  All Orders Found:`, minOrderDetails.map(o => ({
          id: o._id,
          code: o.code,
          status: o.status,
          date: o.createdAt
        })));
        
        if (minOrderCount < Number(r.value || 0)) {
          console.log(`[RULE FAILED] minOrder: ${minOrderCount} < ${r.value}`);
          return { ok: false, message: `Minimum ${r.value} orders required. You have ${minOrderCount} order(s).` };
        }
        console.log(`[RULE PASSED] minOrder`);
        break;

      case "maxOrder":
        if (!ctx.userId) {
          console.log(`[RULE FAILED] maxOrder: No user ID, user not logged in`);
          return { ok: false, message: "Please login to use this coupon" };
        }
        const maxOrderCount = await ctx.getUserOrdersCount(ctx.userId);
        
        // Get detailed order info
        const maxOrderDetails = await Order.find({ user: ctx.userId }).select('_id code status createdAt');
        console.log(`\n[RULE CHECK] maxOrder:`);
        console.log(`  userId: ${ctx.userId}`);
        console.log(`  userOrderCount: ${maxOrderCount}`);
        console.log(`  max: ${r.value}`);
        console.log(`  All Orders Found:`, maxOrderDetails.map(o => ({
          id: o._id,
          code: o.code,
          status: o.status,
          date: o.createdAt
        })));
        
        if (maxOrderCount >= Number(r.value || 0)) {
          console.log(`[RULE FAILED] maxOrder: ${maxOrderCount} >= ${r.value}`);
          return { ok: false, message: `Coupon valid only for users with less than ${r.value} orders. You have ${maxOrderCount} order(s).` };
        }
        console.log(`[RULE PASSED] maxOrder`);
        break;

      default:
        break;
    }
  }

  console.log(`[RULE VALIDATION PASSED] All rules passed successfully\n`);
  return { ok: true };
}

// Increment coupon usage and auto-deactivate if limit reached
exports.incrementCouponUsage = async (couponCode) => {
  try {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon) {
      console.log(`Coupon not found: ${couponCode}`);
      return { success: false, message: 'Coupon not found' };
    }

    // Increment usage count
    coupon.used += 1;
    
    // Check if usage limit reached and deactivate if so
    if (coupon.maxUses > 0 && coupon.used >= coupon.maxUses) {
      coupon.active = false;
      console.log(`Coupon ${couponCode} deactivated as usage limit reached (${coupon.used}/${coupon.maxUses})`);
    }

    await coupon.save();
    
    return { 
      success: true, 
      usage: coupon.used, 
      maxUses: coupon.maxUses,
      active: coupon.active,
      deactivated: coupon.maxUses > 0 && coupon.used >= coupon.maxUses
    };
  } catch (err) {
    console.error('Error incrementing coupon usage:', err);
    return { success: false, message: 'Server error' };
  }
};


