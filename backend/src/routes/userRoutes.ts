import express from 'express';
import { register, login, getProfile, listUsers, deleteUser, updateUser, addUser, listAgents } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);

// Kullanıcı yönetimi (sadece manager)
router.get('/', auth, listUsers);
router.post('/', auth, addUser);
router.delete('/:id', auth, deleteUser);
router.put('/:id', auth, updateUser);
router.get('/agents', listAgents);

export default router; 