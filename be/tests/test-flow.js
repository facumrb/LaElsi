import http from 'http';

const request = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: data ? JSON.parse(data) : {}
                    });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
};

async function runTest() {
    const nonce = Date.now();
    try {
        console.log('--- Iniciando Prueba de Flujo Completo ---');

        console.log('1. Login de Admin...');
        const loginRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/admins/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { identifier: 'admin', password: 'admin123' });

        const token = loginRes.body.token;
        const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        console.log('2. Creando Categoría...');
        const catRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/categories', method: 'POST',
            headers: authHeaders
        }, { name: `Cat-${nonce}`, description: 'Test', state: 'Activo' });

        const categoryId = catRes.body.data.id;
        console.log(`✅ Categoría creada ID: ${categoryId}`);

        console.log('3. Creando Producto...');
        const prodRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/products', method: 'POST',
            headers: authHeaders
        }, {
            name: `Prod-${nonce}`, sku: `SKU-${nonce}`, description: 'Test', price: 100,
            brand: 'Test', total_sold: 0, state: 'Activo', stock: 10, categoryId: categoryId
        });

        if (!prodRes.body.data) {
            console.error('Error al crear producto:', prodRes.body);
            return;
        }
        const productId = prodRes.body.data.id;
        console.log(`✅ Producto creado ID: ${productId}, SKU: ${prodRes.body.data.sku}`);

        console.log('4. Actualizando Precio...');
        await request({
            hostname: 'localhost', port: 3000, path: `/api/products/${productId}`, method: 'PATCH',
            headers: authHeaders
        }, { price: 200 });

        console.log('5. Verificando historial...');
        const finalProdRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/products/${productId}`, method: 'GET'
        });

        const prices = finalProdRes.body.data.prices;
        console.log(`✅ El producto tiene ${prices.length} registros de precio.`);
        prices.forEach(p => console.log(`   - ${p.amount} ARS (Actual: ${p.isCurrent})`));

        console.log('6. Renombrando Categoría...');
        await request({
            hostname: 'localhost', port: 3000, path: `/api/categories/${categoryId}`, method: 'PATCH',
            headers: authHeaders
        }, { name: `Renamed-${nonce}` });

        const checkProdCat = await request({
            hostname: 'localhost', port: 3000, path: `/api/products/${productId}`, method: 'GET'
        });

        console.log(`✅ Producto vinculado a: "${checkProdCat.body.data.category.name}"`);
        console.log('--- PRUEBA FINALIZADA CON ÉXITO ---');

    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

runTest();
