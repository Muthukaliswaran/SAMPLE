const mongoose= require('mongoose')
const invoiceSchema= mongoose.Schema
const invoice= new invoiceSchema({
    user : {
        type: String
    },
    products:{
        type: String,
        required:true
    },
    paid: {
        type: String,
        required: true
    },
    cgst: {
        type: String,
        required: true
    },
    sgst : {
        type: String,
        required: true
    },
    total: {
        type: String,
        required: true
    },
    subtotal:{
        type: String,
        required:true
    },
    discount:{
        type: String,
        required:true
    },
    date: Date,
    is_gst: {
        type: Boolean,
        default: false,
      },
    is_estimation: {
        type: Boolean,
        default: false,
      },
    is_customer_tax: {
        type: Boolean,
        default: false,
      },
    datestamp:{
        type: String,
        required: true
    }
     })

module.exports=mongoose.model('invoice',invoice);
