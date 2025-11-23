import { auth, db } from '../firebaseConfig.js';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, addDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import mostrarLogin from './login.js';
import mostrarHome from './home.js';

let paisesData = [];
let preguntaActual = 0;
let puntaje = 0;
let preguntasTrivia = [];
let respuestasUsuario = [];

export default async function mostrarTrivia() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="home-container">
            <nav class="navbar">
                <div class="nav-brand">
                    <h1>🎯 Trivia de Países</h1>
                </div>
                <div class="nav-user">
                    <span id="userName">Cargando...</span>
                    <button id="btnHome" class="btn-nav">🏠 Inicio</button>
                    <button id="btnCerrarSesion" class="btn-nav btn-logout">Cerrar Sesión</button>
                </div>
            </nav>
            
            <div class="main-content">
                <div class="trivia-container">
                    <div id="triviaInicio" class="trivia-inicio">
                        <h2>🌍 ¿Cuánto sabes sobre los países de América?</h2>
                        <p>Pon a prueba tus conocimientos con esta trivia de 10 preguntas</p>
                        <div class="trivia-stats">
                            <div class="stat-card">
                                <h3 id="totalJugadas">0</h3>
                                <p>Partidas Jugadas</p>
                            </div>
                            <div class="stat-card">
                                <h3 id="mejorPuntaje">0</h3>
                                <p>Mejor Puntaje</p>
                            </div>
                        </div>
                        <button id="btnIniciarTrivia" class="btn-trivia-start">🎮 Iniciar Trivia</button>
                        
                        <div class="ranking-section">
                            <h3>🏆 Ranking Top 10</h3>
                            <div id="rankingLista" class="ranking-lista">
                                <p class="loading">Cargando ranking...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="triviaJuego" class="trivia-juego" style="display: none;">
                        <div class="trivia-header">
                            <div class="trivia-progress">
                                <span id="preguntaNumero">Pregunta 1/10</span>
                                <div class="progress-bar">
                                    <div id="progressFill" class="progress-fill"></div>
                                </div>
                            </div>
                            <div class="trivia-puntaje">
                                <span>Puntaje: <strong id="puntajeActual">0</strong></span>
                            </div>
                        </div>
                        
                        <div class="trivia-pregunta">
                            <h3 id="preguntaTexto"></h3>
                            <div id="banderaContainer" class="bandera-trivia"></div>
                        </div>
                        
                        <div id="opcionesContainer" class="opciones-container"></div>
                        
                        <button id="btnSiguiente" class="btn-siguiente" style="display: none;">
                            Siguiente Pregunta →
                        </button>
                    </div>
                    
                    <div id="triviaResultado" class="trivia-resultado" style="display: none;">
                        <h2>🎉 ¡Trivia Completada!</h2>
                        <div class="resultado-puntaje">
                            <h3>Tu puntaje</h3>
                            <div class="puntaje-final">
                                <span id="puntajeFinal">0</span>
                                <span class="puntaje-total">/100</span>
                            </div>
                            <p id="mensajeResultado"></p>
                        </div>
                        
                        <div class="resultado-detalles">
                            <h3>📊 Resumen de Respuestas</h3>
                            <div id="resumenRespuestas"></div>
                        </div>
                        
                        <div class="resultado-acciones">
                            <button id="btnJugarOtraVez" class="btn-primary">🔄 Jugar Otra Vez</button>
                            <button id="btnVolverHome" class="btn-secondary">🏠 Volver al Inicio</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await cargarNombreUsuario();
    await cargarEstadisticas();
    await cargarRanking();

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

    document.getElementById("btnIniciarTrivia").addEventListener("click", iniciarTrivia);
}

async function cargarNombreUsuario() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById("userName").textContent = `Hola, ${userData.nombre}`;
            }
        }
    } catch (error) {
        console.error("Error al cargar el nombre del usuario:", error);
    }
}

