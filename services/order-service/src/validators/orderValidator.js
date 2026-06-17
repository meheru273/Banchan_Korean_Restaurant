const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }
  req.body = value;
  next();
};

const addToCartSchema = Joi.object({
  menuItemId: Joi.string().required(),
  name: Joi.string().required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(1).max(20).default(1),
  specialInstructions: Joi.string().max(200).allow('').default(''),
  restaurantId: Joi.string().required(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(20),
  specialInstructions: Joi.string().max(200).allow(''),
}).min(1);

const placeOrderSchema = Joi.object({
  userName: Joi.string().min(1).max(50).required(),
  deliveryAddress: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string().allow(''),
    city: Joi.string().default('London'),
    postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i).required(),
  }).required(),
  restaurantId: Joi.string().required(),
  customerNotes: Joi.string().max(500).allow('').default(''),
});

module.exports = {
  validateAddToCart: validate(addToCartSchema),
  validateUpdateCartItem: validate(updateCartItemSchema),
  validatePlaceOrder: validate(placeOrderSchema),
};
