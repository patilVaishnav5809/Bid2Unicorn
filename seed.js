import { createClient } from '@supabase/supabase-js';
import { SEED_DATA } from './src/api/mockBase44.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_MAP = {
  Startup: 'startups',
  Team: 'teams',
  Bid: 'bids',
  PowerCard: 'power_cards',
  AuctionSettings: 'auction_settings',
  BreakingNews: 'breaking_news',
  ActivityLog: 'activity_logs'
};

async function seed() {
  console.log('Starting Supabase Seeding...');

  for (const [entityName, items] of Object.entries(SEED_DATA)) {
    const tableName = TABLE_MAP[entityName];
    if (!tableName) {
      console.warn(`Skipping unknown entity: ${entityName}`);
      continue;
    }

    if (items.length === 0) {
        console.log(`Skipping empty table: ${tableName}`);
        continue;
    }

    console.log(`Seeding ${tableName}...`);

    // Process items to match DB schema if necessary
    const records = items.map(item => {
        const record = { ...item };
        // Remove 'id' if you want Supabase to generate fresh UUIDs, 
        // OR keep them if you want consistency with Mock Data. 
        // The SQL schema uses UUIDs. The mock data uses 's1', 't1'. 
        // 's1' is NOT a valid UUID. We MUST remove IDs and let Supabase generate them
        // OR we must ensure we update references.
        
        // Strategy: Let Supabase generate UUIDs, but we need to maintain relationships.
        // This is complex. 
        // Simpler approach for now: modifying the Schema to accept TEXT ids temporarily? 
        // NO, SQL schema says UUID. 
        
        if (item.id && !isValidUUID(item.id)) {
            delete record.id;
        }
        
        // Fix References?
        // If we delete IDs, relationships (team_id: 't1') will break.
        // We need a map of Old ID -> New ID.
        return record;
    });

    // We can't batch insert if we need to preserve relationships with bad IDs.
    // For this pass, let's just attempt to insert. 
    // If the schema is strict UUID, 's1' will fail.
    // To make this work smoothly without rewriting the whole mock data:
    // I will use an "upsert" but knowing that 's1' fails UUID validation.
    
    // BETTER STRATEGY: 
    // 1. Manually map the simple IDs to specific fixed UUIDs for this project so they are constant?
    // 2. Or just generate valid UUIDs now and use them.
    
    // For this script, I'll generate new UUIDs on the fly and map them?
    // Too complex for a quick seed.
    
    // Let's rely on the user having run the SQL script I provided? 
    // The SQL script defines ID as UUID.
    
    // HACK: I will strip IDs and references for now, to at least get data in.
    // Relationships will be broken. 
    // Ideally, we should update SEED_DATA to use valid UUIDs.
    // But let's try to just insert regular data first.
    
    /* 
       Wait, if I strip IDs, how do I link 'PowerCard' to 'Team'?
       I need to handle this.
    */
  }
}

// Helper to check UUID
function isValidUUID(uuid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

async function smartSeed() {
    console.log('Starting Smart Seed (UUID migration)...');
    
    const idMap = {}; // oldId -> newUuid

    // 1. Teams (Parents)
    const teams = SEED_DATA.Team || [];
    for (const team of teams) {
        const { data, error } = await supabase.from('teams').insert({
            name: team.name,
            total_budget: team.total_budget,
            spent: team.spent,
            is_online: team.is_online,
            // members: team.members, // Array needs valid format
            created_by: team.created_by
        }).select().single();

        if (error) {
            console.error('Error inserting team:', team.name, error.message);
        } else {
            console.log(`Created Team: ${team.name} (${data.id})`);
            idMap[team.id] = data.id;
        }
    }

    // 2. Startups (Parents)
    const startups = SEED_DATA.Startup || [];
    for (const startup of startups) {
        const { data, error } = await supabase.from('startups').insert({
            name: startup.name,
            domain: startup.domain,
            description: startup.description,
            base_price: startup.base_price,
            current_price: startup.current_price,
            status: startup.status,
            order: startup.order
        }).select().single();

        if (error) {
             console.error('Error inserting startup:', startup.name, error.message);
        } else {
            console.log(`Created Startup: ${startup.name} (${data.id})`);
            idMap[startup.id] = data.id;
        }
    }

    // 3. PowerCards (Children of Teams)
    const cards = SEED_DATA.PowerCard || [];
    for (const card of cards) {
        const teamUuid = idMap[card.team_id]; // Map 't1' -> regex-uuid
        
        const payload = {
            name: card.name,
            type: card.type,
            description: card.description,
            status: card.status,
            effect_value: card.effect_value,
            team_id: teamUuid // could be undefined if team failed
        };

        const { error } = await supabase.from('power_cards').insert(payload);
        if (error) console.error('Error inserting card:', card.name, error.message);
    }
    
    // 4. Auction Settings
    const settings = SEED_DATA.AuctionSettings?.[0];
    if (settings) {
        const activeStartupUuid = idMap[settings.active_startup_id];
        const { error } = await supabase.from('auction_settings').insert({
            current_round: settings.current_round,
            round_name: settings.round_name,
            timer_seconds: settings.timer_seconds,
            is_auction_active: settings.is_auction_active,
            active_startup_id: activeStartupUuid
        });
        if (error) console.error('Error inserting settings:', error.message);
        else console.log('Settings configured.');
    }
    
    console.log('Seeding Complete!');
}

smartSeed().catch(console.error);
