const mongoose= require('mongoose')
const productSchema= mongoose.Schema

const productsModel= new productSchema({
    name:{
        type: String,
        required:true
    },
    unitprice:{
        type: Number,
        required: true,
        speed:{
            type:mongoose.Types.Decimal128
            }
    },
    quantity: {
        type: Number,
        required: true,
        validate : {
            validator : Number.isInteger,
            message   : '{VALUE} is not an integer value'
          }
    },
    productcode: {
        type: Number,
        required: true,
        validate : {
            validator : Number.isInteger,
            message   : '{VALUE} is not an integer value'
          }
    }
     })

productsModel.index({ name: 'text' });

module.exports=mongoose.model('product',productsModel);
