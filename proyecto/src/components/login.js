import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import mostrarRegistro from './registro.js';
import mostrarHome from './home.js';

export default function mostrarLogin() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Iniciar Sesión</h2>
                <form id="formLogin">
                    <input type="email" id="correo" placeholder="Correo electrónico" required />
                    <input type="password" id="contrasena" placeholder="Contraseña" required />
                    <button type="submit" id="btnLogin">Ingresar</button>
                </form>
                <p class="auth-link">¿No tienes cuenta? <a href="#" id="linkRegistro">Regístrate aquí</a></p>
            </div>
        </div>
    `;

    document.getElementById("linkRegistro").addEventListener("click", (e) => {
        e.preventDefault();
        mostrarRegistro();
    });

    document.getElementById("formLogin").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const correo = document.getElementById("correo").value;
        const contrasena = document.getElementById("contrasena").value;

        try {
            await signInWithEmailAndPassword(auth, correo, contrasena);
            mostrarHome();
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            let mensaje = 'Error al iniciar sesión';
            
            if (error.code === 'auth/user-not-found') {
                mensaje = 'Usuario no encontrado';
            } else if (error.code === 'auth/wrong-password') {
                mensaje = 'Contraseña incorrecta';
            } else if (error.code === 'auth/invalid-email') {
                mensaje = 'Correo electrónico inválido';
            } else if (error.code === 'auth/invalid-credential') {
                mensaje = 'Credenciales inválidas';
            }
            
            alert(mensaje);
        }
    });
}