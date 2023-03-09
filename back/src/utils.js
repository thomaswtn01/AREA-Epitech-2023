import crypto from "crypto";


//////////////////////////////////////
//  MAP
//////////////////////////////////////


Map.prototype.ensure = function (key, def) {
    return this.get(key) ?? (
        this.set(key, def = def()),
        def
    );
};


//////////////////////////////////////
//  UTILS
//////////////////////////////////////


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//////////////////////////////////////
//  CRYPTO
//////////////////////////////////////


const algorithm     = "aes-256-cbc";
const key           = process.env.TOKEN_SECRET_KEY;

export function encrypt(data) {
    let cipher      = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), Buffer.from(key, "hex").subarray(0, 16));
    let encrypted   = cipher.update(data);

    return Buffer.concat([ encrypted, cipher.final()]);
}

export function decrypt(data) {
    let cipher      = crypto.createDecipheriv(algorithm, Buffer.from(key, "hex"), Buffer.from(key, "hex").subarray(0, 16));
    let decrypted   = cipher.update(data);

    return Buffer.concat([ decrypted, cipher.final()]);
}


//////////////////////////////////////
//  TOKENS
//////////////////////////////////////


export function generateToken(data) {
    return encrypt(Math.floor(Date.now() / 1000) + JSON.stringify(data)).toString("base64url");
}

export function decodeToken(token, max) {
    try {

        // Check token length.
        if (token.length != max)
            return false;

        let decode  = decrypt(Buffer.from(token, "base64url")).toString("utf8");
        let time    = parseInt(decode.substring(0, 10));

        // Check if time is a valid number.
        if (Number.isNaN(time))
            return false;

        return {
            time,
            data: JSON.parse(decode.substring(10))
        };

    } catch (err) {
        return false;
    }
}
