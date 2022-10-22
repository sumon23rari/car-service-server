const express=require('express');
const cors=require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port=process.env.PORT || 5000;

// using middleware
app.use(cors());
app.use(express.json());

// create a function
function  verifyJWT(req,res,next) {
    const authHeader=req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message:"unauthorisd access"})
    }
    const token=authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if (err) {
            return res.status(403).send({message:'forbidden access'})
        }
        console.log('decoded',decoded);
        req.decoded=decoded;
        next()
    })
    // console.log('inside verifyJWT',authHeader  )
   
}

// connect application
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pn2kl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
try{
    const geniusCar = client.db("geniusCar");
    const services = geniusCar.collection("services");
    const orderCollection=geniusCar.collection('order');
    // AUTH API
    app.post('/getToken',async(req,res)=>{
        const user=req.body;
        const accessToken=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:'1d'
        });
        res.send({accessToken})
    })
    // display all user
    app.get('/service',async(req,res)=>{
        const query={};
        const cursor= services.find(query);
        console.log('client connectet');
        const result=await cursor.toArray();
        res.send(result);
    });
    // display an user
    app.get('/service/:id',async(req,res)=>{
        const id=req.params.id;
         console.log("display",id);
        const query={_id:ObjectId(id)};
        const result=await services.findOne(query);
        res.send(result);
    })
        // post 
        app.post('/service',async(req,res)=>{
            const newService=req.body;
            console.log(newService);
            const result=await services.insertOne(newService)
            res.send(result)
        });
    // delete a service
    app.delete('/service/:id',async(req,res)=>{
        const id=req.params.id;
        console.log('dfasdfsdfs',id);
       const query={_id:ObjectId(id)};
        const result=await services.deleteOne(query)
        console.log(result)
        res.send(result)
    });
      // order collection get api
      app.get('/order',verifyJWT, async(req,res)=>{
        const decodedEmail=req.decoded.email;
        const email=req.query?.email;
        if (email===decodedEmail) {
            const query={email:email}; 
            const cursor=orderCollection.find(query);
            const resultOrder=await cursor.toArray();
            res.send(resultOrder);
        }
        else{
            res.status(403).send({message:'forbidden access'})
        }
       console.log('email',email);
      
        //console.log("query",query)
    
        //console.log('curson',cursor);
       
        //console.log(resultOrder)
        
    })
    // order post api
    app.post('/order',async(req,res)=>{
        const orderd=req.body;
        console.log('order',orderd)
        const result=await orderCollection.insertOne(orderd)
        res.send(result)
    })
  
}
finally{
    // await client.close()
}
}
run().catch(console.dir)

// default route
app.get('/',async(req,res)=>{
    res.send('cruding server')
});

app.listen(port,()=>{
    console.log('porting server',port)
})
