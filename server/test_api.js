async function testApi() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@uni.dz', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        const examsRes = await fetch('http://localhost:5000/api/exams', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const examsData = await examsRes.json();

        console.log(`[TEST_API] Login Status: ${loginRes.status}`);
        console.log(`[TEST_API] Exams Count: ${examsData.length}`);
        if (examsData.length > 0) {
            console.log(`[TEST_API] Sample Exam Formation ID: ${examsData[0].formation_id}`);
        }
    } catch (error) { console.error(error.message); }
}
testApi();
