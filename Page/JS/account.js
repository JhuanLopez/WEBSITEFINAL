/* Account dropdown behavior
   - Reads user profile from sessionStorage.userProfile (JSON) if available
   - Toggles dropdown, handles Edit and Sign out actions
   - Sign out shows confirmation; on Yes triggers a signOut callback if provided (or clears sessionStorage)
*/
document.addEventListener('DOMContentLoaded', function() {
    const wrap = document.createElement('div');
    wrap.className = 'account-wrap';
    wrap.innerHTML = `
        <button class="account-btn" id="accountBtn" aria-haspopup="true" aria-expanded="false" title="Account">
            <i class="fa-solid fa-user"></i>
        </button>
        <div class="account-dropdown" id="accountDropdown" role="menu">
            <div class="account-email" id="accountEmail">Not signed in</div>
            <div class="account-item" id="editAccount">Edit account</div>
            <div class="account-item" id="signOut">Sign out</div>
        </div>
    `;
    document.body.appendChild(wrap);

    // Confirmation modal
    const confirm = document.createElement('div');
    confirm.className = 'confirm-backdrop';
    confirm.id = 'confirmBackdrop';
    confirm.innerHTML = `
        <div class="confirm-box">
            <div class="confirm-text">Are you sure you want to sign out?</div>
            <div class="confirm-actions">
                <button class="confirm-btn confirm-no" id="confirmNo">No</button>
                <button class="confirm-btn confirm-yes" id="confirmYes">Yes</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirm);

    // Edit profile modal (injected)
    const edit = document.createElement('div');
    edit.className = 'edit-backdrop';
    edit.id = 'editBackdrop';
    edit.innerHTML = `
        <div class="edit-box">
            <div><label for="editName">Name</label><input id="editName" type="text" /></div>
            <div><label for="editEmail">Email</label><input id="editEmail" type="email" /></div>
            <div class="edit-actions">
                <button class="edit-cancel" id="editCancel">Cancel</button>
                <button class="edit-save" id="editSave">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(edit);

    const btn = document.getElementById('accountBtn');
    const dropdown = document.getElementById('accountDropdown');
    const emailEl = document.getElementById('accountEmail');
    const editBtn = document.getElementById('editAccount');
    const signOutBtn = document.getElementById('signOut');
    const backdrop = document.getElementById('confirmBackdrop');
    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');

    function closeDropdown() {
        dropdown.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
    }

    function openDropdown() {
        dropdown.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
    }

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (dropdown.classList.contains('show')) closeDropdown(); else openDropdown();
    });

    // close when clicking outside
    document.addEventListener('click', function() { closeDropdown(); });
    dropdown.addEventListener('click', function(e){ e.stopPropagation(); });

    // Populate email/name from Firebase currentUser if available, otherwise sessionStorage
    try {
        let filled = false;
        if (window.firebase && firebase.auth && typeof firebase.auth === 'function') {
            const user = firebase.auth().currentUser;
            if (user) {
                if (user.email) { emailEl.textContent = user.email; filled = true; }
                else if (user.displayName) { emailEl.textContent = user.displayName; filled = true; }
            }
        }
        if (!filled) {
            const raw = sessionStorage.getItem('userProfile');
            if (raw) {
                const profile = JSON.parse(raw);
                if (profile.email) emailEl.textContent = profile.email;
                else if (profile.name) emailEl.textContent = profile.name;
            }
        }
    } catch(e) { /* ignore */ }

    // Open edit modal
    editBtn.addEventListener('click', function() {
        // populate fields from session or firebase
        try {
            const userRaw = sessionStorage.getItem('userProfile');
            const nameField = document.getElementById('editName');
            const emailField = document.getElementById('editEmail');
            if (window.firebase && firebase.auth && typeof firebase.auth === 'function') {
                const user = firebase.auth().currentUser;
                if (user) {
                    nameField.value = user.displayName || '';
                    emailField.value = user.email || '';
                }
            }
            if (userRaw) {
                const p = JSON.parse(userRaw);
                if (!nameField.value && p.name) nameField.value = p.name;
                if (!emailField.value && p.email) emailField.value = p.email;
            }
        } catch(e) { /* ignore */ }
        document.getElementById('editBackdrop').classList.add('show');
        closeDropdown();
    });

    signOutBtn.addEventListener('click', function() {
        // show confirmation
        backdrop.classList.add('show');
        closeDropdown();
    });

    no.addEventListener('click', function() { backdrop.classList.remove('show'); });

    yes.addEventListener('click', function() {
        backdrop.classList.remove('show');
        // If Firebase is used, attempt to sign out via firebase.auth()
        if (window.firebase && firebase.auth && typeof firebase.auth === 'function') {
            try {
                firebase.auth().signOut().catch(()=>{});
            } catch(e) {}
        }
        // Clear local session and redirect to login
        try { sessionStorage.removeItem('userProfile'); } catch(e){}
        // Optionally clear other auth tokens (localStorage)
        window.location.href = 'Login.html';
    });

    // Edit modal handlers
    const editBackdrop = document.getElementById('editBackdrop');
    const editSave = document.getElementById('editSave');
    const editCancel = document.getElementById('editCancel');

    editCancel.addEventListener('click', function() { editBackdrop.classList.remove('show'); });

    editSave.addEventListener('click', function() {
        const newName = document.getElementById('editName').value.trim();
        const newEmail = document.getElementById('editEmail').value.trim();
        // Update sessionStorage
        try {
            const raw = sessionStorage.getItem('userProfile');
            let profile = raw ? JSON.parse(raw) : {};
            if (newName) profile.name = newName;
            if (newEmail) profile.email = newEmail;
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
            emailEl.textContent = newEmail || newName || emailEl.textContent;
        } catch(e) { console.warn(e); }

        // Try to update Firebase user (displayName only; updating email may require re-auth)
        if (window.firebase && firebase.auth && typeof firebase.auth === 'function') {
            const user = firebase.auth().currentUser;
            if (user) {
                if (newName && user.updateProfile) {
                    user.updateProfile({ displayName: newName }).catch(()=>{});
                }
                // Do NOT attempt to programmatically update email without re-auth (skip here)
            }
        }

        editBackdrop.classList.remove('show');
    });
});
