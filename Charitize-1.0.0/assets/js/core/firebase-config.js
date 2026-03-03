import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    setPersistence, 
    browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhVdDVMWl71Y1Dap_VKSLrog_T6QGj63c",
  authDomain: "innovations-b1a19.firebaseapp.com",
  projectId: "innovations-b1a19",
  storageBucket: "innovations-b1a19.firebasestorage.app",
  messagingSenderId: "849092539026",
  appId: "1:849092539026:web:23b18e10f8e1371f0b2c4b",
  measurementId: "G-LJTXEQQD6E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use Default (Local) Persistence for better cross-tab reliability
// setPersistence(auth, browserSessionPersistence);

const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

const analytics = getAnalytics(app);

export { auth, db, analytics, googleProvider, storage };
