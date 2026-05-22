import express from "express"

const app = express()

import routes from "./routes/routes.js"

import { connectDB } from "./config/db.js"
import dotenv from "dotenv"
import rateLimiter from "./middleware/rateLimiter.js"

dotenv.config()

const PORT = process.env.PORT || 5001



//middleware
app.use(express.json())
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use(rateLimiter)

app.use("/api/notes",routes);

connectDB().then(()=>{
    app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`)
    console.log(`notes endpoint: http://localhost:${PORT}/api/notes`)
})
})



// app.get("/api/notes",(req,req)=>{
//     res.status(200).send("hello");
// })

// app.post("/api/notes",(req,req)=>{
//     res.status(200).send("hello");
// })

// app.put("/api/notes",(req,req)=>{
//     res.status(200).json({message: "send a put req"});
// })

// app.delete("/api/notes",(req,req)=>{
//     res.status(200).json({message: "send a del req"})
// })