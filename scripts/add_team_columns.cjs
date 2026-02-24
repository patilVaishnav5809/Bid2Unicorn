const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lrvjxgncxgekkshpyjfg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxydmp4Z25jeGdla2tzaHB5amZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTYxNTgsImV4cCI6MjA4Njg5MjE1OH0.7J4zDOuNFpTv3xtW0Ep34kuFI4mAA0iuhns2G0MZRB0'
);

async function addColumns() {
  // Try updating a single team with the new fields to test if they exist
  const { data: teams } = await supabase.from('teams').select('id').limit(1);
  if (!teams || teams.length === 0) {
    console.log('No teams found');
    return;
  }

  const teamId = teams[0].id;
  console.log('Testing update on team:', teamId);

  const { error } = await supabase
    .from('teams')
    .update({
      last_login_at: null,
      last_active_at: null,
      status: 'offline'
    })
    .eq('id', teamId);

  if (error) {
    console.log('Error (columns may not exist):', error.message);
    console.log('\nYou need to add these columns to the teams table in Supabase Dashboard:');
    console.log('  1. last_login_at  - type: timestamptz, nullable');
    console.log('  2. last_active_at - type: timestamptz, nullable');  
    console.log('  3. status         - type: text, default: offline, nullable');
    console.log('\nGo to: https://supabase.com/dashboard/project/lrvjxgncxgekkshpyjfg/editor');
    console.log('Click on "teams" table > "+" to add columns');
  } else {
    console.log('SUCCESS: Columns already exist! Updated team columns.');
  }
}

addColumns();
