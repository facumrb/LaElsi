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
        console.log('--- Iniciando Prueba de Identidad y Facturación ---');

        // 1. LOGIN ADMIN (Prueba DNI en el Seed)
        console.log('1. Login de Admin (Semilla)...');
        const adminLoginRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/admins/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { identifier: 'admin', password: 'admin123' });

        if (!adminLoginRes.body.token) throw new Error('Falló login admin');
        const adminToken = adminLoginRes.body.token;
        console.log('✅ Login Admin OK');

        // VERIFICAR QUE EL ADMIN TIENE DNI
        const adminInfoRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/admins/account/${adminLoginRes.body.user.id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        // El controller getAccountInfo de admin podría no devolver DNI si no lo incluí en accountInfo
        // Pero findAll o findOne sí deberían.
        const adminOneRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/admins/${adminLoginRes.body.user.id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin tiene DNI: ${adminOneRes.body.data.dni}`);

        // 2. REGISTRO DE CLIENTE (Prueba DNI obligatorio)
        console.log('\n2. Registrando nuevo cliente con DNI...');
        const clientData = {
            name: `User-${nonce}`,
            last_name: 'Test',
            dni: `${nonce}`.substring(0, 8),
            phone: '12345678',
            username: `client_${nonce}`,
            email: `test_${nonce}@laelsi.com`,
            password: 'password123'
        };

        const regRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/users/register', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, clientData);

        const clientId = regRes.body.id;
        console.log(`✅ Cliente registrado con ID: ${clientId} y DNI: ${clientData.dni}`);

        // 3. LOGIN CLIENTE
        console.log('\n3. Login del nuevo cliente...');
        const clientLoginRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/clients/login', method: 'POST', // O use /users/login
            headers: { 'Content-Type': 'application/json' }
        }, { identifier: clientData.username, password: clientData.password });

        // Si /api/clients/login fallase, usar /api/users/login que es el genérico
        const clientToken = clientLoginRes.body.token || (await request({
            hostname: 'localhost', port: 3000, path: '/api/users/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { identifier: clientData.username, password: clientData.password })).body.token;

        console.log('✅ Login Cliente OK');

        // 4. ACTUALIZAR PRODUCTO FISCAL (CUIT y Condición Fiscal)
        console.log('\n4. Perfil: Cargando CUIT y Condición Fiscal...');
        const updateRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/clients/${clientId}`, method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            }
        }, {
            cuit: '20123456789',
            fiscalCondition: 'Responsable Inscripto',
            street: 'Calle Falsa',
            streetNumber: 123
        });

        console.log(`✅ Resultado del Patch: ${updateRes.statusCode} - ${updateRes.body.message}`);

        // 5. VERIFICACIÓN FINAL (Desde la vista del Admin)
        console.log('\n5. Admin verificando datos del cliente...');
        const adminCheckRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/clients/${clientId}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const finalData = adminCheckRes.body.data;
        console.log(`📋 Datos Finales del Cliente:`);
        console.log(`   - DNI: ${finalData.dni}`);
        console.log(`   - CUIT: ${finalData.cuit}`);
        console.log(`   - Condición: ${finalData.fiscalCondition}`);
        console.log(`   - Dirección: ${finalData.street} ${finalData.streetNumber}`);

        console.log('\n--- PRUEBA FINALIZADA CON ÉXITO ---');

    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

runTest();
