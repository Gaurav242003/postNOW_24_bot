import mongoose from "mongoose";

const userShema=mongoose.Schema({
    tgId:{
        type: String,
        required:true,
        unique:true
    },

    firstName:{
        type: String,
        required:true,
    },

    userName:{
        type: String,
        required:false,
    },
   
    isBot:{
        type : Boolean,
        required:true,
    },

    promptTokens: {
        type:Number,
        required:false,
    },

    completionTokens: {
        type:Number,
        required:false,
    }


},{timestamps:true});

export default mongoose.model('User',userShema);