async function cargarEstadisticas() {
    try {
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById("totalJugadas").textContent = userData.triviaJugadas || 0;
            document.getElementById("mejorPuntaje").textContent = userData.puntajeTrivia || 0;
        }
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}

async function cargarRanking() {
    try {
        const rankingQuery = query(
            collection(db, 'usuarios'),
            orderBy('puntajeTrivia', 'desc'),
            limit(10)
        );
        const rankingSnapshot = await getDocs(rankingQuery);
        
        const rankingLista = document.getElementById("rankingLista");
        
        if (rankingSnapshot.empty) {
            rankingLista.innerHTML = '<p class="no-results">Aún no hay jugadores en el ranking</p>';
            return;
        }
        
        let html = '';
        let posicion = 1;
        rankingSnapshot.forEach(doc => {
            const data = doc.data();
            const esUsuarioActual = auth.currentUser && doc.id === auth.currentUser.uid;
            html += `
                <div class="ranking-item ${esUsuarioActual ? 'ranking-usuario-actual' : ''}">
                    <span class="ranking-posicion">${posicion}</span>
                    <span class="ranking-nombre">${data.nombre}</span>
                    <span class="ranking-puntaje">${data.puntajeTrivia || 0} pts</span>
                </div>
            `;
            posicion++;
        });
        
        rankingLista.innerHTML = html;
    } catch (error) {
        console.error("Error al cargar ranking:", error);
        document.getElementById("rankingLista").innerHTML = '<p class="error">Error al cargar el ranking</p>';
    }
}

async function iniciarTrivia() {
    document.getElementById("triviaInicio").style.display = "none";
    document.getElementById("triviaJuego").style.display = "block";
    
    try {
        const response = await fetch('https://restcountries.com/v3.1/region/america');
        paisesData = await response.json();
        
        generarPreguntas();
        preguntaActual = 0;
        puntaje = 0;
        respuestasUsuario = [];
        
        mostrarPregunta();
    } catch (error) {
        console.error("Error al cargar países:", error);
        alert("Error al cargar la trivia. Intenta nuevamente.");
    }
}

function generarPreguntas() {
    preguntasTrivia = [];
    const paisesUsados = new Set();
    
    // Generar 10 preguntas variadas
    for (let i = 0; i < 10; i++) {
        let paisAleatorio;
        do {
            paisAleatorio = paisesData[Math.floor(Math.random() * paisesData.length)];
        } while (paisesUsados.has(paisAleatorio.cca3));
        
        paisesUsados.add(paisAleatorio.cca3);
        
        const tipoPregunta = i % 4; // 4 tipos de preguntas
        
        switch(tipoPregunta) {
            case 0: // Capital
                preguntasTrivia.push(generarPreguntaCapital(paisAleatorio));
                break;
            case 1: // Bandera
                preguntasTrivia.push(generarPreguntaBandera(paisAleatorio));
                break;
            case 2: // Población
                preguntasTrivia.push(generarPreguntaPoblacion(paisAleatorio));
                break;
            case 3: // Moneda
                preguntasTrivia.push(generarPreguntaMoneda(paisAleatorio));
                break;
        }
    }
}

function generarPreguntaCapital(pais) {
    const capital = pais.capital ? pais.capital[0] : null;
    if (!capital) return generarPreguntaBandera(pais);
    
    const opciones = [capital];
    while (opciones.length < 4) {
        const paisRandom = paisesData[Math.floor(Math.random() * paisesData.length)];
        const capitalRandom = paisRandom.capital ? paisRandom.capital[0] : null;
        if (capitalRandom && !opciones.includes(capitalRandom)) {
            opciones.push(capitalRandom);
        }
    }
    
    return {
        pregunta: `¿Cuál es la capital de ${pais.name.common}?`,
        opciones: opciones.sort(() => Math.random() - 0.5),
        respuestaCorrecta: capital,
        tipo: 'capital',
        pais: pais.name.common
    };
}

