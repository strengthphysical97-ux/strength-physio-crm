const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  action:{type:String,required:true}, entity:{type:String,required:true}, entityId:{type:mongoose.Schema.Types.ObjectId},
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, details:{type:String,trim:true}
},{timestamps:true});
module.exports=mongoose.model('AuditLog',auditSchema);
