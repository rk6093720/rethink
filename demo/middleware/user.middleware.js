const jwt = require("jsonwebtoken");
const auth=async (req,res,next)=>{
    try {
        const token=req.headers.authorization;
        if(!token){
            return res.status(401).json({message:"Unauthorized"});
        }
        const userToken=token.split(" ")[1];
        if(!userToken){
            return res.status(400).json({message:"Invalid Token"})
            
        }
        const user =jwt.verify(userToken,process.env.JWT_SECRET);
        console.log("user",user);
                    req.userId=user.userId;   
                    req.exp = user.exp;  
                    req.token = userToken;
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"invalid token",error:error});
    }
}

module.exports={auth};