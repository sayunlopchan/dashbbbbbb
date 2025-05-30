const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

module.exports = router;
