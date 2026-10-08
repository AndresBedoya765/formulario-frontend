// ============================================
// Formulario - Tecnológico de Antioquia
// Registro de personas consumiendo la API del backend (Node + Express + MySQL)
// ============================================

// Dirección de la API (el backend en Node corre en el puerto 3000)
const URL_API = "http://localhost:3000/usuarios";

// Aquí guardamos el id de la persona que se está editando (null = ninguna)
let idEditando = null;

// ---------- Referencias a los elementos del HTML ----------
const tipoDocumento = document.getElementById("tipo_documento");
const numeroDocumento = document.getElementById("numero_documento");
const nombres = document.getElementById("nombres");
const apellidos = document.getElementById("apellidos");
const direccion = document.getElementById("direccion");
const ciudad = document.getElementById("ciudad");
const fechaNacimiento = document.getElementById("fecha_nacimiento");
const correo = document.getElementById("correo");

const btnGuardar = document.getElementById("btnGuardar");
const btnActualizar = document.getElementById("btnActualizar");
const btnEliminar = document.getElementById("btnEliminar");
const btnLimpiar = document.getElementById("btnLimpiar");

const mensaje = document.getElementById("mensaje");
const cuerpoTabla = document.getElementById("cuerpoTabla");

const campos = [tipoDocumento, numeroDocumento, nombres, apellidos,
                direccion, ciudad, fechaNacimiento, correo];

// El botón Eliminar del formulario ya no se usa: ahora eliminar se hace desde la grilla
btnEliminar.style.display = "none";

// ---------- Funciones auxiliares ----------

// Muestra un mensaje al usuario (tipo: "ok", "error" o "info")
function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = tipo;
}

// Cambia entre modo "nuevo" (Guardar habilitado) y modo "edición" (Actualizar habilitado)
function configurarBotones(editando) {
  btnGuardar.disabled = editando;
  btnActualizar.disabled = !editando;
}

// Limpia el formulario y vuelve al modo nuevo
function limpiarFormulario() {
  campos.forEach(function (campo) {
    campo.value = "";
    campo.classList.remove("error");
  });
  idEditando = null;
  configurarBotones(false);
}

// Valida que todos los campos estén llenos y con formato correcto
function validarCampos() {
  let valido = true;

  campos.forEach(function (campo) {
    if (campo.value.trim() === "") {
      campo.classList.add("error");
      valido = false;
    } else {
      campo.classList.remove("error");
    }
  });

  if (!valido) {
    mostrarMensaje("Todos los campos son obligatorios.", "error");
    return false;
  }

  // Número de documento: solo dígitos (el pasaporte puede traer letras)
  if (tipoDocumento.value !== "PA" && !/^\d+$/.test(numeroDocumento.value.trim())) {
    numeroDocumento.classList.add("error");
    mostrarMensaje("El número de documento solo debe contener números.", "error");
    return false;
  }

  // Correo con formato básico
  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formatoCorreo.test(correo.value.trim())) {
    correo.classList.add("error");
    mostrarMensaje("El correo electrónico no es válido.", "error");
    return false;
  }

  // La fecha de nacimiento no puede ser futura
  if (new Date(fechaNacimiento.value) > new Date()) {
    fechaNacimiento.classList.add("error");
    mostrarMensaje("La fecha de nacimiento no puede ser futura.", "error");
    return false;
  }

  return true;
}

// Crea un objeto persona con los datos del formulario
function leerFormulario() {
  return {
    tipoDocumento: tipoDocumento.value,
    numeroDocumento: numeroDocumento.value.trim(),
    nombres: nombres.value.trim(),
    apellidos: apellidos.value.trim(),
    direccion: direccion.value.trim(),
    ciudad: ciudad.value,
    fechaNacimiento: fechaNacimiento.value,
    correo: correo.value.trim()
  };
}

// Pasa los datos de una persona a los campos del formulario
function llenarFormulario(persona) {
  tipoDocumento.value = persona.tipoDocumento;
  numeroDocumento.value = persona.numeroDocumento;
  nombres.value = persona.nombres;
  apellidos.value = persona.apellidos;
  direccion.value = persona.direccion;
  ciudad.value = persona.ciudad;
  fechaNacimiento.value = persona.fechaNacimiento;
  correo.value = persona.correo;
}

// ---------- Consumo de la API (fetch) ----------

// GET: trae todas las personas del db.json
async function obtenerPersonas() {
  const respuesta = await fetch(URL_API);
  if (!respuesta.ok) {
    throw new Error("Error al consultar las personas");
  }
  return await respuesta.json();
}

