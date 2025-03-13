var express = require('express'); //npm install express
var cors = require('cors'); //npm install cors
var MongoClient = require('mongodb').MongoClient; //npm install mongodb
var { body, validationResult } = require('express-validator'); // Import express-validator
var app = express();

app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Set port and listen for requests
const PORT = process.env.PORT || 5080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

// Default Route
app.get('/', function (req, res) {
    res.send('<h1>Hello World!</h1>');
});

// MongoDB URI
const MONGODB_URI = 'mongodb://localhost:27017/food-delivery-app';

// Get All Restaurants
app.get('/restaurants', async (req, res) => {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        // Access the database
        const db = client.db();
        // Get the collection
        const collection = db.collection('restaurants');
        // Fetch all records
        const records = await collection.find({}).toArray();
        console.log(records); // Log the retrieved records
        // Close the connection
        client.close();
        // Send the records as JSON response
        res.json(records);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Get Restaurant by ID
app.get('/restaurant/:id', async (req, res) => {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        // Access the database
        const db = client.db();
        // Get the collection
        const collection = db.collection('restaurants');
        // Fetch the record by ID
        const id = req.params.id;
        const record = await collection.findOne({ _id: new MongoClient.ObjectID(id) });
        // Close the connection
        client.close();
        // If no record found, send 404 response
        if (!record) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        // Send the record as JSON response
        res.json(record);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Add Restaurant
app.post('/restaurant', [
    body('name').notEmpty().withMessage('Name is required'),
    body('image').notEmpty().withMessage('Image URL is required'),
    body('menu').isArray().withMessage('Menu must be an array'),
    body('rating').isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, image, menu, rating } = req.body;
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        console.log("Connected correctly to server");
        // Access the database
        const db = client.db();
        // Get the collection
        const collection = db.collection('restaurants');
        // Insert a single document
        const result = await collection.insertOne({ name, image, menu, rating });
        // Close the connection
        client.close();
        res.status(201).json({ message: 'Restaurant added successfully' });
    } catch (error) {
        console.error('Error adding restaurant:', error);
        res.status(500).send('Error adding restaurant');
    }
});

// Update Restaurant by ID
app.put('/restaurant/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('image').optional().notEmpty().withMessage('Image URL cannot be empty'),
    body('menu').optional().isArray().withMessage('Menu must be an array'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        console.log("Connected correctly to server");
        // Access the database
        const db = client.db();
        // Get the id of the restaurant to update
        const id = req.params.id;
        // Extract the updated fields from the request body
        const { name, image, menu, rating } = req.body;

        // Update the restaurant document
        const result = await db.collection('restaurants').updateOne(
            { _id: new MongoClient.ObjectID(id) },
            { $set: { name, image, menu, rating } }
        );
        // Check if the document was updated
        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Restaurant updated successfully' });
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
        // Close the connection
        client.close();
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete Restaurant by ID
app.delete('/restaurant/:id', async (req, res) => {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        console.log("Connected correctly to server");
        // Access the database
        const db = client.db();
        // Get the id of the restaurant to delete
        const id = req.params.id;
        // Delete the restaurant document
        const result = await db.collection('restaurants').deleteOne({ _id: new MongoClient.ObjectID(id) });
        // Check if the document was deleted
        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Restaurant deleted successfully' });
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
        // Close the connection
        client.close();
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
