const db = require('../config/database');

class User {
  static async create(userData) {
    const { title, firstName, lastName, email, password, role, verificationToken } = userData;
    const [result] = await db.execute(
      `INSERT INTO users (title, firstName, lastName, email, password, role, verificationToken, isVerified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, firstName, lastName, email, password, role || 'User', verificationToken, false]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT id, title, firstName, lastName, email, role, isVerified, createdAt FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async verifyEmail(token) {
    const [result] = await db.execute('UPDATE users SET isVerified = TRUE, verificationToken = NULL WHERE verificationToken = ?', [token]);
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await db.execute('SELECT id, title, firstName, lastName, email, role, isVerified, createdAt FROM users');
    return rows;
  }

  static async deleteUser(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = User;