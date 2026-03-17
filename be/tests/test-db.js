import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'be', '.env') });
async function test() {
    try {
        console.log('Testing connection with:');
        console.log('Host:', process.env.DB_HOST);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);
        const orm = await MikroORM.init({
            dbName: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            driver: MySqlDriver,
            entities: []
        });
        const isConnected = await orm.isConnected();
        console.log('Is connected:', isConnected);
        await orm.close();
    }
    catch (error) {
        console.error('Connection test failed:', error.message);
        if (error.stack)
            console.error(error.stack);
    }
}
test();
//# sourceMappingURL=test-db.js.map