import { auth, db } from '../firebaseConfig.js';
import { signOut } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import mostrarLogin from './login.js';
import mostrarFavoritos from './favoritos.js';
import mostrarTrivia from './trivia.js';

export default function mostrarHome() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="home-container">
            <nav class="navbar">
                <div class="nav-brand">
                    <h1>🌎 Países de América</h1>
                </div>
                <div class="nav-user">
                    <span id="userName">Cargando...</span>
                    <button id="btnTrivia" class="btn-nav btn-trivia">🎯 Trivia</button>
                    <button id="btnFavoritos" class="btn-nav">⭐ Favoritos</button>
                    <button id="btnCerrarSesion" class="btn-nav btn-logout">Cerrar Sesión</button>
                </div>
            </nav>
            
            <div class="main-content">
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Buscar país..." class="search-input">
                    <button id="btnBuscar" class="btn-search">🔍 Buscar</button>
                </div>
                
                <div id="loading" class="loading">Cargando países...</div>
                <div id="paisesContainer" class="paises-grid"></div>
            </div>
        </div>
    `;

    cargarNombreUsuario();
    cargarPaises();

    document.getElementById("btnCerrarSesion").addEventListener("click", async () => {
        try {
            await signOut(auth);
            mostrarLogin();
        } catch (error) {
            alert("Error al cerrar sesión: " + error.message);
        }
    });

    document.getElementById("btnTrivia").addEventListener("click", () => {
        mostrarTrivia();
    });

    document.getElementById("btnFavoritos").addEventListener("click", () => {
        mostrarFavoritos();
    });

    document.getElementById("btnBuscar").addEventListener("click", () => {
        const searchTerm = document.getElementById("searchInput").value.toLowerCase();
        cargarPaises(searchTerm);
    });

    document.getElementById("searchInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById("searchInput").value.toLowerCase();
            cargarPaises(searchTerm);
        }
    });
}

async function cargarNombreUsuario() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById("userName").textContent = `Hola, ${userData.nombre}`;
            } else {
                document.getElementById("userName").textContent = `Hola, ${user.email}`;
            }
        }
    } catch (error) {
        console.error("Error al cargar el nombre del usuario:", error);
    }
}

async function cargarPaises(searchTerm = '') {
    const loading = document.getElementById("loading");
    const container = document.getElementById("paisesContainer");
    
    loading.style.display = "block";
    container.innerHTML = '';

    try {
        const response = await fetch('https://restcountries.com/v3.1/region/america');
        const paises = await response.json();

        // Obtener favoritos del usuario
        const user = auth.currentUser;
        const favoritosQuery = query(
            collection(db, 'favoritos'),
            where('userId', '==', user.uid)
        );
        const favoritosSnapshot = await getDocs(favoritosQuery);
        const favoritos = new Set();
        favoritosSnapshot.forEach(doc => {
            favoritos.add(doc.data().paisCodigo);
        });

        // Filtrar países por búsqueda
        let paisesFiltrados = paises;
        if (searchTerm) {
            paisesFiltrados = paises.filter(pais => 
                pais.name.common.toLowerCase().includes(searchTerm) ||
                pais.name.official.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenar alfabéticamente
        paisesFiltrados.sort((a, b) => a.name.common.localeCompare(b.name.common));

        loading.style.display = "none";

        if (paisesFiltrados.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron países con ese nombre.</p>';
            return;
        }

        paisesFiltrados.forEach(pais => {
            const esFavorito = favoritos.has(pais.cca3);
            const paisCard = crearTarjetaPais(pais, esFavorito);
            container.appendChild(paisCard);
        });

    } catch (error) {
        loading.style.display = "none";
        container.innerHTML = '<p class="error">Error al cargar los países. Por favor, intenta nuevamente.</p>';
        console.error("Error al cargar países:", error);
    }
}

function crearTarjetaPais(pais, esFavorito) {
    const card = document.createElement('div');
    card.className = 'pais-card';
    
    const nombreComun = pais.name.common;
    const nombreOficial = pais.name.official;
    const capital = pais.capital ? pais.capital[0] : 'No disponible';
    const poblacion = pais.population ? pais.population.toLocaleString() : 'No disponible';
    const area = pais.area ? pais.area.toLocaleString() : 'No disponible';
    const idiomas = pais.languages ? Object.values(pais.languages).join(', ') : 'No disponible';
    const monedas = pais.currencies ? Object.values(pais.currencies).map(c => c.name).join(', ') : 'No disponible';
    const bandera = pais.flags.svg || pais.flags.png;
    const codigo = pais.cca3;

    card.innerHTML = `
        <div class="flag-container">
            <img src="${bandera}" alt="Bandera de ${nombreComun}" class="flag-img">
        </div>
        <div class="pais-info">
            <h3>${nombreComun}</h3>
            <p class="oficial-name">${nombreOficial}</p>
            <div class="pais-details">
                <p><strong>🏛️ Capital:</strong> ${capital}</p>
                <p><strong>👥 Población:</strong> ${poblacion}</p>
                <p><strong>📏 Área:</strong> ${area} km²</p>
                <p><strong>🗣️ Idiomas:</strong> ${idiomas}</p>
                <p><strong>💰 Monedas:</strong> ${monedas}</p>
            </div>
            <button class="btn-favorito ${esFavorito ? 'favorito-activo' : ''}" data-codigo="${codigo}" data-nombre="${nombreComun}">
                ${esFavorito ? '⭐ Quitar de Favoritos' : '☆ Agregar a Favoritos'}
            </button>
        </div>
    `;

    const btnFavorito = card.querySelector('.btn-favorito');
    btnFavorito.addEventListener('click', () => toggleFavorito(codigo, nombreComun, bandera, btnFavorito));

    return card;
}

async function toggleFavorito(codigo, nombre, bandera, button) {
    const user = auth.currentUser;
    
    try {
        // Buscar si ya existe en favoritos
        const favoritosQuery = query(
            collection(db, 'favoritos'),
            where('userId', '==', user.uid),
            where('paisCodigo', '==', codigo)
        );
        const favoritosSnapshot = await getDocs(favoritosQuery);

        if (!favoritosSnapshot.empty) {
            // Eliminar de favoritos
            favoritosSnapshot.forEach(async (docSnapshot) => {
                await deleteDoc(doc(db, 'favoritos', docSnapshot.id));
            });
            button.textContent = '☆ Agregar a Favoritos';
            button.classList.remove('favorito-activo');
            alert(`${nombre} eliminado de favoritos`);
        } else {
            // Agregar a favoritos
            await addDoc(collection(db, 'favoritos'), {
                userId: user.uid,
                paisCodigo: codigo,
                paisNombre: nombre,
                paisBandera: bandera,
                fechaAgregado: new Date().toISOString()
            });
            button.textContent = '⭐ Quitar de Favoritos';
            button.classList.add('favorito-activo');
            alert(`${nombre} agregado a favoritos`);
        }
    } catch (error) {
        console.error("Error al gestionar favorito:", error);
        alert("Error al actualizar favoritos");
    }
}
