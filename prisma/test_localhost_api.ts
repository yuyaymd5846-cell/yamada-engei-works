
async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/rotation/list');
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error:', await res.text());
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}
main();
