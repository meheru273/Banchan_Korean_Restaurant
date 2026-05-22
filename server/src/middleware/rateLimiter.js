import ratelimit from "../config/upstash.js"

const rateLimiter = async(req,res,next)=>{

    try{
        const userid = req.ip || "anonymous";
        const {success} = await ratelimit.limit(userid)

        if(!success){
            return res.status(429).json({message:"too many request"})
        }
        next()
    }catch(error){
        console.log("Rate limit error",error)
        next(error);
    }
}

export default rateLimiter