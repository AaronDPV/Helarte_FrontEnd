import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { roleRouteGuard } from './role-route.guard';

const screen = (path: string, section: string, roles?: string[]) => ({
  path,
  component: AppComponent,
  data: roles ? { section, roles } : { section },
  ...(roles ? { canActivate: [roleRouteGuard] } : {})
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  screen('inicio', 'dashboard'),
  screen('iniciar-sesion', 'login'),
  screen('cliente/dashboard', 'dashboard', ['CLIENTE']),
  screen('cliente/reservas', 'reservas', ['CLIENTE']),
  screen('cliente/perfil', 'perfil', ['CLIENTE']),

  screen('empleado/dashboard', 'dashboard', ['EMPLEADO', 'COLABORADOR']),
  screen('empleado/reservas', 'reservas', ['EMPLEADO', 'COLABORADOR']),
  screen('empleado/mesas', 'mesas', ['EMPLEADO', 'COLABORADOR']),

  screen('admin/dashboard', 'dashboard', ['ADMIN']),
  screen('admin/reservas', 'reservas', ['ADMIN']),
  screen('admin/servicios', 'servicios', ['ADMIN']),
  screen('admin/mesas', 'mesas', ['ADMIN']),
  screen('admin/usuarios', 'usuarios', ['ADMIN']),
  screen('admin/empleados', 'empleados', ['ADMIN']),
  screen('admin/clientes', 'clientes', ['ADMIN']),

  { path: '**', redirectTo: 'inicio' }
];
