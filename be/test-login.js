
async function test() {
    // 1. Crear Admin
    const createRes = await fetch('http://localhost:3000/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "AdminSeguro",
            last_name: "Ramirez",
            phone: "423423423",
            user: "admin1",
            password: "password123",
            email: "admin1@gmail.com"
        })
    });
    console.log('Crear Admin Status:', createRes.status);
    const createData = await createRes.json();
    console.log('Crear Admin Response:', createData);

    // 2. Login
    const loginRes = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user: "admin1",
            password: "password123"
        })
    });
    console.log('Login Status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
}

test();
