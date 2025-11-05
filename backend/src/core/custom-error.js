class CustomError extends Error {
    constructor(type, message, status){
        super(message)
        this.type = type,
        this.status = status;
    }
}

module.exports = CustomError;