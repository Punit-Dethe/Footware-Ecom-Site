async function testAdminAccess() {
  // 1. GET sign_in
  let res = await fetch('https://mirza-spree-backend.onrender.com/admin_user/sign_in');
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  let sessionCookie = '';
  for (const c of setCookie) {
    if (c && c.includes('_spree_starter_session=')) {
      sessionCookie = c.split(';')[0];
    }
  }
  let html = await res.text();
  const csrfToken = html.match(/name="csrf-token" content="([^"]+)"/)[1];

  // 2. POST sign_in
  const body = new URLSearchParams({
    'authenticity_token': csrfToken,
    'admin_user[email]': 'admin@mirzafootwear.com',
    'admin_user[password]': 'MirzaAdmin2026!',
    'admin_user[remember_me]': '0',
    'commit': 'Log in'
  });

  res = await fetch('https://mirza-spree-backend.onrender.com/admin_user/sign_in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: body.toString(),
    redirect: 'manual'
  });

  const postCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  for (const c of postCookies) {
    if (c && c.includes('_spree_starter_session=')) {
      sessionCookie = c.split(';')[0];
    }
  }

  console.log('POST status:', res.status, 'Location:', res.headers.get('location'));
  console.log('Session Cookie:', sessionCookie.slice(0, 35) + '...');

  // 3. Test GET /admin with sessionCookie
  const adminRes = await fetch('https://mirza-spree-backend.onrender.com/admin', {
    headers: { 'Cookie': sessionCookie },
    redirect: 'manual'
  });
  console.log('GET /admin status:', adminRes.status, 'Location:', adminRes.headers.get('location'));

  // 4. Test GET /dashboard with sessionCookie
  const dashRes = await fetch('https://mirza-spree-backend.onrender.com/dashboard', {
    headers: { 'Cookie': sessionCookie },
    redirect: 'manual'
  });
  console.log('GET /dashboard status:', dashRes.status, 'Location:', dashRes.headers.get('location'));
  const dashText = await dashRes.text();
  console.log('Dashboard title:', dashText.match(/<title>([^<]+)<\/title>/)?.[1]);
  console.log('Dashboard content snippet:', dashText.slice(0, 300));
}

testAdminAccess().catch(console.error);
