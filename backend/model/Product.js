// ProductSchema definition (removing commented fields)
const mongoose = require('mongoose');

const ColorSchema = new mongoose.Schema(
  {
    name: { type: String },
    hex: { type: String },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String },
    images: [{ type: String }],
    colors: { type: [ColorSchema], default: [] },
    // available size options for this product (e.g. ["36","38","40"])
    sizes: { type: [String], default: [] },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5 },
    manufacturer: { type: String },
    fabric: { type: String },
    occasion: { type: String },
    washCare: { type: String },
    productType: { type: String },
    work: { type: String },
    length: { type: Number, default: 0 },
    breadth: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    // Country-wise pricing
    pricesByCountry: [{
      country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
      price: { type: Number, required: true },
      discountPercent: { type: Number, default: 0 },
      salePrice: { type: Number },
    }],
  },
  { timestamps: true }
);

/* 🔥 ADD INDEXES */
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ title: 1 });

module.exports = mongoose.model('Product', ProductSchema);
