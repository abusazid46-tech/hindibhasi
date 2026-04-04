// js/settings-loader.js - Load settings from database

const SettingsLoader = (function() {
    let supabaseClient = null;
    let cachedSettings = {};
    
    function init(client) {
        supabaseClient = client;
        loadSettings();
    }
    
    async function loadSettings() {
        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('*');
            
            if (error) throw error;
            
            data.forEach(item => {
                cachedSettings[item.key] = item.value;
            });
            
            console.log('Settings loaded:', cachedSettings);
            return cachedSettings;
            
        } catch (error) {
            console.error('Error loading settings:', error);
            return cachedSettings;
        }
    }
    
    function getSetting(key, defaultValue = '') {
        return cachedSettings[key] || defaultValue;
    }
    
    async function getUPIId() {
        if (cachedSettings.upi_id) return cachedSettings.upi_id;
        await loadSettings();
        return cachedSettings.upi_id || '8133908811@airtel';
    }
    
    async function getUPIPayeeName() {
        if (cachedSettings.upi_payee_name) return cachedSettings.upi_payee_name;
        await loadSettings();
        return cachedSettings.upi_payee_name || 'AHBBM Donation';
    }
    
    return {
        init,
        loadSettings,
        getSetting,
        getUPIId,
        getUPIPayeeName
    };
})();

window.SettingsLoader = SettingsLoader;
