# 🌐 Configuración DNS para Verificación RRSIF (Paso 4.2)

## 📋 **Objetivo**
Configurar un subdominio `verificacion.tu-dominio.com` que permita a los usuarios verificar las facturas generadas por el sistema RRSIF mediante códigos QR.

## 🎯 **¿Por qué es necesario?**
- **Cumplimiento RRSIF**: El Real Decreto 1007/2023 exige que las facturas sean verificables online
- **Códigos QR**: Cada factura debe tener un QR que lleve a una URL de verificación
- **Transparencia**: Los clientes deben poder verificar la autenticidad de sus facturas

## 🔧 **Pasos para Configurar el Subdominio**

### **Paso 1: Configurar en Vercel**

1. **Accede a tu proyecto en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Selecciona tu proyecto `eureka-connect`

2. **Agregar dominio personalizado**
   - Ve a **Settings** → **Domains**
   - Haz clic en **Add Domain**
   - Ingresa: `verificacion.tu-dominio.com`
   - Haz clic en **Add**

3. **Configurar redirección**
   - Vercel te dará una URL de redirección
   - Anota esta URL (ejemplo: `cname.vercel-dns.com`)

### **Paso 2: Configurar DNS en tu Proveedor**

#### **Opción A: Si usas Cloudflare**
1. Accede a tu panel de Cloudflare
2. Selecciona tu dominio
3. Ve a **DNS** → **Records**
4. Crea un nuevo registro:
   - **Type**: `CNAME`
   - **Name**: `verificacion`
   - **Target**: `cname.vercel-dns.com` (la URL que te dio Vercel)
   - **Proxy status**: 🟠 Proxied (naranja)
5. Guarda el registro

#### **Opción B: Si usas otro proveedor DNS**
1. Accede al panel de tu proveedor DNS
2. Busca la sección de **DNS Management** o **Zona DNS**
3. Crea un nuevo registro:
   - **Tipo**: `CNAME`
   - **Nombre**: `verificacion`
   - **Valor**: `cname.vercel-dns.com`
   - **TTL**: `300` (5 minutos)

### **Paso 3: Verificar la Configuración**

1. **Esperar propagación DNS** (5-30 minutos)
2. **Probar el subdominio**:
   ```bash
   # En terminal
   nslookup verificacion.tu-dominio.com
   
   # O en navegador
   https://verificacion.tu-dominio.com
   ```

3. **Verificar en Vercel**:
   - El dominio debe aparecer como "Valid" en el dashboard

## 🛠️ **Implementar la Página de Verificación**

### **Paso 4: Crear la Ruta de Verificación**

1. **Crear archivo de página**:
   ```
   app/verificacion/page.tsx
   ```

2. **Código de la página**:
   ```tsx
   'use client'
   
   import { useState, useEffect } from 'react'
   import { useSearchParams } from 'next/navigation'
   
   export default function VerificacionPage() {
     const searchParams = useSearchParams()
     const [verificacion, setVerificacion] = useState(null)
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState(null)
     
     const hash = searchParams.get('hash')
     const nif = searchParams.get('nif')
     const numero = searchParams.get('numero')
     
     useEffect(() => {
       if (hash && nif && numero) {
         verificarFactura()
       } else {
         setError('Parámetros de verificación incompletos')
         setLoading(false)
       }
     }, [hash, nif, numero])
     
     const verificarFactura = async () => {
       try {
         const response = await fetch(`/api/rrsif/verificar-factura?hash=${hash}&nif=${nif}&numero=${numero}`)
         const data = await response.json()
         
         if (response.ok) {
           setVerificacion(data)
         } else {
           setError(data.error || 'Error verificando factura')
         }
       } catch (err) {
         setError('Error de conexión')
       } finally {
         setLoading(false)
       }
     }
     
     if (loading) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div className="text-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
             <p className="mt-4 text-gray-600">Verificando factura...</p>
           </div>
         </div>
       )
     }
     
     if (error) {
       return (
         <div className="min-h-screen flex items-center justify-center">
           <div className="text-center">
             <div className="text-red-500 text-6xl mb-4">❌</div>
             <h1 className="text-2xl font-bold text-red-600 mb-2">Error de Verificación</h1>
             <p className="text-gray-600">{error}</p>
           </div>
         </div>
       )
     }
     
     return (
       <div className="min-h-screen bg-gray-50 py-12">
         <div className="max-w-2xl mx-auto px-4">
           <div className="bg-white rounded-lg shadow-lg p-8">
             <div className="text-center mb-8">
               <div className="text-green-500 text-6xl mb-4">✅</div>
               <h1 className="text-3xl font-bold text-green-600 mb-2">
                 Factura Verificada
               </h1>
               <p className="text-gray-600">
                 Esta factura ha sido verificada exitosamente
               </p>
             </div>
             
             <div className="space-y-4">
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">Número de Factura:</span>
                 <span>{verificacion.numero}</span>
               </div>
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">Emisor:</span>
                 <span>{verificacion.emisor_nombre}</span>
               </div>
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">NIF Emisor:</span>
                 <span>{verificacion.emisor_nif}</span>
               </div>
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">Receptor:</span>
                 <span>{verificacion.receptor_nombre}</span>
               </div>
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">Fecha:</span>
                 <span>{verificacion.fecha_expedicion}</span>
               </div>
               <div className="flex justify-between py-2 border-b">
                 <span className="font-semibold">Importe Total:</span>
                 <span className="font-bold text-lg">{verificacion.importe_total} €</span>
               </div>
               <div className="flex justify-between py-2">
                 <span className="font-semibold">Hash de Verificación:</span>
                 <span className="font-mono text-sm text-gray-500">{hash}</span>
               </div>
             </div>
             
             <div className="mt-8 text-center">
               <p className="text-sm text-gray-500">
                 Verificación realizada el {new Date().toLocaleString('es-ES')}
               </p>
             </div>
           </div>
         </div>
       </div>
     )
   }
   ```

