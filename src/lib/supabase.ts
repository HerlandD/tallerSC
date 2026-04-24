import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Tipos de la base de datos ───────────────────────────────────────────────

/** Roles tal como se almacenan en la columna `rol` de la tabla `usuarios`. */
export type DbRol = 'admin' | 'asesor' | 'jefe' | 'mecanico' | 'cliente'

/** Roles mapeados al formato que usa el app (devueltos por los RPC). */
export type AppRol = 'administrador' | 'asesor' | 'jefe_taller' | 'mecanico' | 'cliente'

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id:         string
          username:   string
          password:   string
          nombre:     string
          rol:        DbRol
          email:      string | null
          telefono:   string | null
          direccion:  string | null
          ci:         string | null
          nit:        string | null
          activo:     boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['usuarios']['Row']>
      }
    }
    Functions: {
      login_usuario: {
        Args: { p_username: string; p_password: string }
        Returns: LoginRpcResult
      }
      registrar_cliente: {
        Args: {
          p_username:  string
          p_password:  string
          p_nombre:    string
          p_ci:        string
          p_nit?:      string
          p_telefono?: string
          p_email?:    string
          p_direccion?: string
        }
        Returns: RegisterRpcResult
      }
    }
  }
}

// ─── Tipos de retorno de los RPC ─────────────────────────────────────────────

export interface RpcUser {
  id:       string
  nombre:   string
  username: string
  rol:      AppRol
  email:    string | null
  telefono: string | null
  ci:       string | null
  activo:   boolean
}

export interface LoginRpcResult {
  success: boolean
  error?:  string
  user?:   RpcUser
}

export interface RegisterRpcResult {
  success: boolean
  error?:  string
  user?:   RpcUser
}

export interface WorkOrderNote {
  id: string; ordenId: string; autorId: string; autorNombre: string;
  nota: string; fecha: string;
}

export interface WorkOrderAttachment {
  id: string; ordenId: string; urlArchivo: string; fecha: string;
}

export interface WorkOrderQC {
  id: string; ordenId: string; inspectorId: string; inspectorNombre: string;
  aprobado: boolean; observaciones?: string; fecha: string;
}

export interface CobDiagnostico {
  id: string; ordenId: string; clienteId: string;
  monto: number; descripcion: string; estado: string; fecha: string;
}
