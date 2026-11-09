// Ijan: Controller = reads the request, validates/sanitizes, calls the Model, sends the response.
const User = require('../models/userModel');
const Audit = require('../models/auditModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, clean, isEmail } = require('../utils/validate');
const { hash, verify } = require('../utils/password');
const { signToken, isAdmin } = require('../middleware/auth');

exports.register = asyncHandler(async (req, res) => {
  required(req.body, ['username', 'full_name', 'email', 'password']);
  const username = clean(req.body.username);
  const full_name = clean(req.body.full_name);
  const email = clean(req.body.email).toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) throw new AppError('Username must be 3-30 letters, numbers or _', 400);
  if (!isEmail(email)) throw new AppError('Email is not valid', 400);
  if (String(req.body.password).length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const id = await User.create({ username, full_name, email, password_hash: hash(String(req.body.password)) });
  await Audit.log(id, 'REGISTER', 'users', id);
  res.status(201).json({ success: true, data: await User.findById(id) });
});

exports.login = asyncHandler(async (req, res) => {
  required(req.body, ['username', 'password']);
  const user = await User.findByUsername(clean(req.body.username));
  if (!user || !user.is_active || !verify(String(req.body.password), user.password_hash)) {
    throw new AppError('Invalid username or password', 401);
  }
  const roles = await User.getRoles(user.id);
  const token = signToken({ id: user.id, username: user.username, roles });
  await Audit.log(user.id, 'LOGIN', 'users', user.id);
  res.status(200).json({ success: true, token, data: { id: user.id, username: user.username, full_name: user.full_name, roles } });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const rows = await User.findAllWithRoles();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getUser = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (id !== req.user.id && !isAdmin(req.user)) throw new AppError('You can only view your own profile', 403);
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, data: { ...user, roles: await User.getRoles(id) } });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (id !== req.user.id && !isAdmin(req.user)) throw new AppError('You can only edit your own profile', 403);
  if (!(await User.findById(id))) throw new AppError('User not found', 404);
  const { full_name, email } = req.body;
  if (full_name === undefined && email === undefined) throw new AppError('Provide full_name and/or email', 400);
  const data = {};
  if (full_name !== undefined) { required(req.body, ['full_name']); data.full_name = clean(full_name); }
  if (email !== undefined) {
    if (!isEmail(email)) throw new AppError('Email is not valid', 400);
    data.email = clean(email).toLowerCase();
  }
  await User.update(id, data);
  await Audit.log(req.user.id, 'UPDATE_USER', 'users', id);
  res.status(200).json({ success: true, data: await User.findById(id) });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (id === req.user.id) throw new AppError('You cannot deactivate your own account', 400);
  if (!(await User.findById(id))) throw new AppError('User not found', 404);
  await User.deactivate(id);
  await Audit.log(req.user.id, 'DEACTIVATE_USER', 'users', id);
  res.status(200).json({ success: true, message: `User ${id} deactivated` });
});
