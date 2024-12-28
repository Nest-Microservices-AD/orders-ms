import 'dotenv/config';
import * as joi from 'joi';

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);
if (error) {
  throw new Error(`Env Vars error ${error.message}`);
}

const envValues: {
  PORT: number;
  DATABASE_URL: string;
} = value;

export const envs = {
  port: envValues.PORT,
  DATABASE_URL: envValues.DATABASE_URL,
};