function generarPreguntaBandera(pais) {
    const opciones = [pais.name.common];
    while (opciones.length < 4) {
        const paisRandom = paisesData[Math.floor(Math.random() * paisesData.length)];
        if (!opciones.includes(paisRandom.name.common)) {
            opciones.push(paisRandom.name.common);
        }
    }
    
    return {
        pregunta: '¿A qué país pertenece esta bandera?',
        opciones: opciones.sort(() => Math.random() - 0.5),
        respuestaCorrecta: pais.name.common,
        bandera: pais.flags.svg,
        tipo: 'bandera',
        pais: pais.name.common
    };
}

function generarPreguntaPoblacion(pais) {
    const poblacion = pais.population;
    const opciones = [pais.name.common];
    
    while (opciones.length < 4) {
        const paisRandom = paisesData[Math.floor(Math.random() * paisesData.length)];
        if (!opciones.includes(paisRandom.name.common) && 
            Math.abs(paisRandom.population - poblacion) > 5000000) {
            opciones.push(paisRandom.name.common);
        }
    }
    
    return {
        pregunta: `¿Qué país tiene aproximadamente ${poblacion.toLocaleString()} habitantes?`,
        opciones: opciones.sort(() => Math.random() - 0.5),
        respuestaCorrecta: pais.name.common,
        tipo: 'poblacion',
        pais: pais.name.common
    };
}

function generarPreguntaMoneda(pais) {
    const monedas = pais.currencies;
    if (!monedas) return generarPreguntaCapital(pais);
    
    const moneda = Object.values(monedas)[0].name;
    const opciones = [pais.name.common];
    
    while (opciones.length < 4) {
        const paisRandom = paisesData[Math.floor(Math.random() * paisesData.length)];
        if (!opciones.includes(paisRandom.name.common)) {
            opciones.push(paisRandom.name.common);
        }
    }
    
    return {
        pregunta: `¿Qué país utiliza ${moneda} como moneda?`,
        opciones: opciones.sort(() => Math.random() - 0.5),
        respuestaCorrecta: pais.name.common,
        tipo: 'moneda',
        pais: pais.name.common
    };
}

function mostrarPregunta() {
    const pregunta = preguntasTrivia[preguntaActual];
    
    document.getElementById("preguntaNumero").textContent = `Pregunta ${preguntaActual + 1}/10`;
    document.getElementById("preguntaTexto").textContent = pregunta.pregunta;
    document.getElementById("puntajeActual").textContent = puntaje;
    
    const progressPercent = ((preguntaActual + 1) / 10) * 100;
    document.getElementById("progressFill").style.width = `${progressPercent}%`;
    
    // Mostrar bandera si es necesario
    const banderaContainer = document.getElementById("banderaContainer");
    if (pregunta.bandera) {
        banderaContainer.innerHTML = `<img src="${pregunta.bandera}" alt="Bandera" class="flag-trivia">`;
    } else {
        banderaContainer.innerHTML = '';
    }
    
    // Mostrar opciones
    const opcionesContainer = document.getElementById("opcionesContainer");
    opcionesContainer.innerHTML = '';
    
    pregunta.opciones.forEach((opcion, index) => {
        const button = document.createElement('button');
        button.className = 'opcion-btn';
        button.textContent = opcion;
        button.addEventListener('click', () => seleccionarRespuesta(opcion, button));
        opcionesContainer.appendChild(button);
    });
    
    document.getElementById("btnSiguiente").style.display = "none";
}

