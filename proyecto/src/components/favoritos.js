import { auth, db } from '../firebaseConfig.js';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import mostrarLogin from './login.js';
import mostrarHome from './home.js';
import mostrarTrivia from './trivia.js';

export default function mostrarFavoritos() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="home-container">
            <nav class="navbar">
                <div class="nav-brand">
                    <h1>⭐ Mis Favoritos</h1>
                </div>
                <div class="nav-user">
                    <span id="userName">Cargando...</span>
                    <button id="btnHome" class="btn-nav">🏠 Inicio</button>
                    <button id="btnTrivia" class="btn-nav btn-trivia">🎯 Trivia</button>
                    <button id="btnCerrarSesion" class="btn-nav btn-logout">Cerrar Sesión</button>
                </div>
            </nav>
            
            <div class="main-content">
                <div class="favoritos-header">
                    <h2>Países que has marcado como favoritos</h2>
                    <p class="favoritos-count">Total: <span id="totalFavoritos">0</span> países</p>
                </div>
                
                <div id="loading" class="loading">Cargando favoritos...</div>
                <div id="favoritosContainer" class="paises-grid"></div>
            </div>
        </div>
    `;

    cargarNombreUsuario();
    cargarFavoritos();

    document.getElementById("btnCerrarSesion").addEventListener("click", async () => {
        try {
            await signOut(auth);
            mostrarLogin();
        } catch (error) {
            alert("Error al cerrar sesión: " + error.message);
        }
    });

    document.getElementById("btnHome").addEventListener("click", () => {
        mostrarHome();
    });

    document.getElementById("btnTrivia").addEventListener("click", () => {
        mostrarTrivia();
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

async function cargarFavoritos() {
    const loading = document.getElementById("loading");
    const container = document.getElementById("favoritosContainer");
    const totalElement = document.getElementById("totalFavoritos");
    
    loading.style.display = "block";
    container.innerHTML = '';

    try {
        const user = auth.currentUser;
        const favoritosQuery = query(
            collection(db, 'favoritos'),
            where('userId', '==', user.uid)
        );
        const favoritosSnapshot = await getDocs(favoritosQuery);

        loading.style.display = "none";

        if (favoritosSnapshot.empty) {
            container.innerHTML = `
                <div class="no-favoritos">
                    <p>😢 Aún no tienes países favoritos</p>
                    <p>Ve al inicio y agrega algunos países a tus favoritos</p>
                    <button id="btnVolverHome" class="btn-primary">Ir al Inicio</button>
                </div>
            `;
            document.getElementById("btnVolverHome").addEventListener("click", () => {
                mostrarHome();
            });
            totalElement.textContent = '0';
            return;
        }

        // Obtener detalles completos de cada país favorito
        const favoritos = [];
        favoritosSnapshot.forEach(docSnapshot => {
            favoritos.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });
        });

        // Ordenar por fecha de agregado (más reciente primero)
        favoritos.sort((a, b) => new Date(b.fechaAgregado) - new Date(a.fechaAgregado));

        totalElement.textContent = favoritos.length;

        // Cargar detalles completos de la API para cada favorito
        for (const favorito of favoritos) {
            try {
                const response = await fetch(`https://restcountries.com/v3.1/alpha/${favorito.paisCodigo}`);
                const [paisData] = await response.json();
                
                const card = crearTarjetaFavorito(paisData, favorito.id, favorito.fechaAgregado);
                container.appendChild(card);
            } catch (error) {
                console.error(`Error al cargar detalles de ${favorito.paisNombre}:`, error);
                // Mostrar tarjeta básica si falla la API
                const cardBasica = crearTarjetaFavoritoBasica(favorito);
                container.appendChild(cardBasica);
            }
        }

    } catch (error) {
        loading.style.display = "none";
        container.innerHTML = '<p class="error">Error al cargar favoritos. Por favor, intenta nuevamente.</p>';
        console.error("Error al cargar favoritos:", error);
    }
}

function crearTarjetaFavorito(pais, favoritoId, fechaAgregado) {
    const card = document.createElement('div');
    card.className = 'pais-card favorito-card';
    
    const nombreComun = pais.name.common;
    const nombreOficial = pais.name.official;
    const capital = pais.capital ? pais.capital[0] : 'No disponible';
    const poblacion = pais.population ? pais.population.toLocaleString() : 'No disponible';
    const area = pais.area ? pais.area.toLocaleString() : 'No disponible';
    const idiomas = pais.languages ? Object.values(pais.languages).join(', ') : 'No disponible';
    const monedas = pais.currencies ? Object.values(pais.currencies).map(c => c.name).join(', ') : 'No disponible';
    const bandera = pais.flags.svg || pais.flags.png;
    const continente = pais.continents ? pais.continents.join(', ') : 'No disponible';
    
    const fecha = new Date(fechaAgregado);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    card.innerHTML = `
        <div class="favorito-badge">⭐ Favorito</div>
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
                <p><strong>🌍 Continente:</strong> ${continente}</p>
                <p><strong>🗣️ Idiomas:</strong> ${idiomas}</p>
                <p><strong>💰 Monedas:</strong> ${monedas}</p>
                <p class="fecha-agregado"><em>Agregado el ${fechaFormateada}</em></p>
            </div>
            <button class="btn-eliminar" data-id="${favoritoId}" data-nombre="${nombreComun}">
                🗑️ Eliminar de Favoritos
            </button>
        </div>
    `;

    const btnEliminar = card.querySelector('.btn-eliminar');
    btnEliminar.addEventListener('click', () => eliminarFavorito(favoritoId, nombreComun));

    return card;
}

function crearTarjetaFavoritoBasica(favorito) {
    const card = document.createElement('div');
    card.className = 'pais-card favorito-card';
    
    const fecha = new Date(favorito.fechaAgregado);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    card.innerHTML = `
        <div class="favorito-badge">⭐ Favorito</div>
        <div class="flag-container">
            <img src="${favorito.paisBandera}" alt="Bandera de ${favorito.paisNombre}" class="flag-img">
        </div>
        <div class="pais-info">
            <h3>${favorito.paisNombre}</h3>
            <p class="fecha-agregado"><em>Agregado el ${fechaFormateada}</em></p>
            <p class="error-detalle">No se pudieron cargar los detalles completos</p>
            <button class="btn-eliminar" data-id="${favorito.id}" data-nombre="${favorito.paisNombre}">
                🗑️ Eliminar de Favoritos
            </button>
        </div>
    `;

    const btnEliminar = card.querySelector('.btn-eliminar');
    btnEliminar.addEventListener('click', () => eliminarFavorito(favorito.id, favorito.paisNombre));

    return card;
}

async function eliminarFavorito(favoritoId, nombrePais) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombrePais}" de tus favoritos?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'favoritos', favoritoId));
        alert(`${nombrePais} eliminado de favoritos`);
        cargarFavoritos(); // Recargar la lista
    } catch (error) {
        console.error("Error al eliminar favorito:", error);
        alert("Error al eliminar el favorito");
    }
}
