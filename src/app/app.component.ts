import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { Usuario, Servicio, Mesa, ReservaRequest, ReservaResponse } from './models';

type AppSection = 'dashboard' | 'reservas' | 'servicios' | 'mesas' | 'usuarios' | 'empleados' | 'clientes' | 'perfil' | 'login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  seccionActiva: AppSection = 'dashboard';
  loginVisible = false;
  publicHomeVisible = false;
  mobileMenuOpen = false;
  restaurandoSesion = false;
  modoRegistro: boolean = false;

  mensajeExito: string = '';
  mensajeError: string = '';
  mensajeErrorReserva: string = '';
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

  constructor(public api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.mobileMenuOpen = false;
      this.seccionActiva = (data['section'] || 'dashboard') as AppSection;
      this.publicHomeVisible = this.route.snapshot.routeConfig?.path === 'inicio';
      this.loginVisible = this.seccionActiva === 'login';
      if (this.api.currentUser && this.seccionActiva === 'login') {
        this.irAlInicioPorRol();
        return;
      }
      if (this.seccionActiva !== 'reservas') this.modalReservaAbierto = false;
      this.cargarParaSeccion();
    });
    this.route.queryParamMap.subscribe(params => {
      if (params.get('nueva') === '1' && this.api.currentUser) this.modalReservaAbierto = true;
    });
    if (!this.api.currentUser && this.api.hasSavedCredentials()) {
      this.restaurandoSesion = true;
      this.api.restoreSession().subscribe({
        next: (user) => {
          this.api.saveLoggedUser(user);
          if (!this.publicHomeVisible) this.irAlInicioPorRol();
          this.restaurandoSesion = false;
        },
        error: () => {
          this.api.clearCredentials();
          this.restaurandoSesion = false;
        }
      });
    }
  }

  private irAlInicioPorRol(seccion: AppSection = 'dashboard'): void {
    const rol = this.api.currentUser?.rol;
    const prefijo = rol === 'ADMIN' ? 'admin' : rol === 'CLIENTE' ? 'cliente' : 'empleado';
    this.router.navigateByUrl(`/${prefijo}/${seccion}`);
  }

  navegarA(seccion: AppSection): void {
    const rol = this.api.currentUser?.rol;
    const permitidas: Record<string, AppSection[]> = {
      ADMIN: ['dashboard', 'reservas', 'servicios', 'mesas', 'usuarios', 'empleados', 'clientes'],
      EMPLEADO: ['dashboard', 'reservas', 'mesas'],
      COLABORADOR: ['dashboard', 'reservas', 'mesas'],
      CLIENTE: ['dashboard', 'reservas', 'perfil']
    };

    if (!rol || !permitidas[rol]?.includes(seccion)) {
      this.seccionActiva = 'dashboard';
      this.mostrarError('Esta sección no está disponible para tu cuenta.');
      return;
    }
    this.seccionActiva = seccion;
    this.mobileMenuOpen = false;
    const prefijo = rol === 'ADMIN' ? 'admin' : rol === 'CLIENTE' ? 'cliente' : 'empleado';
    this.router.navigateByUrl(`/${prefijo}/${seccion}`);
  }

  alternarMenuMovil(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  abrirLogin(): void {
    this.router.navigateByUrl('/iniciar-sesion');
  }

  irInicioPublico(): void {
    this.router.navigateByUrl('/inicio');
  }

  private rutaDashboard(): string {
    const rol = this.api.currentUser?.rol;
    return rol === 'ADMIN' ? '/admin/dashboard' : rol === 'CLIENTE' ? '/cliente/dashboard' : '/empleado/dashboard';
  }

  get pestanasNavegacion(): { seccion: AppSection; etiqueta: string }[] {
    if (this.esAdmin()) return [
      { seccion: 'dashboard', etiqueta: 'Resumen' },
      { seccion: 'reservas', etiqueta: 'Reservas' },
      { seccion: 'servicios', etiqueta: 'Servicios' },
      { seccion: 'mesas', etiqueta: 'Mesas' },
      { seccion: 'usuarios', etiqueta: 'Usuarios' },
      { seccion: 'empleados', etiqueta: 'Empleados' },
      { seccion: 'clientes', etiqueta: 'Clientes' }
    ];
    if (this.esEmpleadoOAdmin()) return [
      { seccion: 'dashboard', etiqueta: 'Resumen de sala' },
      { seccion: 'reservas', etiqueta: 'Reservas' },
      { seccion: 'mesas', etiqueta: 'Mesas' }
    ];
    if (this.esCliente()) return [
      { seccion: 'dashboard', etiqueta: 'Inicio' },
      { seccion: 'reservas', etiqueta: 'Mis reservas' },
      { seccion: 'perfil', etiqueta: 'Mi perfil' }
    ];
    return [];
  }

  private cargarParaSeccion(): void {
    if (this.publicHomeVisible) return;
    if (this.seccionActiva === 'servicios') this.cargarServicios();
    if (this.seccionActiva === 'mesas') this.cargarMesas();
    if (this.seccionActiva === 'reservas') {
      this.cargarReservas();
      this.cargarMesas();
      this.cargarServicios();
    }
    if (this.seccionActiva === 'dashboard') this.cargarTodo();
    if (this.api.currentUser && this.esAdmin() && ['usuarios', 'clientes', 'empleados'].includes(this.seccionActiva)) this.cargarUsuarios();
  }

  get reservasDeHoy(): ReservaResponse[] {
    const hoy = this.fechaLocalActual();
    return this.reservas.filter(reserva => reserva.fechaReserva === hoy);
  }

  get proximasReservas(): ReservaResponse[] {
    const hoy = this.fechaLocalActual();
    return this.reservas
      .filter(reserva => reserva.fechaReserva >= hoy && reserva.estado !== 'CANCELADA' && reserva.estado !== 'ATENDIDA')
      .sort((a, b) => `${a.fechaReserva} ${a.horaReserva}`.localeCompare(`${b.fechaReserva} ${b.horaReserva}`));
  }

  get duracionSeleccionada(): number {
    const servicio = this.servicios.find(s => Number(s.id) === Number(this.nuevaReserva.servicioId));
    return Math.max(15, Number(servicio?.duracionMinutos) || 60);
  }

  get horaFinSeleccionada(): string {
    return this.horaDesdeMinutos(this.minutosDeHora(this.nuevaReserva.horaReserva) + this.duracionSeleccionada);
  }

  get horariosDisponibles(): string[] {
    const mesa = this.mesas.find(m => Number(m.id) === Number(this.nuevaReserva.mesaId));
    if (!mesa || mesa.estado !== 'DISPONIBLE') return [];
    const apertura = 10 * 60 + 30;
    const cierre = 22 * 60;
    const ahora = new Date();
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    const esHoy = this.nuevaReserva.fechaReserva === this.fechaMinimaReserva;
    const opciones: string[] = [];
    for (let inicio = apertura; inicio + this.duracionSeleccionada <= cierre; inicio += 30) {
      if (esHoy && inicio <= minutoActual) continue;
      const hora = this.horaDesdeMinutos(inicio);
      if (!this.hayCruceEn(hora)) opciones.push(hora);
    }
    return opciones;
  }

  get mesasParaReserva(): Mesa[] {
    return this.mesas.filter(m => m.estado === 'DISPONIBLE' && m.capacidad >= Number(this.nuevaReserva.cantidadPersonas || 1) && this.tieneHorarioDisponible(m));
  }

  private tieneHorarioDisponible(mesa: Mesa): boolean {
    const apertura = 10 * 60 + 30;
    const cierre = 22 * 60;
    const duracion = this.duracionSeleccionada;
    const ahora = new Date();
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    const esHoy = this.nuevaReserva.fechaReserva === this.fechaMinimaReserva;
    for (let inicio = apertura; inicio + duracion <= cierre; inicio += 30) {
      if (esHoy && inicio <= minutoActual) continue;
      const fin = inicio + duracion;
      const ocupado = this.reservas.some(r => {
        if (r.estado === 'CANCELADA' || r.fechaReserva !== this.nuevaReserva.fechaReserva || Number(r.mesa.id) !== Number(mesa.id)) return false;
        const otroInicio = this.minutosDeHora(r.horaReserva);
        const otroFin = otroInicio + Math.max(15, Number(r.servicio?.duracionMinutos) || 60);
        return inicio < otroFin && otroInicio < fin;
      });
      if (!ocupado) return true;
    }
    return false;
  }

  get reservasEnConflicto(): ReservaResponse[] {
    const mesaId = Number(this.nuevaReserva.mesaId);
    const inicio = this.minutosDeHora(this.nuevaReserva.horaReserva);
    const fin = inicio + this.duracionSeleccionada;
    return this.reservas.filter(r => {
      if (r.estado === 'CANCELADA' || r.fechaReserva !== this.nuevaReserva.fechaReserva || Number(r.mesa.id) !== mesaId) return false;
      const otroInicio = this.minutosDeHora(r.horaReserva);
      const otroFin = otroInicio + Math.max(15, Number(r.servicio?.duracionMinutos) || 60);
      return inicio < otroFin && otroInicio < fin;
    });
  }

  get fechaMinimaReserva(): string { return this.fechaLocalActual(); }

  private hayCruceEn(hora: string): boolean {
    const inicio = this.minutosDeHora(hora);
    const fin = inicio + this.duracionSeleccionada;
    const mesaId = Number(this.nuevaReserva.mesaId);
    return this.reservas.some(r => {
      if (r.estado === 'CANCELADA' || r.fechaReserva !== this.nuevaReserva.fechaReserva || Number(r.mesa.id) !== mesaId) return false;
      const otroInicio = this.minutosDeHora(r.horaReserva);
      const otroFin = otroInicio + Math.max(15, Number(r.servicio?.duracionMinutos) || 60);
      return inicio < otroFin && otroInicio < fin;
    });
  }

  private minutosDeHora(hora: string): number {
    const [h, m] = (hora || '00:00').split(':').map(Number);
    return h * 60 + m;
  }

  private horaDesdeMinutos(minutos: number): string {
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
  }

  actualizarHorarioSeleccionado(): void {
    this.mensajeErrorReserva = '';
    if (!this.mesasParaReserva.some(m => Number(m.id) === Number(this.nuevaReserva.mesaId))) {
      this.nuevaReserva.mesaId = this.mesasParaReserva[0]?.id || 0;
    }
    if (!this.horariosDisponibles.includes(this.nuevaReserva.horaReserva)) {
      this.nuevaReserva.horaReserva = this.horariosDisponibles[0] || '';
    }
  }

  private fechaLocalActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  abrirReservaPublica(): void {
    if (!this.api.currentUser) {
      this.abrirLogin();
      this.modoRegistro = false;
      return;
    }
    this.abrirNuevaReserva();
  }

  abrirNuevaReserva(): void {
    if (!this.api.currentUser) {
      this.abrirLogin();
      return;
    }
    if (!['CLIENTE', 'ADMIN', 'EMPLEADO', 'COLABORADOR'].includes(this.api.currentUser.rol)) return;
    const rol = this.api.currentUser.rol;
    const prefijo = rol === 'ADMIN' ? 'admin' : rol === 'CLIENTE' ? 'cliente' : 'empleado';
    this.mensajeErrorReserva = '';
    if (!this.nuevaReserva.fechaReserva || this.nuevaReserva.fechaReserva < this.fechaMinimaReserva) {
      this.nuevaReserva.fechaReserva = this.fechaMinimaReserva;
    }
    this.actualizarHorarioSeleccionado();
    this.router.navigate([`/${prefijo}/reservas`], { queryParams: { nueva: 1 } });
  }

  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    setTimeout(() => this.mensajeExito = '', 4000);
  }

  mostrarError(err: any): void {
    const msg = typeof err === 'string' ? err
      : err?.status === 401 ? 'Correo o contraseña incorrectos.'
      : err?.status === 403 ? 'Tu cuenta no tiene permiso para realizar esta acción.'
      : err?.status === 0 ? 'No se pudo conectar. Inténtalo nuevamente en unos momentos.'
      : err?.status === 409 ? 'Ya existe un registro con esos datos.'
      : 'No se pudo completar la acción. Revisa los datos e inténtalo nuevamente.';
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
        this.irAlInicioPorRol();
      },
      error: (err) => {
        this.cargandoLogin = false;
        this.api.clearCredentials();
        this.mostrarError(err);
      }
    });
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
    this.servicios = [];
    this.mesas = [];
    this.reservas = [];
    this.usuarios = [];
    this.seccionActiva = 'dashboard';
    this.loginVisible = false;
    this.router.navigateByUrl('/inicio');
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
      next: (data) => {
        this.servicios = data;
        if (this.modalReservaAbierto) this.actualizarHorarioSeleccionado();
      },
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
        if (this.modalReservaAbierto) this.actualizarHorarioSeleccionado();
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cargarReservas(): void {
    const rol = this.api.currentUser?.rol;
    if (!rol) return;
    const consulta = rol === 'CLIENTE' ? this.api.getMisReservas() : this.api.getReservas();
    consulta.subscribe({
      next: (data) => this.reservas = data,
      error: (err) => this.mostrarError(err)
    });
  }

  cargarUsuarios(): void {
    if (!this.esAdmin()) return;
    this.api.getUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => this.mostrarError(err)
    });
  }

  crearServicio(): void {
    if (!this.esAdmin()) return this.mostrarError('No tienes permiso para modificar los servicios de reserva.');
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
    if (!this.esAdmin()) return this.mostrarError('No tienes permiso para modificar los servicios de reserva.');
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
    if (!this.esEmpleadoOAdmin()) return this.mostrarError('No tienes permiso para gestionar mesas.');
    this.api.crearMesa(this.nuevaMesa).subscribe({
      next: (res) => {
        this.mostrarExito(`Mesa #${res.numeroMesa} registrada.`);
        this.cargarMesas();
        this.modalMesaAbierto = false;
        this.nuevaMesa = { numeroMesa: this.mesasTotales + 1, capacidad: 4, ubicacion: 'Terraza Helarte', estado: 'DISPONIBLE' };
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cambiarEstadoMesa(mesa: Mesa, estado: string): void {
    if (!this.esEmpleadoOAdmin()) return this.mostrarError('No tienes permiso para gestionar mesas.');
    if (!mesa.id) return;
    const etiqueta = estado === 'DISPONIBLE' ? 'ACTIVA' : 'INACTIVA';
    this.api.actualizarMesa(mesa.id, { numeroMesa: mesa.numeroMesa, capacidad: mesa.capacidad, ubicacion: mesa.ubicacion, estado }).subscribe({
      next: (actualizada) => {
        this.mostrarExito(`Mesa #${actualizada.numeroMesa}: ${etiqueta}.`);
        this.cargarMesas();
        if (this.modalReservaAbierto) this.actualizarHorarioSeleccionado();
      },
      error: (err) => this.mostrarError(err)
    });
  }

  eliminarMesa(id: number): void {
    if (!this.esAdmin()) return this.mostrarError('Solo administración puede eliminar mesas.');
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
    if (!this.api.currentUser || !['CLIENTE', 'ADMIN', 'EMPLEADO', 'COLABORADOR'].includes(this.api.currentUser.rol)) return this.mostrarError('Inicia sesión para crear una reserva.');
    if (!this.nuevaReserva.mesaId || !this.mesasParaReserva.some(m => Number(m.id) === Number(this.nuevaReserva.mesaId))) {
      this.mensajeErrorReserva = 'No hay una mesa disponible para la fecha, horario y capacidad seleccionados.';
      return;
    }
    if (this.reservasEnConflicto.length) {
      this.mensajeErrorReserva = 'Ese horario se cruza con otra reserva de esta mesa. Selecciona otro horario.';
      return;
    }
    if (!this.horariosDisponibles.includes(this.nuevaReserva.horaReserva)) {
      this.mensajeErrorReserva = 'Selecciona uno de los horarios disponibles para esta mesa.';
      return;
    }
    this.mensajeErrorReserva = '';
    const payload = { ...this.nuevaReserva, mesaId: Number(this.nuevaReserva.mesaId), servicioId: Number(this.nuevaReserva.servicioId) };
    this.api.crearReserva(payload).subscribe({
      next: (res) => {
        this.mostrarExito(`Reserva confirmada con ticket: ${res.codigoReserva}`);
        this.cargarReservas();
        this.modalReservaAbierto = false;
      },
      error: (err) => {
        this.mensajeErrorReserva = err?.status === 400 || err?.status === 409
          ? 'Ese horario ya no está disponible. Elige otra hora o mesa e inténtalo nuevamente.'
          : 'No se pudo registrar la reserva. Revisa los datos e inténtalo nuevamente.';
        this.mostrarError(err);
      }
    });
  }

  cambiarEstado(id: number, estado: string): void {
    if (!this.esEmpleadoOAdmin()) return this.mostrarError('No tienes permiso para cambiar el estado de reservas.');
    this.api.cambiarEstadoReserva(id, estado).subscribe({
      next: (act) => {
        this.mostrarExito(`Ticket #${act.codigoReserva}: ${act.estado}`);
        this.cargarReservas();
      },
      error: (err) => this.mostrarError(err)
    });
  }

  cancelarReserva(id: number): void {
    if (!this.api.currentUser) return this.mostrarError('Inicia sesión para cancelar una reserva.');
    if (this.esCliente() && !this.reservas.some(r => r.id === id)) return this.mostrarError('No puedes modificar esta reserva.');
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
    if (!this.esAdmin()) return this.mostrarError('Solo administración puede gestionar usuarios.');
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
    if (!this.esAdmin()) return this.mostrarError('Solo administración puede gestionar usuarios.');
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
    if (!this.esAdmin()) return this.mostrarError('Solo administración puede gestionar usuarios.');
    this.usuarioAEditar = { ...u, password: '' };
    this.modalEditarUsuarioAbierto = true;
  }

  guardarEdicionUsuario(): void {
    if (!this.esAdmin()) return this.mostrarError('Solo administración puede gestionar usuarios.');
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

  get usuariosFiltrados(): Usuario[] {
    if (this.seccionActiva === 'empleados') return this.usuarios.filter(u => u.rol === 'EMPLEADO' || u.rol === 'COLABORADOR');
    if (this.seccionActiva === 'clientes') return this.usuarios.filter(u => u.rol === 'CLIENTE');
    return this.usuarios;
  }

  get totalReservas(): number { return this.reservas.length; }
  get reservasPendientes(): number { return this.reservas.filter(r => r.estado === 'PENDIENTE').length; }
  get reservasConfirmadas(): number { return this.reservas.filter(r => r.estado === 'CONFIRMADA' || r.estado === 'ATENDIDA').length; }
  get mesasDisponibles(): number { return this.mesas.filter(m => m.estado === 'DISPONIBLE').length; }
  get mesasTotales(): number { return this.mesas.length; }

  esAdmin(): boolean {
    return this.api.currentUser?.rol === 'ADMIN';
  }

  esEmpleado(): boolean {
    return this.api.currentUser?.rol === 'EMPLEADO' || this.api.currentUser?.rol === 'COLABORADOR';
  }

  esCliente(): boolean {
    return this.api.currentUser?.rol === 'CLIENTE';
  }

  esEmpleadoOAdmin(): boolean {
    const rol = this.api.currentUser?.rol;
    return rol === 'ADMIN' || rol === 'EMPLEADO' || rol === 'COLABORADOR';
  }
}
