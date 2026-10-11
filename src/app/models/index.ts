export interface Usuario {
  id?: number;
  user: string;
  email: string;
  password?: string;
  rol: string;
  telefono?: string;
  activo?: boolean;
}

export interface Servicio {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo?: boolean;
}

export interface Mesa {
  id?: number;
  numeroMesa: number;
  capacidad: number;
  ubicacion: string;
  estado: string;
}

export interface ReservaRequest {
  usuarioId?: number;
  mesaId: number;
  servicioId: number;
  fechaReserva: string;
  horaReserva: string;
  cantidadPersonas: number;
  observaciones?: string;
}

export interface ReservaResponse {
  id: number;
  codigoReserva: string;
  usuario: Usuario;
  mesa: Mesa;
  servicio: Servicio;
  fechaReserva: string;
  horaReserva: string;
  cantidadPersonas: number;
  estado: string;
  observaciones?: string;
  fechaCreacion?: string;
}

export interface AuthResponse {
  mensaje: string;
  id?: number;
  user: string;
  email: string;
  rol: string;
}