// Revisa si ya existe otra persona con el mismo tipo y número de documento.
// idIgnorar sirve para no compararla consigo misma cuando se actualiza.
async function existeDocumento(tipo, numero, idIgnorar) {
  const personas = await obtenerPersonas();
  return personas.some(function (p) {
    return p.tipoDocumento === tipo &&
           p.numeroDocumento === numero &&
           String(p.id) !== String(idIgnorar);
  });
}

// Dibuja la tabla con las personas que vienen de la API
async function mostrarTabla() {
  try {
    const personas = await obtenerPersonas();
    cuerpoTabla.innerHTML = "";

    personas.forEach(function (p) {
      const fila = document.createElement("tr");

      // Columnas con los datos
      const datos = [p.tipoDocumento, p.numeroDocumento, p.nombres, p.apellidos,
                     p.direccion, p.ciudad, p.fechaNacimiento, p.correo];
      datos.forEach(function (dato) {
        const celda = document.createElement("td");
        celda.textContent = dato;
        fila.appendChild(celda);
      });

      // Columna con los botones Actualizar y Eliminar
      const celdaAcciones = document.createElement("td");

      const botonActualizar = document.createElement("button");
      botonActualizar.textContent = "Actualizar";
      botonActualizar.addEventListener("click", function () {
        cargarParaActualizar(p);
      });

      const botonEliminar = document.createElement("button");
      botonEliminar.textContent = "Eliminar";
      botonEliminar.addEventListener("click", function () {
        eliminarPersona(p);
      });

      celdaAcciones.appendChild(botonActualizar);
      celdaAcciones.appendChild(botonEliminar);
      fila.appendChild(celdaAcciones);

      cuerpoTabla.appendChild(fila);
    });
  } catch (error) {
    mostrarMensaje("No se pudo conectar con la API. ¿Está corriendo el servidor Node?", "error");
    console.error(error);
  }
}

// ---------- Acciones de la grilla ----------

// Botón Actualizar de la grilla: carga la persona en el formulario
function cargarParaActualizar(persona) {
  llenarFormulario(persona);
  idEditando = persona.id;
  configurarBotones(true);
  mostrarMensaje("Modifique los datos y presione Actualizar.", "info");
}

// Botón Eliminar de la grilla: pregunta y luego hace DELETE
async function eliminarPersona(persona) {
  const confirmar = confirm("¿Realmente desea eliminar a " + persona.nombres + " " + persona.apellidos + "?");
  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(URL_API + "/" + persona.id, {
      method: "DELETE"
    });
    if (!respuesta.ok) {
      throw new Error("Error al eliminar");
    }

    // Si estaba editando a la persona eliminada, se limpia el formulario
    if (String(idEditando) === String(persona.id)) {
      limpiarFormulario();
    }
    await mostrarTabla();
    mostrarMensaje("Persona eliminada correctamente.", "ok");
  } catch (error) {
    mostrarMensaje("No se pudo eliminar la persona.", "error");
    console.error(error);
  }
}

// ---------- Eventos de los botones del formulario ----------

// Guardar: método POST
btnGuardar.addEventListener("click", async function () {
  if (!validarCampos()) {
    return;
  }

  const persona = leerFormulario();

  try {
    if (await existeDocumento(persona.tipoDocumento, persona.numeroDocumento, null)) {
      mostrarMensaje("Ya existe una persona con ese tipo y número de documento.", "error");
      return;
    }

    const respuesta = await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona)
    });
    if (!respuesta.ok) {
      throw new Error("Error al guardar");
    }

    limpiarFormulario();
    await mostrarTabla();
    mostrarMensaje("Persona guardada correctamente.", "ok");
  } catch (error) {
    mostrarMensaje("No se pudo guardar la persona.", "error");
    console.error(error);
  }
});

// Actualizar: método PUT
btnActualizar.addEventListener("click", async function () {
  if (idEditando === null || !validarCampos()) {
    return;
  }

  const persona = leerFormulario();

  try {
    if (await existeDocumento(persona.tipoDocumento, persona.numeroDocumento, idEditando)) {
      mostrarMensaje("Ya existe otra persona con ese tipo y número de documento.", "error");
      return;
    }

    const respuesta = await fetch(URL_API + "/" + idEditando, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona)
    });
    if (!respuesta.ok) {
      throw new Error("Error al actualizar");
    }

    limpiarFormulario();
    await mostrarTabla();
    mostrarMensaje("Persona actualizada correctamente.", "ok");
  } catch (error) {
    mostrarMensaje("No se pudo actualizar la persona.", "error");
    console.error(error);
  }
});

// Limpiar: cancela la edición si había una
btnLimpiar.addEventListener("click", function () {
  limpiarFormulario();
  mostrarMensaje("", "");
});

// ---------- Inicio ----------
// Al cargar la página: Guardar habilitado, Actualizar deshabilitado y se llena la grilla
configurarBotones(false);
mostrarTabla();
