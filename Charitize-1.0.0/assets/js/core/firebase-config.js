import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

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
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { auth, analytics, googleProvider };
