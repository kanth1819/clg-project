import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyB0JFiMfF2QTSU9efUNwMlzvRGRDY8dG8A",
    authDomain: "e-commerce-948b8.firebaseapp.com",
    projectId: "e-commerce-948b8",
    storageBucket: "e-commerce-948b8.firebasestorage.app",
    messagingSenderId: "57814118033",
    appId: "1:57814118033:web:ef9730f9f13a25bb1a9930",
    measurementId: "G-LGKNJ2DG7H"
  };



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 

            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                alert("Login Successful!");
                window.location.href = "index.html"; 
            } catch (error) {
                alert("Login Failed: " + error.message);
            }
        });
    }
});
