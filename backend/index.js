const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection With MongoDB
mongoose.connect("mongodb+srv://prabodaharshani95:Mongo94%40@cluster0.dlatfz5.mongodb.net/e-commerce", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("Database connected!"))
.catch(err => console.error("Database connection error:", err));

// API Creation
app.get("/", (req, res) => {
    res.send("Express App is Running!");
});

// Ensure upload directory exists
const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Image storage Engine
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Creating Upload EndPoint for images
app.use('/images', express.static(uploadDir));

app.post("/upload", upload.single('product'), (req, res) => {
    if (req.file) {
        res.json({
            success: 1,
            image_url: `http://localhost:${port}/images/${req.file.filename}`
        });
    } else {
        res.status(400).json({ success: 0, message: "File upload failed" });
    }
});

// Schema for Creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,     
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

app.post('/addproduct', async (req, res) => {
    let products =await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;
        }
        else{
            id=1;
        }


    try {
        const product = new Product({
            id: id,
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });
        console.log(product);
        await product.save();
        console.log("Saved");
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

//Creating API for Deleting Products
app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");

    res.json({
        success:true,
        name:req.body.name
    })
})

//Creating API for getting all products

app.get('/allproducts',async(req,res)=>{
    let products =await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//Shema creating for User Model

const Users=mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{

    let check =await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,error:"existing user found with same email address "})
    
    }
    let cart ={};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;
        
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,

    })

    await user.save();

    const data={
        user:{
            id:user.id
        }
    }
    const token =jwt.sign(data,'secret_ecom');
    res.json({success:true,token })

})

//creating endpoint for user login
app.post('/login',async(req,res)=>{
    let user= await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password=== user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token})
        }
        else{
            res.json({success:false,error:"Wrong Password"});

        }
    }else{
        res.json({success:false,error:"Wrong Email Address"});
    }
})

app.listen(port, (err) => {
    if (!err) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error:" + err);
    }
});
