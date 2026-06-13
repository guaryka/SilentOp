const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure 'dotenv' or manual parsing of .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
const env = {};

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[key] = value.trim();
    }
  });
}

const adminEmail = 'admin@silentop.com';
const adminPassword = 'AdminPassword123!';
const displayName = 'Admin';

// Check if we can use the Supabase Admin API (recommeded)
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const useAdminApi = supabaseUrl && serviceRoleKey && serviceRoleKey !== 'placeholder_service_role_key';

if (useAdminApi) {
  seedViaAdminApi();
} else {
  seedViaDirectSql();
}

// ==========================================
// Method 1: Seed via Supabase Auth Admin API
// ==========================================
async function seedViaAdminApi() {
  console.log('Method 1: Seeding Admin user via Supabase Auth Admin API...');
  
  // Ensure @supabase/supabase-js is resolved
  try {
    require.resolve('@supabase/supabase-js');
  } catch (e) {
    console.log("Installing '@supabase/supabase-js'...");
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if user already exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.users.find(u => u.email === adminEmail);
    if (existingUser) {
      console.log(`User with email ${adminEmail} already exists. Skipping.`);
      printSuccess();
      return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'admin'
      }
    });

    if (error) throw error;
    printSuccess();
  } catch (err) {
    console.error('Failed to seed via Admin API:', err.message);
    console.log('Falling back to direct SQL...');
    seedViaDirectSql();
  }
}

// ==========================================
// Method 2: Seed via Direct SQL (Corrected salt rounds)
// ==========================================
async function seedViaDirectSql() {
  console.log('\nMethod 2: Seeding Admin user via Direct SQL Connection...');

  // Ensure 'pg' is installed
  try {
    require.resolve('pg');
  } catch (e) {
    console.log("Installing 'pg' library...");
    execSync('npm install pg', { stdio: 'inherit' });
  }

  const { Client } = require('pg');
  const dbUrl = env['DATABASE_URL'] || 'postgresql://postgres:T1prol4nd%40s37777@db.dhntzdxkzdiakymgbjqg.supabase.com:5432/postgres';

  if (dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('[region]')) {
    console.error('\n❌ DATABASE_URL is not configured in .env.local.');
    console.error('Please configure your database connection pooler URL first.');
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  const adminId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

  try {
    await client.connect();
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [adminEmail]);
    if (checkRes.rows.length > 0) {
      console.log(`User with email ${adminEmail} already exists. Updating password...`);
      // Update password to 10-round bcrypt hash
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = crypt($1, gen_salt('bf', 10)),
            raw_user_meta_data = $2,
            updated_at = now()
        WHERE email = $3
      `, [adminPassword, JSON.stringify({ display_name: displayName, role: 'admin' }), adminEmail]);
      
      await client.query('COMMIT');
      printSuccess();
      return;
    }

    // Insert user into auth.users using crypt with salt cost 10
    console.log('Inserting admin into auth.users (10 rounds bcrypt)...');
    await client.query(`
      INSERT INTO auth.users (
        instance_id,
        id,
        provider,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        aud
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        $1,
        'local',
        'authenticated',
        $2,
        crypt($3, gen_salt('bf', 10)),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        $4,
        false,
        now(),
        now(),
        'authenticated'
      )
    `, [adminId, adminEmail, adminPassword, JSON.stringify({ display_name: displayName, role: 'admin' })]);

    // Insert user into auth.identities
    console.log('Inserting identity link...');
    await client.query(`
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $1,
        $2,
        'email',
        now(),
        now(),
        now()
      )
      ON CONFLICT (provider, id) DO NOTHING
    `, [adminId, JSON.stringify({ sub: adminId, email: adminEmail })]);

    await client.query('COMMIT');
    printSuccess();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding admin user via SQL:', err.message);
  } finally {
    await client.end();
  }
}

function printSuccess() {
  console.log('\n🎉 Admin user is ready!');
  console.log('--------------------------------------');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('--------------------------------------');
}
