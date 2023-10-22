const fs = require('fs')
const axios = require('axios');
const apiUrl = 'https://kalisserver1064.serveo.net/getsampledata';
const PDFDocument = require('pdfkit');
const path = require('path')
const productsModel = require("../model/products");
const invoiceModel = require("../model/invoice");
const crypto = require('crypto-js')
const { createInvoice } = require("../helpers/create_invoice");
// const options = require('./helpers/options')
// const datas = require('./helpers/data')
const adminPassword = "ABCD@1234";
let timer;


const homeview = (req,res,next) =>{
   
    res.render('layout',{"body":"."})
}

const home = (req,res)=>{
    res.render('home')
}

const create =  async (req, res) => {

    var password = crypto.AES.encrypt(req.body.password, 'abi12345').toString();

     const { firstname,lastname,email } = req.body;

    const user = new data({
        firstname,lastname,email,
        password,

    });
    try {
        const data = user.save();
        res.send({ status: true, message: "user created successfully", data })
    } catch (err) {
        res.send({ status: false, message: "failed creation" })
    }
};

const createProducts = async (req, res) => {

     const {name, unitprice, quantity, productcode} = req.body;

    const product = new productsModel({
        name,unitprice,quantity,productcode
    });
    try {
        const data = product.save();
        var productid = (await data).id;
        res.send({ status: true, message: "Products inserted successfully", 'product_id': productid })
    } catch (err) {
        res.send({ status: false, message: "failed creation" })
    }
};

const deleteProduct = async (req, res) => {

    const {id} = req.body;

   try {
    if(id!=""){
        const data = productsModel.deleteOne({_id : id});
        var productid = (await data).id;
        res.send({ status: 200, message: "Product deleted successfully", 'product_id': productid})
    }else{
        res.send({ status: 400, message: "Id required", 'product_id': productid})
    }
      
   } catch (err) {
       res.send({ status: 400, message: "failed deletion" })
   }
};


const updateProduct = async (req, res) => {
    try {
    const {id , name, unitprice, quantity, productcode} = req.body;
    const result = await productsModel.findByIdAndUpdate(id, { name: name, unitprice: unitprice,quantity: quantity, productcode: productcode}, {
        new: true, // Return the modified document
      });
      if (result) {
        res.status(200).json({status: 200, message: 'Product updated successfully', updatedData: result });
      } else {
        res.status(404).json({status: 400, message: 'Product not found' });
      }
    } catch (err) {
        res.send({ status: 400, message: "Product update failed" })
    }
};


const verifyAdmin = async (req, res) => {

    const {password} = req.body;

   try {
    if(password === adminPassword){
        res.send({ status: true, message: "Verified", 'product_id': productid })
    }
   } catch (err) {
       res.send({ status: false, message: "Wrong password" })
   }
};


const getAllProducts = async (req, res) => {
    const {productname,page} = req.query;
    try {
        // makeRandomAPICalls();
        var query;
        var itemsPerPage;
        var skipCount;
        if(page == null){
            skipCount = 0;
        }else{
            itemsPerPage = 10;
            skipCount = (page - 1) * itemsPerPage;
        }
        if(productname===""){
            query = productsModel.find({});
        }else{
            console.log(productname);
            if(containsOnlyIntegers(productname)){
                query = productsModel.find({productcode: productname});
            }else{
                query = productsModel.find({ name: { $regex: productname, $options: 'i' } });
            }
        }

       if(itemsPerPage){
        query = query.skip(skipCount).limit(itemsPerPage);
       }

       const documents = await query.exec();
       res.send({'result' : {'status' : 200, 'data' : documents}});

}catch(err){
    res.send({ status: 400, message:  err ?? "Something went wrong"})
}
};


const getAllInvoices = async (req, res) => {
    const {name,page} = req.query;
    try {
        var query;
        console.log('Enter in to getAllInvoices');
        const results = await invoiceModel.aggregate([
            {
              $match: { date: { $exists: true } }, // Filter documents with a date field
            },
            {
              $sort: { date: -1 }, // Sort by date field in ascending order
            },
          ]).exec();
      
          const noDateResults = await invoiceModel.find({ date: { $exists: false } }).exec();
      
          const sortedResults = results.concat(noDateResults);

       res.send({'result' : {'status' : 200, 'data' : sortedResults}});

}catch(err){
    res.send({ status: 400, message:  err ?? "Something went wrong"})
}
};


const getLastProductCode = async(req, res) =>{
    try{
        var query;
        query = productsModel.find({});
        const documents = await query.exec();
        var i = documents.length;
        res.send({status: 200, 'result' : i});
    }catch(err){
        res.send({ status: 400, message:  err ?? "Something went wrong"})
    }
}

const getSampleData = async(req, res) =>{
    try{
        res.send({status: 200, 'result' : 'Success'});
    }catch(err){
        res.send({ status: 400, message:  err ?? "Something went wrong"})
    }
}

