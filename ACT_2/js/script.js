// ===== Clase que representa una tarea individual =====
class Tarea {
  constructor(id, nombre, completa = false) {
    this.id = id;
    this.nombre = nombre;
    this.completa = completa;
  }

  completar() {
    this.completa = !this.completa;
  }

  editar(nuevoNombre) {
    this.nombre = nuevoNombre;
  }
}

// ===== Clase que gestiona todas las tareas =====
class GestorDeTareas {
  constructor() {
    this.tareas = [];


    this.$form = document.querySelector('#form-tarea');
    this.$input = document.querySelector('#nueva-tarea');
    this.$lista = document.querySelector('#lista-tareas');
    this.$error = document.querySelector('#mensaje-error');

    this.cargarDeLocalStorage();
    this.configurarEventos();
    this.render();
  }

  configurarEventos() {
    // Agregar tarea con submit del formulario
    this.$form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = this.$input.value.trim();
      this.agregarTarea(nombre);
    });

    // Delegación de eventos para Editar / Eliminar / Completar
    this.$lista.addEventListener('click', (e) => {
      const boton = e.target;
      const li = boton.closest('li');
      if (!li) return;

      const id = li.dataset.id;

      if (boton.classList.contains('btn-eliminar')) {
        this.eliminarTarea(id);
      } else if (boton.classList.contains('btn-editar')) {
        this.pedirEdicion(id);
      } else if (boton.classList.contains('btn-completar')) {
        this.toggleCompleta(id);
      }
    });
  }

  mostrarError(mensaje) {
    this.$error.textContent = mensaje;
  }

  limpiarError() {
    this.$error.textContent = '';
  }

  agregarTarea(nombre) {
    if (!nombre) {
      this.mostrarError('La tarea no puede estar vacía.');
      return;
    }

    this.limpiarError();

    const id = Date.now().toString();
    const tarea = new Tarea(id, nombre);

    this.tareas.push(tarea);
    this.guardarEnLocalStorage();
    this.render();

    this.$form.reset();
    this.$input.focus();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter((t) => t.id !== id);
    this.guardarEnLocalStorage();
    this.render();
  }

  pedirEdicion(id) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;

    const nuevoNombre = prompt('Editar tarea:', tarea.nombre);
    if (nuevoNombre === null) return; // Cancelado

    const limpio = nuevoNombre.trim();
    if (!limpio) {
      this.mostrarError('El nombre de la tarea no puede quedar vacío.');
      return;
    }

    this.limpiarError();
    tarea.editar(limpio);
    this.guardarEnLocalStorage();
    this.render();
  }

  toggleCompleta(id) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;

    tarea.completar();
    this.guardarEnLocalStorage();
    this.render();
  }

  // ===== LocalStorage =====
  guardarEnLocalStorage() {
    const data = this.tareas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      completa: t.completa
    }));
    localStorage.setItem('tareas-geredab', JSON.stringify(data));
  }

  cargarDeLocalStorage() {
    const data = localStorage.getItem('tareas-geredab');
    if (!data) return;

    try {
      const arreglo = JSON.parse(data);
      this.tareas = arreglo.map(
        (t) => new Tarea(t.id, t.nombre, t.completa)
      );
    } catch (error) {
      console.error('Error al leer LocalStorage', error);
      this.tareas = [];
    }
  }

  // ===== Renderizado en el DOM =====
  render() {
    this.$lista.innerHTML = '';

    this.tareas.forEach((tarea) => {
      const li = document.createElement('li');
      li.dataset.id = tarea.id;

      li.innerHTML = `
        <span class="nombre-tarea ${tarea.completa ? 'completa' : ''}">
          ${tarea.nombre}
        </span>
        <div class="task-actions">
          <button type="button" class="btn-completar">
            ${tarea.completa ? 'Desmarcar' : 'Completar'}
          </button>
          <button type="button" class="btn-editar">Editar</button>
          <button type="button" class="btn-eliminar">Eliminar</button>
        </div>
      `;

      this.$lista.appendChild(li);
    });
  }
}

new GestorDeTareas();
