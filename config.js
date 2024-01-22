import * as dotenv from 'dotenv';
dotenv.config();
export const PORT = process.env.PORT || 8000;
export const mongoDBURL = "mongodb+srv://sai24121994:qKxX9MJp4mfhMuOi@cfbs.g5rykk0.mongodb.net/CFBSDB?retryWrites=true&w=majority";

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY =  process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
export const S3_REGION = process.env.S3_REGION;

export const  CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;