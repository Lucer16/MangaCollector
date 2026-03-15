// CONFIGURACIÓN DE DESCUENTOS
const CONFIG_DESCUENTOS = {
    codigoActivo: "INAUGURACION", // Cambia este código cuando quieras
    porcentaje: 20,               // Porcentaje de descuento
    fechaLimite: "2026-06-31",    // Fecha límite de validez
    mensajeInauguracion: "¡Cupón de Bienvenida aplicado con éxito! 🌸"
};

/**
 * Valida si el código es correcto y si aún está vigente
 */
function validarDescuento(inputCodigo) {
    const hoy = new Date();
    const limite = new Date(CONFIG_DESCUENTOS.fechaLimite);
    
    if (inputCodigo.toUpperCase().trim() === CONFIG_DESCUENTOS.codigoActivo && hoy <= limite) {
        return {
            valido: true,
            porcentaje: CONFIG_DESCUENTOS.porcentaje,
            mensaje: CONFIG_DESCUENTOS.mensajeInauguracion
        };
    }
    return { valido: false };
}