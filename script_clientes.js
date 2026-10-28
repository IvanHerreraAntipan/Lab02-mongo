// ==========================================
// COLECCIÓN: CLIENTES - OPERACIONES CRUD Y AGREGACIONES
// Autor: Benjamín Lagos
// ==========================================

use lab2mongo;

print("--- INICIANDO ACTUALIZACIONES (UPDATES) ---");
// 1. UpdateMany: Agregar campos 'antiguedad_anios' base y 'estado' a todos los clientes para permitir filtros.
db.clientes.updateMany({}, { $set: { antiguedad_anios: Math.floor(Math.random() * 10) + 1, estado: "activo" } });

// 2. UpdateMany: Cambiar ciudad a Valparaíso a 150 clientes para tener variabilidad geográfica.
const idsValpo = db.clientes.find().limit(150).toArray().map(c => c._id);
db.clientes.updateMany({ _id: { $in: idsValpo } }, { $set: { "direcciones.0.ciudad": "Valparaíso" } });

// 3. UpdateMany: Cambiar ciudad a Viña del Mar a 80 clientes que actualmente son de Santiago.
const idsVina = db.clientes.find({ "direcciones.0.ciudad": "Santiago" }).limit(80).toArray().map(c => c._id);
db.clientes.updateMany({ _id: { $in: idsVina } }, { $set: { "direcciones.0.ciudad": "Viña del Mar" } });

// 4. UpdateMany: Marcar a 60 clientes como inactivos para gestionar su ciclo de vida y posterior purga.
const idsInactivos = db.clientes.find().limit(60).toArray().map(c => c._id);
db.clientes.updateMany({ _id: { $in: idsInactivos } }, { $set: { estado: "inactivo" } });

// 5. UpdateMany: Modificar el banco a Banco Santander para 120 clientes y dar variedad financiera.
const idsSantander = db.clientes.find().limit(120).toArray().map(c => c._id);
db.clientes.updateMany({ _id: { $in: idsSantander } }, { $set: { "metodo_de_pago.0.banco": "Banco Santander" } });

// 6. UpdateOne: Añadir un nuevo método de pago embebido (Falabella) a un cliente de prueba específico.
db.clientes.updateOne({ nombre: "Cliente_Prueba_10" }, { $push: { metodo_de_pago: { tipo: "Tarjeta de Débito", ultimos_digitos: "9999", banco: "Banco Falabella" } } });

// 7. UpdateOne: Corregir el teléfono de contacto de un usuario puntual (simulando corrección de digitación).
db.clientes.updateOne({ nombre: "Cliente_Prueba_5" }, { $set: { telefono: "+56911112222" } });

// 8. UpdateMany: Añadir un nuevo campo de email estandarizado exclusivamente a los clientes activos.
db.clientes.updateMany({ estado: "activo" }, { $set: { email: "contacto@midominio.cl" } });

// 9. UpdateMany: Cambiar el tipo de dirección a Oficina para identificar al segmento B2B (empresas).
const idsOficina = db.clientes.find().limit(40).toArray().map(c => c._id);
db.clientes.updateMany({ _id: { $in: idsOficina } }, { $set: { "direcciones.0.tipo": "Oficina" } });

// 10. UpdateMany: Etiquetar con categoría VIP a clientes leales que tengan más de 8 años de antigüedad.
db.clientes.updateMany({ antiguedad_anios: { $gt: 8 } }, { $set: { categoria: "VIP" } });


print("--- INICIANDO LECTURAS (READS) ---");
// 1. Filtrar clientes por ciudad específica dentro del arreglo embebido (búsqueda exacta).
db.clientes.find({ "direcciones.ciudad": "Valparaíso" }).toArray();

// 2. Filtrar solo los clientes que están marcados como inactivos.
db.clientes.find({ estado: "inactivo" }).toArray();

// 3. Buscar clientes que tengan registrado Banco Santander como método de pago.
db.clientes.find({ "metodo_de_pago.banco": "Banco Santander" }).toArray();

// 4. Buscar clientes con una antigüedad mayor a 5 años (filtro relacional).
db.clientes.find({ antiguedad_anios: { $gt: 5 } }).toArray();

// 5. Encontrar al cliente que registró la tarjeta del Banco Falabella (comprobación del push anterior).
db.clientes.find({ "metodo_de_pago.banco": "Banco Falabella" }).toArray();

