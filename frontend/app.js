const BACKEND_URL = 'http://127.0.0.1:5000';

// Función para convertir segundos a HH:MM:SS
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función para enviar el enlace al backend y obtener subtítulos
async function fetchSubtitles(videoUrl) {
    try {
        const response = await fetch(`${BACKEND_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl }),
        });

        if (response.ok) {
            const data = await response.json();

            // Procesar solo los campos necesarios
            const subtitles = data.subtitles.map((subtitle) => ({
                start: subtitle.start,
                end: subtitle.end,
                text: subtitle.text.trim(), // Elimina espacios adicionales
            }));

            return subtitles;
        } else {
            const errorText = await response.text();
            console.error('Error al obtener subtítulos:', errorText);
            alert(`Error del servidor: ${errorText}`);
            return [];
        }
    } catch (error) {
        console.error('Error de red o conexión:', error);
        alert('Ocurrió un error al conectar con el backend.');
        return [];
    }
}

// Mostrar subtítulos en la página
document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('video_url').value.trim();

    // Validar el enlace del video
    if (!videoUrl || !videoUrl.includes('youtube.com/watch?v=')) {
        alert('Por favor, introduce un enlace válido de YouTube.');
        return;
    }

    // Muestra el spinner
    document.getElementById('loading').style.display = 'block';

    // Llama a la función para obtener subtítulos
    const subtitles = await fetchSubtitles(videoUrl);

    // Oculta el spinner
    document.getElementById('loading').style.display = 'none';

    console.log('Subtítulos obtenidos:', subtitles);

    // Guardar subtítulos globalmente para búsquedas y descargas
    window.subtitles = subtitles;

    // Mostrar subtítulos al usuario
    const resultsDiv = document.getElementById('results');
    if (subtitles.length === 0) {
        resultsDiv.innerHTML =
            '<p>No se generaron subtítulos. Verifica el video.</p>';
        return;
    }

    resultsDiv.innerHTML = '<h2>Subtítulos Generados:</h2>';
    subtitles.forEach((subtitle) => {
        resultsDiv.innerHTML += `<p><strong>${formatTime(
            subtitle.start,
        )} - ${formatTime(subtitle.end)}:</strong> ${subtitle.text}</p>`;
    });

    // Mostrar el formulario de búsqueda y botón de descarga
    document.getElementById('keywordForm').style.display = 'block';
    document.getElementById('downloadButton').style.display = 'block';
});

// Buscar palabras clave en los subtítulos
document.getElementById('keywordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = document.getElementById('keyword').value.toLowerCase();

    if (!keyword) {
        alert('Por favor, introduce una palabra clave.');
        return;
    }

    const filtered = window.subtitles.filter((subtitle) =>
        subtitle.text.toLowerCase().includes(keyword),
    );

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<h2>Resultados para "${keyword}":</h2>`;
    if (filtered.length === 0) {
        resultsDiv.innerHTML += '<p>No se encontraron resultados.</p>';
    } else {
        filtered.forEach((subtitle) => {
            resultsDiv.innerHTML += `<p><strong>${formatTime(
                subtitle.start,
            )} - ${formatTime(subtitle.end)}:</strong> ${subtitle.text}</p>`;
        });
    }
});

// Descargar subtítulos como archivo .txt
function downloadSubtitles(subtitles) {
    if (!subtitles || subtitles.length === 0) {
        alert('No hay subtítulos disponibles para descargar.');
        return;
    }

    const content = subtitles
        .map(
            (subtitle) =>
                `${formatTime(subtitle.start)} - ${formatTime(subtitle.end)}: ${
                    subtitle.text
                }`,
        )
        .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Vincular la función de descarga al botón
document.getElementById('downloadButton').addEventListener('click', () => {
    downloadSubtitles(window.subtitles);
});
