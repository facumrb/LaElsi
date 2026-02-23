async function test() {
  const baseUrl = 'http://localhost:3000/api/validate-unique';

  console.log('--- Iniciando Tests de Validación ---');

  try {
    // 1. Test con campo válido (que no existe)
    console.log('\n[1] Test con campo válido:');
    const res1 = await fetch(`${baseUrl}?entity=Admin&field=username&value=usuario_inexistente_${Date.now()}`);
    const data1 = await res1.json();
    console.log('Resultado:', data1.data.available === true ? '✅ PASSED' : '❌ FAILED', data1.data);

    // 2. Test con campo duplicado (buscamos el admin por defecto)
    console.log('\n[2] Test con campo duplicado (admin):');
    const res2 = await fetch(`${baseUrl}?entity=Admin&field=username&value=admin`);
    const data2 = await res2.json();
    console.log('Resultado:', data2.data.available === false ? '✅ PASSED' : '❌ FAILED', data2.data);

    // 3. Test con entidad inválida
    console.log('\n[3] Test con entidad inválida:');
    const res3 = await fetch(`${baseUrl}?entity=InexistentEntity&field=name&value=test`);
    const data3 = await res3.json();
    console.log('Resultado:', res3.status === 400 ? '✅ PASSED' : '❌ FAILED', 'Status:', res3.status, 'Message:', data3.message);

    // 4. Test con campo no permitido
    console.log('\n[4] Test con campo no permitido (password en Admin):');
    const res4 = await fetch(`${baseUrl}?entity=Admin&field=password&value=pass123`);
    const data4 = await res4.json();
    console.log('Resultado:', res4.status === 400 ? '✅ PASSED' : '❌ FAILED', 'Status:', res4.status, 'Message:', data4.message);

    // 5. Test con excludeId
    console.log('\n[5] Test con excludeId (excluyendo admin ID 1):');
    const res5 = await fetch(`${baseUrl}?entity=Admin&field=username&value=admin&excludeId=1`);
    const data5 = await res5.json();
    console.log('Resultado:', data5.data.available === true ? '✅ PASSED' : '❌ FAILED', data5.data);

    // 6. Test Normalización
    console.log('\n[6] Test de Normalización (ADMIN -> admin):');
    const res6 = await fetch(`${baseUrl}?entity=Admin&field=username&value=  ADMIN  `);
    const data6 = await res6.json();
    console.log('Resultado:', data6.data.available === false ? '✅ PASSED' : '❌ FAILED', data6.data);

  } catch (error) {
    console.error('Error durante los tests:', error.message);
  }
}

test();
