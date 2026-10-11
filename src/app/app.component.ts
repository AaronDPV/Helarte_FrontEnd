import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { Usuario, Servicio, Mesa, ReservaRequest, ReservaResponse } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  seccionActiva: 'dashboard' | 'reservas' | 'servicios' | 'mesas' | 'usuarios' = 'dashboard';
  modoRegistro: boolean = false;

  mensajeExito: string = '';
  mensajeError: string = '';
  cargandoLogin: boolean = false;

  servicios: Servicio[] = [];
  mesas: Mesa[] = [];
  reservas: ReservaResponse[] = [];
  usuarios: Usuario[] = [];

  filtroEstadoReserva: string = 'TODAS';
  busquedaServicio: string = '';

  modalReservaAbierto: boolean = false;
  modalServicioAbierto: boolean = false;
  modalMesaAbierto: boolean = false;
  modalUsuarioAbierto: boolean = false;
  modalEditarUsuarioAbierto: boolean = false;
  usuarioAEditar: Usuario | null = null;

  loginForm = {
    email: '',
    password: ''
  };

  registroForm: Usuario = {
    user: '',
    email: '',
    password: '',
    rol: 'CLIENTE',
    telefono: ''
  };

  nuevoServicio: Servicio = {
    nombre: '',
    descripcion: '',
    precio: 25.0,
    duracionMinutos: 60,
    activo: true
  };

  nuevaMesa: Mesa = {
    numeroMesa: 6,
    capacidad: 4,
    ubicacion: 'Terraza Helarte',
    estado: 'DISPONIBLE'
  };

  nuevaReserva: ReservaRequest = {
    mesaId: 1,
    servicioId: 1,
    fechaReserva: '2026-11-20',
    horaReserva: '18:00',
    cantidadPersonas: 2,
    observaciones: ''
  };

  nuevoUsuarioAdmin: Usuario = {
    user: '',
    email: '',
    password: '',
    rol: 'EMPLEADO',
    telefono: '',
    activo: true
  };

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    if (this.api.currentUser) {
      this.cargarTodo();
    }
  }

  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    setTimeout(() => this.mensajeExito = '', 4000);
  }

  mostrarError(err: any): void {
    let msg = 'Error en la solicitud.';
    if (err?.error?.message) {
      msg = err.error.message;
    } else if (err?.status === 401) {
      msg = 'Credenciales incorrectas o usuario no autorizado.';
    } else if (err?.message) {
      msg = err.message;
    }
    this.mensajeError = msg;
    this.mensajeExito = '';
    setTimeout(() => this.mensajeError = '', 5000);
  }

  iniciarSesion(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.mostrarError('Ingresa tu correo y contraseña.');
      return;
    }

    this.cargandoLogin = true;
    this.api.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: (res) => {
        this.cargandoLogin = false;
        this.api.saveLoggedUser(res);
        this.mostrarExito(res.mensaje || `Bienvenido(a) ${res.user}`);
        this.cargarTodo();
      },
      error: (err) => {
        this.cargandoLogin = false;
        this.mostrarError(err);
      }
    });
  }

  seleccionarCuentaDemo(email: string, pass: string): void {
    this.loginForm.email = email;
    this.loginForm.password = pass;
    this.iniciarSesion();
  }

  registrarCliente(): void {
    if (!this.registroForm.user || !this.registroForm.email || !this.registroForm.password) {
      this.mostrarError('Por favor completa todos los campos requeridos.');
      return;
    }

    this.api.registro(this.registroForm).subscribe({
      next: (res) => {
        this.mostrarExito(`Registro exitoso para ${res.user}. Ya puedes iniciar sesión.`);
        this.loginForm.email = this.registroForm.email;
        this.loginForm.password = this.registroForm.password || '';
        this.modoRegistro = false;
        this.iniciarSesion();
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cerrarSesion(): void {
    this.api.clearCredentials();
    this.seccionActiva = 'dashboard';
    this.mostrarExito('Has cerrado sesión correctamente.');
  }

  cargarTodo(): void {
    this.cargarServicios();
    this.cargarMesas();
    this.cargarReservas();
    if (this.esAdmin()) {
      this.cargarUsuarios();
    }
  }

  cargarServicios(): void {
    this.api.getServicios().subscribe({
      next: (data) => this.servicios = data,
      error: (err) => this.mostrarError(err)
    });
  }

  cargarMesas(): void {
    this.api.getMesas().subscribe({
      next: (data) => {
        this.mesas = data;
        if (this.mesas.length > 0 && !this.nuevaReserva.mesaId) {
          this.nuevaReserva.mesaId = this.mesas[0].id!;
        }
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cargarReservas(): void {
    this.api.getReservas().subscribe({
      next: (data) => this.reservas = data,
      error: (err) => this.mostrarError(err)
    });
  }

  cargarUsuarios(): void {
    this.api.getUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => this.mostrarError(err)
    });
  }

  crearServicio(): void {
    this.api.crearServicio(this.nuevoServicio).subscribe({
      next: (res) => {
        this.mostrarExito(`Servicio "${res.nombre}" creado.`);
        this.cargarServicios();
        this.modalServicioAbierto = false;
        this.nuevoServicio = { nombre: '', descripcion: '', precio: 25.0, duracionMinutos: 60, activo: true };
      },
      error: (err) => this.mostrarError(err)
    });
  }

  eliminarServicio(id: number): void {
    if (confirm('¿Eliminar servicio?')) {
      this.api.eliminarServicio(id).subscribe({
        next: () => {
          this.mostrarExito('Servicio eliminado.');
          this.cargarServicios();
        },
        error: (err) => this.mostrarError(err)
      });
    }
  }

  crearMesa(): void {
    this.api.crearMesa(this.nuevaMesa).subscribe({
      next: (res) => {
        this.mostrarExito(`Mesa #${res.numeroMesa} registrada.`);
        this.cargarMesas();
        this.modalMesaAbierto = false;
      },
      error: (err) => this.mostrarError(err)
    });
  }

  eliminarMesa(id: number): void {
    if (confirm('¿Eliminar mesa?')) {
      this.api.eliminarMesa(id).subscribe({
        next: () => {
          this.mostrarExito('Mesa eliminada.');
          this.cargarMesas();
        },
        error: (err) => this.mostrarError(err)
      });
    }
  }

  crearReserva(): void {
    this.api.crearReserva(this.nuevaReserva).subscribe({
      next: (res) => {
        this.mostrarExito(`Reserva confirmada con ticket: ${res.codigoReserva}`);
        this.cargarReservas();
        this.modalReservaAbierto = false;
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cambiarEstado(id: number, estado: string): void {
    this.api.cambiarEstadoReserva(id, estado).subscribe({
      next: (act) => {
        this.mostrarExito(`Ticket #${act.codigoReserva}: ${act.estado}`);
        this.cargarReservas();
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cancelarReserva(id: number): void {
    if (confirm('¿Cancelar reserva?')) {
      this.api.cancelarReserva(id).subscribe({
        next: () => {
          this.mostrarExito('Reserva cancelada.');
          this.cargarReservas();
        },
        error: (err) => this.mostrarError(err)
      });
    }
  }

  crearUsuario(): void {
    this.api.crearUsuario(this.nuevoUsuarioAdmin).subscribe({
      next: (res) => {
        this.mostrarExito(`Usuario ${res.user} creado (${res.rol}).`);
        this.cargarUsuarios();
        this.modalUsuarioAbierto = false;
        this.nuevoUsuarioAdmin = { user: '', email: '', password: '', rol: 'EMPLEADO', telefono: '', activo: true };
      },
      error: (err) => this.mostrarError(err)
    });
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Eliminar usuario?')) {
      this.api.eliminarUsuario(id).subscribe({
        next: () => {
          this.mostrarExito('Usuario eliminado.');
          this.cargarUsuarios();
        },
        error: (err) => this.mostrarError(err)
      });
    }
  }

  abrirEditarUsuario(u: Usuario): void {
    this.usuarioAEditar = { ...u, password: '' };
    this.modalEditarUsuarioAbierto = true;
  }

  guardarEdicionUsuario(): void {
    if (!this.usuarioAEditar || !this.usuarioAEditar.id) return;
    const payload: any = {
      user: this.usuarioAEditar.user,
      telefono: this.usuarioAEditar.telefono,
      rol: this.usuarioAEditar.rol,
      activo: this.usuarioAEditar.activo
    };
    if (this.usuarioAEditar.password && this.usuarioAEditar.password.trim() !== '') {
      payload.password = this.usuarioAEditar.password;
    }

    this.api.actualizarUsuario(this.usuarioAEditar.id, payload).subscribe({
      next: (act) => {
        this.mostrarExito(`Usuario ${act.user} actualizado.`);
        this.cargarUsuarios();
        this.modalEditarUsuarioAbierto = false;
        this.usuarioAEditar = null;
      },
      error: (err) => this.mostrarError(err)
    });
  }

  get reservasFiltradas(): ReservaResponse[] {
    if (this.filtroEstadoReserva === 'TODAS') return this.reservas;
    return this.reservas.filter(r => r.estado === this.filtroEstadoReserva);
  }

  get serviciosFiltrados(): Servicio[] {
    if (!this.busquedaServicio) return this.servicios;
    return this.servicios.filter(s =>
      s.nombre.toLowerCase().includes(this.busquedaServicio.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(this.busquedaServicio.toLowerCase())
    );
  }

  get totalReservas(): number { return this.reservas.length; }
  get reservasPendientes(): number { return this.reservas.filter(r => r.estado === 'PENDIENTE').length; }
  get reservasConfirmadas(): number { return this.reservas.filter(r => r.estado === 'CONFIRMADA' || r.estado === 'ATENDIDA').length; }
  get mesasDisponibles(): number { return this.mesas.filter(m => m.estado === 'DISPONIBLE').length; }
  get mesasTotales(): number { return this.mesas.length; }

  esAdmin(): boolean {
    return this.api.currentUser?.rol === 'ADMIN';
  }

  esEmpleadoOAdmin(): boolean {
    const rol = this.api.currentUser?.rol;
    return rol === 'ADMIN' || rol === 'EMPLEADO' || rol === 'COLABORADOR';
  }
}
