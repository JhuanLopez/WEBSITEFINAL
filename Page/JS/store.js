// store.js - handle purchases in the store, write to RTDB, mark items as owned per-user
(function(){
    async function init(){
        if (typeof loadFirebase === 'function') await loadFirebase();
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.warn('Firebase not available; purchases will be stored locally only.');
        }

        const cards = Array.from(document.querySelectorAll('.skin-card'));

        // Utility: parse price like 150
        function parsePrice(n){ return Number(n) || 0; }

        // Render owned state for signed-in user
        async function refreshOwned(uid){
            if (!uid || !firebase || !firebase.database) return;
            try{
                const snap = await firebase.database().ref('users/' + uid + '/inventory').once('value');
                const inv = snap.val() || {};
                cards.forEach(card => {
                    const id = card.dataset.itemId;
                    const btn = card.querySelector('.buy-btn');
                    if (!btn) return;
                    if (inv && inv[id]){
                        btn.textContent = 'Owned';
                        btn.disabled = true;
                        btn.classList.add('owned');
                    } else {
                        btn.textContent = 'Buy';
                        btn.disabled = false;
                        btn.classList.remove('owned');
                    }
                });
            }catch(e){ console.warn('Failed to refresh inventory', e); }
        }

        // Simple modal for selecting payment method + confirm
        function createPurchaseModal(){
            const modal = document.createElement('div');
            modal.className = 'store-modal';
            modal.style.position = 'fixed';
            modal.style.inset = '0';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.background = 'rgba(0,0,0,0.45)';
            modal.style.zIndex = 99999;
            modal.innerHTML = `
                <div class="store-modal-card" style="background:#fff;border-radius:12px;padding:18px;min-width:320px;max-width:92vw;box-shadow:0 8px 40px rgba(2,48,71,0.12)">
                    <h3 style="margin:0 0 8px;">Confirm purchase</h3>
                    <div class="pm-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px"></div>
                    <div style="margin-bottom:10px" class="purchase-summary"></div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button class="btn-cancel" style="background:#eee;border:none;padding:8px 12px;border-radius:8px;">Cancel</button>
                        <button class="btn-confirm" style="background:#009dc4;color:#fff;border:none;padding:8px 12px;border-radius:8px;">Confirm</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            return modal;
        }

        // Payment methods (deduplicated when rendering)
        const PAYMENT_METHODS = [
            { id: 'gcash', name: 'GCash' },
            { id: 'card', name: 'Card' },
            { id: 'paymaya', name: 'PayMaya' },
            // duplicate intentionally removed by Set when rendering if present multiple times
        ];

        // handle buy click
        cards.forEach(card => {
            const btn = card.querySelector('.buy-btn');
            if (!btn) return;
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const itemId = card.dataset.itemId;
                const title = card.dataset.itemTitle || card.querySelector('.skin-title')?.textContent || 'Item';
                const price = parsePrice(card.dataset.itemPrice);
                const img = card.dataset.itemImg || '';

                // Ensure firebase loaded
                if (typeof firebase === 'undefined' || !firebase.auth) {
                    alert('Firebase not initialized. Cannot complete purchase.');
                    return;
                }

                const user = firebase.auth().currentUser;
                if (!user) {
                    // redirect to login
                    if (confirm('You must be signed in to buy items. Go to Login page?')) location.href = 'Login.html';
                    return;
                }

                const uid = user.uid;

                // show modal
                const modal = createPurchaseModal();
                const pmListEl = modal.querySelector('.pm-list');
                const summaryEl = modal.querySelector('.purchase-summary');
                const cancelBtn = modal.querySelector('.btn-cancel');
                const confirmBtn = modal.querySelector('.btn-confirm');

                // render payment methods (deduped)
                const seen = new Set();
                PAYMENT_METHODS.forEach(m => {
                    if (seen.has(m.id)) return; seen.add(m.id);
                    const btnPm = document.createElement('button');
                    btnPm.type = 'button';
                    btnPm.className = 'pm-btn';
                    btnPm.style.padding = '8px 10px';
                    btnPm.style.borderRadius = '8px';
                    btnPm.style.border = '1px solid rgba(0,0,0,0.06)';
                    btnPm.textContent = m.name;
                    btnPm.dataset.pm = m.id;
                    pmListEl.appendChild(btnPm);
                });

                summaryEl.textContent = `${title} — ${price} Pearls`;

                // cancel
                cancelBtn.addEventListener('click', () => { modal.remove(); });

                // confirm
                confirmBtn.addEventListener('click', async () => {
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'Processing...';

                    try{
                        // Write to user's inventory (overwrite if exists)
                        const userInvRef = firebase.database().ref('users/' + uid + '/inventory/' + itemId);
                        await userInvRef.set({ id: itemId, title, price, img, boughtAt: Date.now(), sold: true });

                        // Mark global item as owned by this user
                        const itemOwnersRef = firebase.database().ref('items/' + itemId + '/owners/' + uid);
                        await itemOwnersRef.set({ boughtAt: Date.now() });

                        // Optional: record a purchase log for audit
                        const logRef = firebase.database().ref('purchases/' + uid + '/' + Date.now());
                        await logRef.set({ itemId, title, price });

                        // Update UI
                        const buyBtn = card.querySelector('.buy-btn');
                        if (buyBtn){ buyBtn.textContent = 'Owned'; buyBtn.disabled = true; buyBtn.classList.add('owned'); }

                        alert('Purchase recorded. The item is now in your inventory.');
                        modal.remove();
                    }catch(err){
                        console.error('Purchase failed', err);
                        alert('Failed to complete purchase. See console for details.');
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Confirm';
                    }
                });
            });
        });

        // Hook auth state to refresh owned buttons
        if (firebase && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                refreshOwned(user ? user.uid : null);
            });
        }
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
