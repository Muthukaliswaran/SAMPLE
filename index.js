const express = require('express')
const controller = require("./controller/homecontrollers")

const app = express()

require('dotenv').config()

app.use(express.json())

const connectDB = require('./connectMongo')

connectDB()

app.post('/createproduct', controller.createProducts)

app.post('/productinvoice', controller.productinvoice)

app.post('/verify_admin', controller.verifyAdmin)
app.get('/getallproducts', controller.getAllProducts)
app.delete('/deleteproduct', controller.deleteProduct)
app.put('/updateproduct', controller.updateProduct)
app.get('/getlastproductcode', controller.getLastProductCode);
app.get('/getsampledata', controller.getSampleData);
app.get('/getallinvoices', controller.getAllInvoices);

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT)
})