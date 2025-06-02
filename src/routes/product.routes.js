const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/:productId', productController.getById);
router.put('/:productId', productController.update);
router.delete('/:productId', productController.remove);

module.exports = router;
