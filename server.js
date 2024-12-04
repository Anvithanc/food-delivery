const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory data stores
let menu = [];
let orders = [];

// Predefined categories for validation
const validCategories = ['FastFood', 'Drinks', 'Desserts', 'MainCourse'];

// **1. Add Menu Item (GET /menu)**
app.get('/menu', (req, res) => {
  const { name, price, category } = req.query;

  // Validate input
  if (!name || !price || isNaN(price) || price <= 0 || !validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid menu item details. Ensure price is positive and category is valid.' });
  }

  // Create new menu item
  const newItem = { id: uuidv4(), name, price: parseFloat(price), category };
  menu.push(newItem);

  // Return the newly added item
  res.status(201).json(newItem);
});

// **2. Get Menu (GET /menu)**
// Retrieve all menu items
app.get('/menu', (req, res) => {
  res.json(menu);
});

// **3. Place Order (POST /orders)**
app.post('/orders', (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order items must be a non-empty array.' });
  }

  for (const itemId of items) {
    if (!menu.some(item => item.id === itemId)) {
      return res.status(400).json({ error: `Invalid item ID: ${itemId}` });
    }
  }

  const newOrder = { id: uuidv4(), items, status: 'Preparing' };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// **4. Get Order by ID (GET /orders/:id)**
app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// **5. Update Order Status (CRON Job)**
cron.schedule('*/15 * * * * *', () => {
  orders.forEach(order => {
    if (order.status === 'Preparing') {
      order.status = 'Out for Delivery';
    } else if (order.status === 'Out for Delivery') {
      order.status = 'Delivered';
    }
  });
  console.log('Order statuses updated:', orders);
});

// **6. Start Server**
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
