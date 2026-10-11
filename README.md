# 🍨 Helarte - Frontend (Sistema de Gestión y Reservas 2D)

Aplicación Web Frontend interactiva construida en **Angular 17** con temática **2D Comic / Monochrome Cartoon** ("donde el color lo pones tú"), diseñada para el sistema de reservas y catálogo de helados artesanales **H-elarte**.

---

## 🎨 Características Visuales y Funcionales

* **Estilo Visual 2D Comic**: Bordes gruesos de tinta negra, sombras sólidas en bloque, tipografía de imprenta retro (*Playfair Display* & *Outfit*) y micro-animaciones táctiles.
* **Autenticación Elegante**: Login con soporte de credenciales y accesos directos para demostración rápida (Admin, Empleado, Cliente) y registro público.
* **Panel de Administración Completo**:
  * **Dashboard**: Métricas de reservas, ocupación, ingresos y accesos rápidos.
  * **Reservas**: Creación, filtrado por estado, confirmación y cancelación en tiempo real.
  * **Servicios / Catálogo**: Listado de experiencias con precios, duración y gestión de estado.
  * **Mesas**: Visualización del plano del local, capacidad, ubicación y disponibilidad.
  * **Usuarios**: Gestión de cuentas, roles (ADMIN, EMPLEADO, CLIENTE), activación y edición completa con modal reactivo.

---

## 🛠️ Tecnologías Utilizadas

* **Angular 17** (Standalone Components)
* **TypeScript**
* **SASS / SCSS** (Sistema de diseño comic 2D con variables y mixins)
* **HttpClient** (Consumo de API RESTful con autenticación Basic Auth / BCrypt)

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js** (v18 o superior)
* **NPM** (v9 o superior)
* **Backend de H-elarte** corriendo en `http://localhost:8080`

### 1. Clonar e Instalar dependencias
```bash
git clone https://github.com/AaronDPV/Helarte_FrontEnd.git
cd Helarte_FrontEnd
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm start
# o bien
ng serve
```
Navega a `http://localhost:4200/` en tu navegador.

### 3. Compilación para Producción
```bash
npm run build
```
Los artefactos compilados se generarán en la carpeta `dist/`.

---

## 👥 Credenciales de Prueba

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@helarte.com` | `admin123` |
| **Empleado** | `empleado@helarte.com` | `empleado123` |
| **Cliente** | `cliente@helarte.com` | `cliente123` |
