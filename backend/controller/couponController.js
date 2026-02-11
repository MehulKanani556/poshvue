const { Coupon } = require('../model');

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

    const coupons = await Coupon.find({
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
    }).sort("-createdAt");

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
    const item = await Coupon.create(body);
    return res.status(201).json({ item });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = mapAdminToCoupon(req.body);
    const item = await Coupon.findByIdAndUpdate(req.params.id, body, { new: true });
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
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      active: true
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    const now = new Date();

    // Check if coupon has expired
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Check if coupon has started
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ message: 'Coupon is not yet active' });
    }

    // Check if max uses reached
    if (coupon.maxUses > 0 && coupon.used >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (subtotal * coupon.amount) / 100;
    } else {
      discountAmount = coupon.amount;
    }

    // Don't allow discount more than subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        amount: coupon.amount,
        conditions: coupon.conditions || "",
        discountAmount: discountAmount
      }
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};