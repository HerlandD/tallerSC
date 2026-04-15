# Configuración de Supabase para TallerPro

## Pasos para configurar la base de datos:

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta y un nuevo proyecto
3. Copia la URL y la API Key (anon key)

### 2. Configurar variables de entorno
En el archivo `.env`:
```
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_api_key_anon_aqui
```

### 3. Crear la tabla de usuarios
1. En el panel de Supabase, ve a "SQL Editor"
2. Ejecuta el script `database-setup.sql`
3. Esto creará la tabla `usuarios` con los datos iniciales

### 4. Usuarios de demostración
- **admin/admin123** - Administrador
- **asesor/asesor123** - Asesor de Servicio  
- **jefe/jefe123** - Jefe de Taller
- **mecanico/mec123** - Mecánico
- **cliente/cliente123** - Cliente

### 5. Probar la aplicación
1. Inicia el servidor de desarrollo: `npm run dev`
2. Prueba el login con las credenciales de demostración
3. Verifica que la autenticación funcione correctamente

## Notas importantes:
- Las contraseñas están en texto plano para demostración
- En producción, implementa hash de contraseñas
- La configuración RLS (Row Level Security) está habilitada
- Los usuarios solo pueden ver/modificar su propio perfil