### **Paso 5: Crear API de Verificación**

1. **Crear archivo de API**:
   ```
   app/api/rrsif/verificar-factura/route.ts
   ```

2. **Código de la API**:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { supabaseAdmin } from '@/lib/supabase-server'
   
   export async function GET(request: NextRequest) {
     try {
       const { searchParams } = new URL(request.url)
       const hash = searchParams.get('hash')
       const nif = searchParams.get('nif')
       const numero = searchParams.get('numero')
       
       if (!hash || !nif || !numero) {
         return NextResponse.json(
           { error: 'Parámetros de verificación requeridos' },
           { status: 400 }
         )
       }
       
       // Buscar la factura en la base de datos
       const { data: factura, error } = await supabaseAdmin
         .from('facturas_rrsif')
         .select('*')
         .eq('hash_registro', hash)
         .eq('nif_emisor', nif)
         .eq('numero', numero)
         .single()
       
       if (error || !factura) {
         return NextResponse.json(
           { error: 'Factura no encontrada o no válida' },
           { status: 404 }
         )
       }
       
       // Verificar que la factura no esté anulada
       if (factura.estado === 'anulada') {
         return NextResponse.json(
           { error: 'Esta factura ha sido anulada' },
           { status: 400 }
         )
       }
       
       return NextResponse.json({
         numero: factura.numero,
         emisor_nombre: factura.nombre_emisor,
         emisor_nif: factura.nif_emisor,
         receptor_nombre: factura.nombre_receptor,
         fecha_expedicion: factura.fecha_expedicion,
         importe_total: factura.importe_total,
         estado: factura.estado,
         hash_registro: factura.hash_registro,
         timestamp: factura.timestamp
       })
       
     } catch (error) {
       console.error('Error verificando factura:', error)
       return NextResponse.json(
         { error: 'Error interno del servidor' },
         { status: 500 }
       )
     }
   }
   ```

## 🔧 **Configurar Variables de Entorno**

Actualiza tu `.env.local` y variables de Vercel:

```env
# URL de verificación (cambiar por tu dominio real)
NEXT_PUBLIC_VERIFICATION_URL=https://verificacion.tu-dominio.com
```

## ✅ **Verificación Final**

1. **Probar la URL de verificación**:
   ```
   https://verificacion.tu-dominio.com?hash=test&nif=12345678A&numero=ERK-0001
   ```

2. **Verificar que los códigos QR funcionen**:
   - Genera una factura con QR
   - Escanea el QR con tu móvil
   - Debe llevarte a la página de verificación

3. **Probar casos de error**:
   - Factura inexistente
   - Parámetros faltantes
   - Factura anulada

## 🚨 **Consideraciones de Seguridad**

1. **Rate Limiting**: Implementa límites de consultas por IP
2. **Logging**: Registra todas las verificaciones
3. **Validación**: Verifica la integridad del hash
4. **HTTPS**: Asegúrate de que el subdominio use HTTPS

## 📱 **Personalización Adicional**

- **Diseño responsive** para móviles
- **Logo de tu empresa** en la página
- **Información de contacto** para soporte
- **Historial de verificaciones** (opcional)

---

## 🎯 **Resultado Esperado**

Al completar estos pasos tendrás:
- ✅ Subdominio `verificacion.tu-dominio.com` funcionando
- ✅ Página de verificación de facturas
- ✅ API para consultar facturas por hash
- ✅ Códigos QR que funcionan correctamente
- ✅ Cumplimiento con normativa RRSIF

¡Tu sistema de facturación estará completamente funcional y cumplirá con la normativa española!
