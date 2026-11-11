const API = {
    urlBase: '/api',
    async request(endpoint, method = 'GET', data = null) {
        const opciones = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        };
        if (data !== null) opciones.body = JSON.stringify(data);
        try {
            const respuesta = await fetch(this.urlBase + endpoint, opciones);
            const texto = await respuesta.text();
            let json;
            try {
                json = JSON.parse(texto);
            } catch (error) {
                console.error('La API devolvió una respuesta que no es JSON:', texto);
                return { status: 'error', message: 'El servidor devolvió un error. Revisá el registro de PHP.' };
            }
            if (!respuesta.ok && json.status === 'ok') json.status = 'error';
            return json;
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            return { status: 'error', message: 'No se pudo conectar con la API' };
        }
    },
    async subir(endpoint, formData) {
        try {
            const respuesta = await fetch(this.urlBase + endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            const texto = await respuesta.text();
            try {
                return JSON.parse(texto);
            } catch (error) {
                console.error('La API devolvió una respuesta que no es JSON:', texto);
                return { status: 'error', message: 'El servidor devolvió un error.' };
            }
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            return { status: 'error', message: 'No se pudo conectar con la API' };
        }
    }
};
