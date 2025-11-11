// ============================================================
// BROWSER STORAGE CLEANUP SCRIPT
// Run this in your browser console to clear all auth data
// ============================================================

// Clear localStorage
localStorage.removeItem('auth_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user_data');

// Clear sessionStorage
sessionStorage.clear();

// Clear all cookies for this domain
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Browser storage cleared! Try logging in again.');

// Optional: Force reload the page
window.location.reload();