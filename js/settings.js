// js/settings.js - Settings Management Module

const SettingsModule = (function() {
    let supabaseClient = null;

    function init(client) {
        supabaseClient = client;
        console.log('✅ SettingsModule initialized');
    }

    // Load all settings
    async function loadSettings() {
        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('*');
            
            if (error) throw error;
            
            const settings = {};
            data.forEach(item => {
                settings[item.key] = item.value;
            });
            
            return { success: true, data: settings };
            
        } catch (error) {
            console.error('Error loading settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Save setting
    async function saveSetting(key, value) {
        try {
            const { error } = await supabaseClient
                .from('settings')
                .upsert({ 
                    key: key, 
                    value: value,
                    updated_at: new Date().toISOString()
                }, { 
                    onConflict: 'key' 
                });
            
            if (error) throw error;
            return { success: true };
            
        } catch (error) {
            console.error('Error saving setting:', error);
            return { success: false, error: error.message };
        }
    }

    // Get specific setting
    async function getSetting(key) {
        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('value')
                .eq('key', key)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data: data?.value || null };
            
        } catch (error) {
            console.error('Error getting setting:', error);
            return { success: false, error: error.message };
        }
    }

    return {
        init,
        loadSettings,
        saveSetting,
        getSetting
    };
})();

window.SettingsModule = SettingsModule;
