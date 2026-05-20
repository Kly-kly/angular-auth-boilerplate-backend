const User = require('../models/User');

const getAccounts = async (req, res) => {
  try {
    const accounts = await User.getAll();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await User.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAccounts, getAccountById };