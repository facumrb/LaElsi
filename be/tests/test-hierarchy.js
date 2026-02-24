const API_URL = 'http://localhost:3000/api';
let adminToken = '';

async function login() {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'adminPassword123'
    })
  });
  const data = await res.json();
  adminToken = data.data.token;
}

async function runTests() {
  await login();
  const headers = { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  console.log('--- TEST 1: Creating Hierarchy ---');
  const res1 = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Root Cat', description: 'Root' })
  });
  const cat1 = await res1.json();
  console.log('Created Root:', cat1.data.id);

  const res2 = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Child Cat', parentId: cat1.data.id })
  });
  const cat2 = await res2.json();
  console.log('Created Child:', cat2.data.id, 'Depth:', cat2.data.depth);

  const res3 = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Grandchild Cat', parentId: cat2.data.id })
  });
  const cat3 = await res3.json();
  console.log('Created Grandchild:', cat3.data.id, 'Depth:', cat3.data.depth);

  console.log('--- TEST 2: Max Depth Constraint ---');
  const res4 = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'GreatGrandchild Cat', parentId: cat3.data.id })
  });
  const err4 = await res4.json();
  if (res4.status === 400) {
    console.log('Caught expected depth error:', err4.message);
  } else {
    console.log('FAILED: Should have caught depth error');
  }

  console.log('--- TEST 3: Cycle Detection (Self) ---');
  const res5 = await fetch(`${API_URL}/categories/${cat1.data.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ parentId: cat1.data.id })
  });
  const err5 = await res5.json();
  if (res5.status === 400) {
    console.log('Caught expected self-cycle error:', err5.message);
  } else {
    console.log('FAILED: Should have caught self-cycle error');
  }

  console.log('--- TEST 4: Cycle Detection (Ancestor) ---');
  const res6 = await fetch(`${API_URL}/categories/${cat1.data.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ parentId: cat3.data.id })
  });
  const err6 = await res6.json();
  if (res6.status === 400) {
    console.log('Caught expected ancestor-cycle error:', err6.message);
  } else {
    console.log('FAILED: Should have caught ancestor-cycle error');
  }

  console.log('--- TEST 5: Tree Recovery ---');
  const res7 = await fetch(`${API_URL}/categories/tree`);
  const tree = await res7.json();
  console.log('Tree count (root level):', tree.data.length);
  const rootInTree = tree.data.find(c => c.id === cat1.data.id);
  console.log('Root children count:', rootInTree.children.length);

  console.log('--- TEST 6: Delete constraint ---');
  const res8 = await fetch(`${API_URL}/categories/${cat1.data.id}`, {
    method: 'DELETE',
    headers
  });
  const err8 = await res8.json();
  if (res8.status === 400) {
    console.log('Caught expected delete error (has children):', err8.message);
  } else {
    console.log('FAILED: Should have caught delete error');
  }

  console.log('--- Cleanup ---');
  await fetch(`${API_URL}/categories/${cat3.data.id}`, { method: 'DELETE', headers });
  await fetch(`${API_URL}/categories/${cat2.data.id}`, { method: 'DELETE', headers });
  await fetch(`${API_URL}/categories/${cat1.data.id}`, { method: 'DELETE', headers });
  console.log('Cleanup complete.');
}

runTests().catch(err => {
  console.error('Test failed:', err.message);
});
