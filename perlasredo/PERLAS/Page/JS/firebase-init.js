// Simple Firebase loader using the compat SDKs so we can call firebase.auth() and firebase.database()
// Returns a promise that resolves to the global `firebase` object.
(function (global) {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAA25xHdOKXO3Xejj23-JjfGnTDd1gZPZM",
    authDomain: "perlas-database.firebaseapp.com",
    databaseURL: "https://perlas-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perlas-database",
    storageBucket: "perlas-database.firebasestorage.app",
    messagingSenderId: "623014500525",
    appId: "1:623014500525:web:48b3fbb3759dd3c4b90e24",
    measurementId: "G-KFK18WZW79"
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  let initPromise = null;
  global.loadFirebase = function () {
    if (initPromise) return initPromise;

    initPromise = Promise.resolve()
      // use compat builds so we can use the familiar names (firebase.auth(), firebase.database())
      .then(() => loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js'))
      .then(() => loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js'))
      .then(() => loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js'))
      .then(() => {
        if (!global.firebase || !global.firebase.apps || global.firebase.apps.length === 0) {
          global.firebase.initializeApp(FIREBASE_CONFIG);
        }
        return global.firebase;
      });

    return initPromise;
  };

})(window);
