const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'something went wrong',
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    })
    res.status(500).json({ message: 'Internal server error occurred'});
    
}
module.exports={errorHandler};