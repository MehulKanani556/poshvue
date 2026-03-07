const { Wholesale } = require('../model');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      Wholesale.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      Wholesale.countDocuments(query),
    ]);
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await Wholesale.create(req.body);
    return res.status(201).json({ item });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Wholesale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item, message: 'Wholesale partner updated successfully' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Wholesale.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Wholesale partner deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};