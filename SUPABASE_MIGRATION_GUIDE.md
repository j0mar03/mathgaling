# Supabase Migration Guide

## Key Differences Between Local Docker PostgreSQL and Supabase

### 1. Auto-increment Sequences
**Issue**: Supabase may have sequences out of sync, causing duplicate key errors.
**Solution**: 
- Always check if record exists before inserting
- Handle duplicate key errors gracefully
- Reset sequences if needed: `ALTER SEQUENCE students_id_seq RESTART WITH <next_value>;`

### 2. Authentication
**Local**: Direct database authentication
**Supabase**: Dual system - Supabase Auth + database records
**Solution**: 
- Always create both Supabase Auth user AND database record
- Handle cases where user exists in DB but not in Auth
- Use auth_id (email) as the linking field

### 3. Table Names
**Local**: Case-insensitive
**Supabase**: Case-sensitive
**Solution**: Always use lowercase table names (students, teachers, parents)

### 4. Connection Method
**Local**: Direct PostgreSQL connection
**Supabase**: REST API via Supabase client
**Solution**: Use Supabase client library consistently

### 5. Environment Variables
**Local**: 
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

**Supabase/Netlify**: 
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_API_KEY=xxx (for admin operations)
```

## Pre-Migration Checklist

1. **Export local data**:
   ```bash
   pg_dump -h localhost -U postgres mathgaling > backup.sql
   ```

2. **Check Supabase table structures**:
   - Ensure all tables exist
   - Verify column types match
   - Check constraints and indexes

3. **Reset sequences in Supabase** (if needed):
   ```sql
   -- Run in Supabase SQL Editor
   SELECT setval('students_id_seq', (SELECT MAX(id) FROM students) + 1);
   SELECT setval('teachers_id_seq', (SELECT MAX(id) FROM teachers) + 1);
   SELECT setval('parents_id_seq', (SELECT MAX(id) FROM parents) + 1);
   ```

4. **Test authentication flow**:
   - Create test users in both Auth and DB
   - Verify login works for all roles

## Development Best Practices

### 1. Use Supabase Locally
Instead of Docker PostgreSQL, use Supabase CLI for local development:
```bash
npm install -g supabase
supabase init
supabase start
```

### 2. Environment-Specific Code
```javascript
const isSupabase = process.env.SUPABASE_URL !== undefined;

if (isSupabase) {
  // Supabase-specific logic
} else {
  // Local PostgreSQL logic
}
```

### 3. Always Test on Staging
- Create a separate Supabase project for staging
- Test all CRUD operations before production
- Verify authentication works for all user types

### 4. Handle Supabase Quirks
```javascript
// Always handle duplicate key errors
try {
  const { data, error } = await supabase.from('table').insert(record);
  if (error && error.code === '23505') {
    // Handle duplicate key
  }
} catch (e) {
  // Handle other errors
}
```

## Common Issues and Solutions

### Issue: "duplicate key value violates unique constraint"
**Cause**: Auto-increment sequence out of sync
**Fix**: 
1. Check max ID in table
2. Reset sequence to max ID + 1
3. Or manually specify IDs when inserting

### Issue: "User can't login after creation"
**Cause**: User exists in DB but not in Supabase Auth
**Fix**: 
1. Check both Auth and DB when authenticating
2. Create fallback authentication for DB-only users
3. Sync Auth and DB records

### Issue: "Table not found"
**Cause**: Case sensitivity or wrong schema
**Fix**: 
1. Use lowercase table names
2. Check if using correct schema (public)
3. Verify table exists in Supabase dashboard

## Recommended Workflow

1. **Local Development**: Use Supabase CLI locally
2. **Staging**: Deploy to Netlify with staging Supabase project
3. **Production**: Only after thorough testing on staging

This ensures consistency across all environments and reduces debugging time.