// 6. Proyección: Listar clientes VIP mostrando solo su nombre y ciudad (ocultando el _id).
db.clientes.find({ categoria: "VIP" }, { _id: 0, nombre: 1, "direcciones.ciudad": 1 }).limit(10).toArray();

// 7. Buscar clientes que pertenezcan a Santiago o Viña del Mar (condiciones múltiples con $in).
db.clientes.find({ "direcciones.ciudad": { $in: ["Santiago", "Viña del Mar"] } }).toArray();

// 8. Búsqueda exacta por número de teléfono para identificación rápida.
db.clientes.find({ telefono: "+56911112222" }).toArray();

// 9. Buscar clientes activos que cuenten con un correo registrado (comprobación de existencia de campo).
db.clientes.find({ estado: "activo", email: { $exists: true } }).toArray();

// 10. Listar los clientes más antiguos de forma descendente inyectando un límite para paginación.
db.clientes.find().sort({ antiguedad_anios: -1 }).limit(5).toArray();


print("--- INICIANDO ELIMINACIONES (DELETES) ---");
// Requisito: Eliminar exactamente 50 registros (cuentas inactivas por largo tiempo).
// Se capturan 50 ObjectIds de clientes inactivos y se eliminan mediante el operador $in para garantizar la cuota.
const idsAEliminar = db.clientes.find({ estado: "inactivo" }).limit(50).map(doc => doc._id);
const resultadoDelete = db.clientes.deleteMany({ _id: { $in: idsAEliminar } });
print(`Clientes eliminados exitosamente: ${resultadoDelete.deletedCount}`);


print("--- INICIANDO AGREGACIONES (AGGREGATE) ---");
// 1. Agrupar la cantidad total de clientes distribuidos por su ciudad de residencia.
db.clientes.aggregate([
  { $group: { _id: "$direcciones.ciudad", total_clientes: { $sum: 1 } } }
]);

// 2. Contar la cantidad total de clientes agrupados por su banco preferido.
db.clientes.aggregate([
  { $group: { _id: "$metodo_de_pago.banco", total: { $sum: 1 } } }
]);

// 3. Desglose técnico: Obtener el promedio de años de antigüedad según el estado de la cuenta.
db.clientes.aggregate([
  { $group: { _id: "$estado", promedio_anios: { $avg: "$antiguedad_anios" } } }
]);

// 4. Analizar la distribución de envíos a Casa vs Oficina desenrollando el arreglo de direcciones.
db.clientes.aggregate([
  { $unwind: "$direcciones" },
  { $group: { _id: "$direcciones.tipo", cantidad: { $sum: 1 } } }
]);

// 5. Cruzar datos (Left Join): Unir la colección clientes con su historial en la colección pedidos.
db.clientes.aggregate([
  { $lookup: { from: "pedidos", localField: "_id", foreignField: "clientes", as: "historial_pedidos" } },
  { $limit: 3 }
]);

// 6. Filtrar solo a los clientes VIP y luego agruparlos por ciudad.
db.clientes.aggregate([
  { $match: { categoria: "VIP" } },
  { $group: { _id: "$direcciones.ciudad", total_vip: { $sum: 1 } } }
]);

// 7. Desenrollar métodos de pago y agrupar para saber cuántos usan Tarjeta de Crédito vs Débito.
db.clientes.aggregate([
  { $unwind: "$metodo_de_pago" },
  { $group: { _id: "$metodo_de_pago.tipo", total: { $sum: 1 } } }
]);

// 8. Crear un cálculo global sumando todos los años de lealtad (antigüedad) del portafolio completo.
db.clientes.aggregate([
  { $group: { _id: "Total Portafolio", suma_anios: { $sum: "$antiguedad_anios" } } }
]);

// 9. Identificar las 3 ciudades con mayor volumen de clientes ordenándolas de mayor a menor.
db.clientes.aggregate([
  { $group: { _id: "$direcciones.ciudad", total: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 3 }
]);

// 10. Calcular la proporción de clientes activos vs inactivos pero filtrando exclusivamente la ciudad de Santiago.
db.clientes.aggregate([
  { $match: { "direcciones.ciudad": "Santiago" } },
  { $group: { _id: "$estado", total: { $sum: 1 } } }
]);