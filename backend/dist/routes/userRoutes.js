"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.post('/register', userController_1.register);
router.post('/login', userController_1.login);
// Protected routes
router.get('/profile', auth_1.auth, userController_1.getProfile);
// Kullanıcı yönetimi (sadece manager)
router.get('/', auth_1.auth, userController_1.listUsers);
router.post('/', auth_1.auth, userController_1.register);
router.delete('/:id', auth_1.auth, userController_1.deleteUser);
router.put('/:id', auth_1.auth, userController_1.updateUser);
router.get('/agents', userController_1.listAgents);
exports.default = router;
