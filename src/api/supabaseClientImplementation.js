import { supabase } from '@/lib/supabase';
import { mockBase44 } from './mockBase44';

// Map entity names to table names
const TABLE_MAP = {
  Startup: 'startups',
  Team: 'teams',
  Bid: 'bids',
  PowerCard: 'power_cards',
  AuctionSettings: 'auction_settings',
  BreakingNews: 'breaking_news',
  ActivityLog: 'activity_logs',
  User: 'users' // Note: 'users' table or auth.users? We'll use auth for login but maybe a profiles table for extra data
};

class SupabaseEntityClient {
  constructor(entityName) {
    this.entityName = entityName;
    this.tableName = TABLE_MAP[entityName];
  }

  async list(sortParams) {
    let query = supabase.from(this.tableName).select('*');
    
    if (sortParams) {
      const desc = sortParams.startsWith('-');
      const field = desc ? sortParams.slice(1) : sortParams;
      query = query.order(field, { ascending: !desc });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async get(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(item) {
    // Remove ID if present and empty to let DB generate UUID
    const payload = { ...item };
    if (!payload.id) delete payload.id;

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  subscribe(callback) {
    const channel = supabase
      .channel(`public:${this.tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: this.tableName }, (payload) => {
        callback({ type: 'update', entity: this.entityName, payload });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

class SupabaseAuthClient {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }
    // Map Supabase user to our app user structure
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user',
      name: user.user_metadata?.name || user.email.split('@')[0]
    };
  }

  async login(email, role = 'user', passwordSource) {
    // If no password provided (e.g. for team login via Home.jsx which just sends team name), 
    // use a deterministic default password. This mimics the passwordless team login
    // of the original mock data but satisfies Supabase Auth requirements.
    const password = passwordSource || "bid2unicorn_team_2026!";

    // WARNING: This is a deviation from standard Supabase Auth for the sake of matching the "Input Name -> Login" flow of the mockup.
    // In a real app, users should sign up with a password.
    
    // OPTION 1: Real Auth (Email/Password) - Requires UI change to ask for password
    // OPTION 2: Anonymous Auth + Metadata - Good for temporary events
    
    // Let's try to match the Mock behavior:
    // If it's Admin (hardcoded in Home.jsx), authenticating as admin.
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password 
    });

    if (error) {
        console.warn("[SupabaseAuth] signInWithPassword failed:", error.message, error);

        // If the error is "Email not confirmed", DO NOT try to sign up again. This causes rate limits.
        if (error.message.includes("Email not confirmed")) {
            throw new Error("Please confirm your email address before logging in. Check your inbox (and spam folder) for a link from Supabase.");
        }

        if (role === 'admin') {
            throw new Error("Invalid admin credentials.");
        }

        if (role === 'user') {
            const { data: teamDataList, error: teamError } = await supabase
                .from('teams')
                .select('team_password')
                .eq('leader_email', email);
                
            if (teamError || !teamDataList || teamDataList.length === 0) {
                throw new Error("Login failed. No registered team found for this email. Please contact Admin.");
            }
            
            const validTeam = teamDataList.find(t => t.team_password === password);
            if (!validTeam) {
                throw new Error("Invalid login credentials."); // Intentionally vague for security, matching standard Auth error
            }

            // --- AUTO-SIGNUP LOGIC FOR VALID TEAMS ---
            // If the team exists and password is correct, but Supabase Auth rejected them,
            // they probably haven't been registered in Supabase Auth yet.
            console.log("Team validated against database. Attempting auto-signup...");
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        role: 'user',
                        name: email.split('@')[0]
                    }
                }
            });

            if (signUpError) {
                 if (signUpError.message && signUpError.message.includes("User already registered")) {
                      throw new Error("Invalid login credentials."); // Fallback
                 }
                 throw new Error("Auto-registration failed: " + signUpError.message);
            }

            // If signup succeeded, return the newly created user session properly.
            // Note: If email confirmations are enabled in Supabase, this will return a user but NO session.
            if (signUpData.user && !signUpData.session) {
                throw new Error("Please confirm your email address to complete registration. Check your inbox.");
            }
            
            return {
                id: signUpData.user.id,
                email: signUpData.user.email,
                role: 'user',
                name: signUpData.user.user_metadata?.name || email.split('@')[0]
            };
        }

        if (error.status === 429) {
            throw new Error("Too many login attempts. Please wait and try again.");
        }
        throw new Error("Invalid login credentials.");
    }

    // Force update metadata if role is different (e.g. promoting to admin)
    if (role && data.user.user_metadata?.role !== role) {
        await supabase.auth.updateUser({
            data: { role: role }
        });
        data.user.user_metadata.role = role;
    }

    return {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || role,
        name: data.user.user_metadata?.name
    };
  }

  async logout() {
    await supabase.auth.signOut();
  }

  async resendConfirmation(email) {
      const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
      });
      return { error };
  }

  redirectToLogin() {
    window.location.href = '/';
  }
}

class SupabaseUsersClient {
    async inviteUser(email, role) {
        // In Supabase, you invite by sending an email.
        // For now, we can just "allow" them by ensuring a record exists if we were using a users table
        return { success: true, message: `User infrastructure ready for ${email}` };
    }
}

class SupabaseAppLogsClient {
    constructor(base44) {
        this.base44 = base44;
    }
    async logUserInApp(pageName) {
        // Similar to mock, but fires to DB
         try {
            const user = await this.base44.auth.me().catch(() => null);
             if (!user) return;
             
             await this.base44.entities.ActivityLog.create({
                 user_id: user.id,
                 user_email: user.email,
                 action: 'page_view',
                 details: { page: pageName },
                 type: 'system',
                 message: `User ${user.email} viewed ${pageName}`
             });
         } catch (e) {
             console.warn(e);
         }
    }
}

class SupabaseClientImplementation {
  constructor() {
    this.auth = new SupabaseAuthClient();
    this.users = new SupabaseUsersClient();
    this.appLogs = new SupabaseAppLogsClient(this);
    
    this.entities = {
      Startup: new SupabaseEntityClient('Startup'),
      Team: new SupabaseEntityClient('Team'),
      Bid: new SupabaseEntityClient('Bid'),
      PowerCard: new SupabaseEntityClient('PowerCard'),
      AuctionSettings: new SupabaseEntityClient('AuctionSettings'),
      BreakingNews: new SupabaseEntityClient('BreakingNews'),
      ActivityLog: new SupabaseEntityClient('ActivityLog'),
      User: new SupabaseEntityClient('User')
    };
  }
}

export const supabaseBase44 = new SupabaseClientImplementation();
