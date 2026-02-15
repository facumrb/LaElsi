async function testFullFlow() {
  console.log('=== PRUEBA COMPLETA DE AUTENTICACIÓN ===\n');

  // 1. Crear Admin nuevo
  console.log('1. Creando admin nuevo...');
  const createRes = await fetch('http://localhost:3000/api/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'AdminTest',
      lastName: 'Prueba',
      phone: '999888777',
      user: 'admintest2',
      password: 'mipassword123',
      email: 'admintest2@gmail.com'
    })
  });
  console.log('   Status:', createRes.status);
  const createData = await createRes.json();
  console.log('   Respuesta:', JSON.stringify(createData, null, 2));

  // 2. Login con ese admin
  console.log('\n2. Intentando login...');
  const loginRes = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: 'admintest2',
      password: 'mipassword123'
    })
  });
  console.log('   Status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('   Respuesta:', JSON.stringify(loginData, null, 2));

  // 3. Verificar estructura de respuesta
  console.log('\n3. Verificando estructura...');
  if (loginData.token) {
    console.log('   ✅ Token presente:', loginData.token.substring(0, 50) + '...');
  } else {
    console.log('   ❌ Token NO presente');
  }
  if (loginData.user) {
    console.log('   ✅ User presente:', loginData.user);
  } else {
    console.log('   ❌ User NO presente');
  }

  console.log('\n=== FIN DE PRUEBA ===');
}

testFullFlow();
