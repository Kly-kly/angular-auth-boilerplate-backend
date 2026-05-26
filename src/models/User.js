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

  static async updateResetToken(email, token, expires) {
    await db.execute('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?', [token, expires, email]);
  }

  static async resetPassword(token, newPassword) {
    const [result] = await db.execute(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE resetToken = ? AND resetTokenExpires > NOW()',
      [newPassword, token]
    );
    return result.affectedRows > 0;
  }

  static async updateRefreshTokens(id, refreshTokens) {
    const tokensString = JSON.stringify(refreshTokens || []);
    await db.execute('UPDATE users SET refreshTokens = ? WHERE id = ?', [tokensString, id]);
  }

  static async updateUser(id, userData) {
    const { title, firstName, lastName, email, role, password } = userData;
    if (password && password.trim() !== '') {
      await db.execute(
        'UPDATE users SET title = ?, firstName = ?, lastName = ?, email = ?, role = ?, password = ? WHERE id = ?',
        [title, firstName, lastName, email, role, password, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET title = ?, firstName = ?, lastName = ?, email = ?, role = ? WHERE id = ?',
        [title, firstName, lastName, email, role, id]
      );
    }
  }

  static async deleteUser(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async getAll() {
    const [rows] = await db.execute('SELECT id, title, firstName, lastName, email, role, isVerified, createdAt FROM users');
    return rows;
  }
}

module.exports = User;