function seleccionarRespuesta(respuesta, botonSeleccionado) {
    const pregunta = preguntasTrivia[preguntaActual];
    const esCorrecta = respuesta === pregunta.respuestaCorrecta;
    
    // Deshabilitar todos los botones
    const botones = document.querySelectorAll('.opcion-btn');
    botones.forEach(btn => btn.disabled = true);
    
    // Marcar respuesta
    if (esCorrecta) {
        botonSeleccionado.classList.add('correcta');
        puntaje += 10;
        document.getElementById("puntajeActual").textContent = puntaje;
    } else {
        botonSeleccionado.classList.add('incorrecta');
        // Mostrar la correcta
        botones.forEach(btn => {
            if (btn.textContent === pregunta.respuestaCorrecta) {
                btn.classList.add('correcta');
            }
        });
    }
    
    // Guardar respuesta
    respuestasUsuario.push({
        pregunta: pregunta.pregunta,
        respuestaUsuario: respuesta,
        respuestaCorrecta: pregunta.respuestaCorrecta,
        esCorrecta
    });
    
    // Mostrar botón siguiente
    document.getElementById("btnSiguiente").style.display = "block";
    document.getElementById("btnSiguiente").onclick = siguientePregunta;
}

function siguientePregunta() {
    preguntaActual++;
    
    if (preguntaActual < preguntasTrivia.length) {
        mostrarPregunta();
    } else {
        mostrarResultado();
    }
}

async function mostrarResultado() {
    document.getElementById("triviaJuego").style.display = "none";
    document.getElementById("triviaResultado").style.display = "block";
    
    document.getElementById("puntajeFinal").textContent = puntaje;
    
    let mensaje = '';
    if (puntaje === 100) {
        mensaje = '🏆 ¡Perfecto! Eres un experto en geografía de América';
    } else if (puntaje >= 80) {
        mensaje = '🌟 ¡Excelente! Conoces muy bien los países';
    } else if (puntaje >= 60) {
        mensaje = '👍 ¡Bien hecho! Tienes buenos conocimientos';
    } else if (puntaje >= 40) {
        mensaje = '📚 No está mal, pero puedes mejorar';
    } else {
        mensaje = '💪 Sigue practicando, ¡tú puedes!';
    }
    document.getElementById("mensajeResultado").textContent = mensaje;
    
    // Mostrar resumen
    const resumenContainer = document.getElementById("resumenRespuestas");
    let resumenHTML = '';
    respuestasUsuario.forEach((resp, index) => {
        resumenHTML += `
            <div class="respuesta-item ${resp.esCorrecta ? 'respuesta-correcta' : 'respuesta-incorrecta'}">
                <div class="respuesta-numero">${index + 1}</div>
                <div class="respuesta-contenido">
                    <p class="respuesta-pregunta">${resp.pregunta}</p>
                    ${!resp.esCorrecta ? `
                        <p class="respuesta-incorrecta-text">Tu respuesta: ${resp.respuestaUsuario}</p>
                        <p class="respuesta-correcta-text">Correcta: ${resp.respuestaCorrecta}</p>
                    ` : `
                        <p class="respuesta-correcta-text">✓ Correcta</p>
                    `}
                </div>
            </div>
        `;
    });
    resumenContainer.innerHTML = resumenHTML;
    
    // Guardar puntaje en Firebase
    await guardarPuntaje();
    
    document.getElementById("btnJugarOtraVez").addEventListener("click", () => {
        document.getElementById("triviaResultado").style.display = "none";
        mostrarTrivia();
    });
    
    document.getElementById("btnVolverHome").addEventListener("click", () => {
        mostrarHome();
    });
}

async function guardarPuntaje() {
    try {
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        const userData = userDoc.data();
        
        const puntajeAnterior = userData.puntajeTrivia || 0;
        const nuevoPuntaje = Math.max(puntaje, puntajeAnterior);
        
        await updateDoc(doc(db, 'usuarios', user.uid), {
            puntajeTrivia: nuevoPuntaje,
            triviaJugadas: increment(1)
        });
        
        // Guardar historial
        await addDoc(collection(db, 'triviaHistorial'), {
            userId: user.uid,
            puntaje: puntaje,
            fecha: new Date().toISOString(),
            respuestas: respuestasUsuario.length,
            correctas: respuestasUsuario.filter(r => r.esCorrecta).length
        });
        
        console.log('Puntaje guardado correctamente');
    } catch (error) {
        console.error('Error al guardar puntaje:', error);
    }
}
