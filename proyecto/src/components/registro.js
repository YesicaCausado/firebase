import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig.js';
import mostrarLogin from './login.js';

export default function mostrarRegistro() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Registro de Usuario</h2>
                <form id="formRegistro">
                    <input type="text" id="nombre" placeholder="Nombre completo" required>
                    <input type="email" id="correo" placeholder="Correo electrónico" required>
                    <input type="password" id="contrasena" placeholder="Contraseña (mínimo 6 caracteres)" required>
                    <input type="date" id="fecha" placeholder="Fecha de nacimiento" required>
                    <input type="tel" id="telefono" placeholder="Teléfono">
                    <button type="submit" id="btnRegistro">Registrarse</button>
                </form>
                <p class="auth-link">¿Ya tienes cuenta? <a href="#" id="linkLogin">Inicia sesión aquí</a></p>
            </div>
        </div>
    `;

    document.getElementById("linkLogin").addEventListener("click", (e) => {
        e.preventDefault();
        mostrarLogin();
    });

    document.getElementById("formRegistro").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById("nombre").value;
        const correo = document.getElementById("correo").value;
        const contrasena = document.getElementById("contrasena").value;
        const fecha = document.getElementById("fecha").value;
        const telefono = document.getElementById("telefono").value;

        if (contrasena.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            console.log('Iniciando registro de usuario...');
            const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
            const user = userCredential.user;
            console.log('Usuario creado en Authentication:', user.uid);
            
            // Guardar datos adicionales en Firestore
            const userData = {
                uid: user.uid,
                nombre,
                correo,
                fecha,
                telefono: telefono || '',
                fechaRegistro: new Date().toISOString(),
                puntajeTrivia: 0,  // Para la funcionalidad de trivia
                triviaJugadas: 0
            };
            
            console.log('Guardando datos en Firestore:', userData);
            await setDoc(doc(db, 'usuarios', user.uid), userData);
            console.log('Datos guardados correctamente en Firestore');
            
            alert('✅ Usuario registrado correctamente. Por favor inicia sesión.');
            mostrarLogin();
        } catch (error) {
            console.error('Error completo al registrarse:', error);
            let mensaje = 'Error al registrarse: ' + error.message;
            
            if (error.code === 'auth/email-already-in-use') {
                mensaje = '⚠️ Este correo ya está registrado';
            } else if (error.code === 'auth/invalid-email') {
                mensaje = '⚠️ Correo electrónico inválido';
            } else if (error.code === 'auth/weak-password') {
                mensaje = '⚠️ La contraseña es muy débil (mínimo 6 caracteres)';
            } else if (error.code === 'auth/network-request-failed') {
                mensaje = '⚠️ Error de conexión. Verifica tu internet.';
            }
            
            alert(mensaje);
        }
    });
}