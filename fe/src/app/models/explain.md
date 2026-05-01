# 📂 `models/` — Interfaces y Tipos de Datos

## ¿Qué es esta carpeta?

Define todas las **interfaces TypeScript** que representan la forma de los datos en la aplicación. Son el "contrato" entre el frontend y el backend: describen exactamente qué campos tiene cada entidad.

## Archivos

| Archivo | Entidad | Descripción |
|---|---|---|
| `auth.model.ts` | Autenticación | Interfaces para login (`LoginData`), registro (`IClientRegister`), respuesta de API (`IApiResponse`), y sesión de usuario (`UserSession`). |
| `user.model.ts` | Usuarios | Modelos de lectura (`IApiUser`, `IApiAdmin`, `IApiClient`), creación (`ICreateAdmin`, `ICreateClient`), y actualización (`IUpdateClient`, `IUpdateAdmin`). Incluye enums `UserRole` y `FiscalCondition`. |
| `product.model.ts` | Productos | Modelo completo con precios (`IApiPrice`), estados (`ProductState`), y soporte para borradores de edición (`IProductDraft`). |
| `category.model.ts` | Categorías | Interfaz para categorías de productos con operaciones CRUD. |
| `order.model.ts` | Pedidos | Modelos de órdenes con estados (`OrderState`), métodos de entrega (`DeliveryMethod`), métodos de pago (`PaymentMethod`), y líneas de pedido (`IApiOrderLine`). |
| `cart.model.ts` | Carrito | Interfaz `ICartItem` para los ítems del carrito de compras. |
| `photo.model.ts` | Fotos | Interfaces para fotos de productos (`IApiProductPhoto`) y fotos de usuarios (`IApiUserPhoto`). |
| `pagination.model.ts` | Paginación | Interfaz genérica para respuestas paginadas de la API. |

## Patrones de diseño

- **Modelos separados por operación**: Cada entidad tiene interfaces para lectura (`IApi*`), creación (`ICreate*`), y actualización (`IUpdate*`).
- **Uso de `Omit` y `Partial`**: Los tipos de creación/actualización derivan del modelo base, excluyendo campos automáticos (id, fechas).
- **Enums en español**: Los valores de enums como `OrderState` y `FiscalCondition` están en español, coincidiendo con lo que muestra la UI.
