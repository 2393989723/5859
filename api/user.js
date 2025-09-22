const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 连接 MongoDB（使用 Vercel 环境变量）
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// 用户模型
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  diamonds: { type: Number, default: 0 }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 登录接口
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  const { username, password } = req.body;
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: '密码错误' });
    }
    // 生成 JWT（密钥从 Vercel 环境变量获取）
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      user: { username: user.username, diamonds: user.diamonds },
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