const productinvoice = async (req, res) => {

    const discountAmount = 5;
    const {products, user, tax, is_estimation} = req.body;
    var obj;
    var userObj;
    var isGst = tax!=null? JSON.parse(tax).is_gst : false;
    var isCustomerTax = tax!=null? JSON.parse(tax).is_customer_tax : true;
    try {
        userObj = JSON.parse(user);
        obj = JSON.parse(products);
    } catch (error) {
        res.send({ status: 400, message: "Invalid json format" });
        return;
    }
    var subtotalvalue=0.0;
    var subtotalvaluewithtax = 0.0;
    //calculation
    const documents = await productsModel.find({}).exec();

    // This for each is to calculate the subtotal
    var items=[];
    obj.forEach(async (element) => {
        console.log("------>>>>> Unit price-------->>>>>>>   "+element.id);
        documents.forEach(data => {
            if(data._id == element.id){
                console.log("------>>>>> Id inside-------->>>>>>>");
                // add subtotal
                var taxAmount =0;
                var productAmount = 0;
                taxAmount = (parseFloat(data.unitprice) * parseFloat(element.quantity)) / 100 * 18;
                productAmount = (parseFloat(data.unitprice) * parseFloat(element.quantity));
                var totalProductAmount = productAmount - taxAmount;
                subtotalvaluewithtax = subtotalvaluewithtax + totalProductAmount;
                subtotalvalue = subtotalvalue + (parseFloat(data.unitprice) * parseFloat(element.quantity));
                console.log("------>>>>> Subtotal-------->>>>>>>   "+subtotalvalue.toString());

                // Create items list to generate a pdf
                items.push({
                id: data._id,    
                item: element.name,
                description: "",
                quantity: element.quantity,
                amount: isGst? isCustomerTax? (parseFloat(data.unitprice) * parseFloat(element.quantity)).toString() : totalProductAmount.toString() : (parseFloat(data.unitprice) * parseFloat(element.quantity)).toString()})

            }
        });
    });
    
    const bulkOps = items.map(obj => {
        var quantity = 0;
        documents.forEach(data => {
            if(data.id == obj.id){
                quantity = data.quantity;
            }
        });
        var updatedQuantity = quantity - obj.quantity;
        return {
          updateOne: {
            filter: {
              _id: obj.id
            },
            // If you were using the MongoDB driver directly, you'd need to do
            // `update: { $set: { field: ... } }` but mongoose adds $set for you
            update: {
                quantity: updatedQuantity<=0 ? 0 : updatedQuantity 
            }
          }
        }
      });

      productsModel.bulkWrite(bulkOps).then((res) => {
        console.log("Documents Updated", res.modifiedCount)
      });


    var discount = ((subtotalvalue * discountAmount ) / 100).toString();
    var total = 0.0;
    var subtotal = '';
    var cgstVal = 0;
    var sgstVal = 0;
    if(isGst){
        if(isCustomerTax){
            subtotal = subtotalvalue.toFixed(2).toString();
            var gst = (subtotalvalue / 100 * 18);
            cgstVal = (gst / 2);
            sgstVal = (gst / 2);
        }else{
            subtotal = subtotalvaluewithtax.toFixed(2).toString();
            var gst = (subtotalvalue / 100 * 18);
            cgstVal = (gst / 2);
            sgstVal = (gst / 2);
        }
    }else{
        subtotal = subtotalvalue.toFixed(2).toString();
    }
    if(isGst){
        if(isCustomerTax){
            total= subtotalvalue + cgstVal + sgstVal;
        }else{
          total= subtotalvaluewithtax + cgstVal + sgstVal;
        }
      }else{
        total= subtotalvalue
      }

    var paid= total.toString();
    var cgst = cgstVal.toFixed(2).toString();
    var sgst = sgstVal.toFixed(2).toString();
    var datestamp = Math.floor(new Date().getTime() /1000).toString();
    var date = new Date();
    var is_gst = isGst;
    var is_customer_tax = isCustomerTax;

    const result = new invoiceModel({
       products,
       subtotal,
       total,
       cgst,
       sgst,
       user,
       discount,
       paid,
       date,
       datestamp,
       is_gst,
       is_estimation,
       is_customer_tax
   });
   try {
      
       const data = result.save();

const invoices = await invoiceModel.find({}).exec();
       // To create pdf
       const invoice = {
        shipping: {
          name: userObj.name,
          address: userObj.address,
          phone_no : userObj.phone_no,
          city: "",
          state: "",
          country: ""
        },
        items: items,
        subtotal: subtotal,
        cgst : cgst,
        sgst: sgst,
        paid: total,
        is_estimation: is_estimation,
        invoice_nr: invoices.length+1,
        item_count: items.length
      };

      console.log(items);
      var invoiceid= (await data).id;

      createInvoice(invoice, "invoices/invoice_"+invoiceid+".pdf");
//
    
       

       res.send({ status: true, message: "Invoice created successfully", 'invoce_id': invoiceid})
   } catch (err) {
       res.send({ status: false, message: "failed creation" })
   }
};

function containsOnlyIntegers(inputString) {
    // Use a regular expression to check if the string contains only integers
    return /^\d+$/.test(inputString);
  }

  function callAPI() {
    // Perform the API call using Axios or any HTTP library of your choice
    axios.get(apiUrl)
      .then(response => {
        console.log('API response:', response.data);
      })
      .catch(error => {
        console.error('API call failed:', error);
      });
  }
  
  function randomTimeWithinMinute() {
    // Generate a random time in milliseconds within a 1-minute interval
    return Math.floor(Math.random() * 60000);
  }

  function makeRandomAPICalls() {
    const randomInterval = randomTimeWithinMinute();

    if (timer) {
        clearTimeout(timer);
      }
  
    // Call the API after a random time within the 1-minute interval
    timer =setTimeout(() => {
      callAPI();
  
      // Call the function recursively to make repeated random calls
      makeRandomAPICalls();
    }, randomInterval);
  }




const downloadpdf = async (req, res) => {
    console.log(req.query.id);
    console.log(__dirname);
    const filePath = path.join(__dirname, '../invoices/invoice_'+req.query.id+'.pdf');
    res.sendFile(filePath);
};

module.exports = {createProducts,productinvoice,downloadpdf,verifyAdmin,getAllProducts,deleteProduct,updateProduct,getLastProductCode,getSampleData,getAllInvoices}