-- Script de migración para añadir el campo paymentMethod a órdenes existentes en MySQL
-- Este script debe ejecutarse en el entorno MySQL actual antes de la migración final a Supabase.

-- 1. Añadir la columna (si no existe)
ALTER TABLE `order` ADD COLUMN `payment_method` VARCHAR(50) DEFAULT 'Transferencia' AFTER `delivery_method`;

-- 2. Asegurar que las órdenes existentes tengan un valor por defecto
UPDATE `order` SET `payment_method` = 'Transferencia' WHERE `payment_method` IS NULL;

-- 3. (Opcional) Si se desea restringir los valores permitidos en MySQL:
-- ALTER TABLE `order` MODIFY COLUMN `payment_method` ENUM('Transferencia', 'Efectivo', 'Tarjeta') NOT NULL DEFAULT 'Transferencia';
