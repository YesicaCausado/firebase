import './style.css';
import { auth } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import mostrarLogin from './components/login.js';
import mostrarHome from './components/home.js';

// Mostrar loading inicial
const app = document.getElementById("app");
app.innerHTML = '<div class="loading">Cargando aplicación...</div>';

// Verificar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    console.log('Estado de autenticación:', user ? 'Usuario logueado' : 'No hay usuario');
    
    if (user) {
        // Usuario autenticado, mostrar Home
        console.log('Usuario ID:', user.uid);
        console.log('Email:', user.email);
        mostrarHome();
    } else {
        // No hay usuario autenticado, mostrar Login
        console.log('Mostrando pantalla de login');
        mostrarLogin();
    }
});
