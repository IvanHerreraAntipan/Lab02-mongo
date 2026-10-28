// ==========================================
// COLECCIÓN: PRODUCTOS - OPERACIONES CRUD Y AGREGACIONES
// Autor: Adrián
// ==========================================

use ecommerce_db;

print("--- INICIANDO ACTUALIZACIONES (UPDATES) ---");
// 1. UpdateMany: Agregar campo 'precio' base a todos los productos para permitir filtros financieros.
db.productos.updateMany({}, { $set: { precio: 50000 } });

// 2. UpdateMany: Agregar campo 'estado' para gestionar el ciclo de vida del producto en el catálogo.
db.productos.updateMany({}, { $set: { estado: "Activo" } });

// 3. UpdateMany: Modificar el precio aleatoriamente para tener variabilidad en las consultas posteriores.
db.productos.updateMany({ "especificaciones.marca": "Generica" }, { $mul: { precio: 1.25 } });

// 4. UpdateMany: Estandarizar el tipo de dato de peso_kg convirtiéndolo a número (Double) si era string.
db.productos.updateMany({}, [ { $set: { "especificaciones.peso_kg": { $toDouble: "$especificaciones.peso_kg" } } } ]);

// 5. UpdateOne: Actualizar la marca de un producto específico (simulando corrección de digitación).
const prodEjemplo = db.productos.findOne();
db.productos.updateOne({ _id: prodEjemplo._id }, { $set: { "especificaciones.marca": "HP" } });

// 6. UpdateMany: Descontinuar productos que pesen más de 4 kg por altos costos de envío.
db.productos.updateMany({ "especificaciones.peso_kg": { $gt: 4 } }, { $set: { estado: "Descontinuado" } });

// 7. UpdateMany: Añadir una nueva especificación embebida (garantía) a los productos activos.
db.productos.updateMany({ estado: "Activo" }, { $set: { "especificaciones.garantia_meses": 12 } });

// 8. UpdateMany: Reducir el precio en un 10% (liquidación) para productos descontinuados.
db.productos.updateMany({ estado: "Descontinuado" }, { $mul: { precio: 0.90 } });

// 9. UpdateOne: Modificar el modelo específico de un producto destacado.
db.productos.updateOne({ _id: prodEjemplo._id }, { $set: { "especificaciones.modelo": "Notebook 64-bit Elite" } });

// 10. UpdateMany: Etiquetar productos livianos (menos de 1kg) con un flag de "Envío Express".
db.productos.updateMany({ "especificaciones.peso_kg": { $lt: 1 } }, { $set: { envio_express: true } });


print("--- INICIANDO LECTURAS (READS) ---");
// 1. Filtrar productos por marca específica (búsqueda exacta).
db.productos.find({ "especificaciones.marca": "HP" }).toArray();

// 2. Filtrar productos por rango de precio (mayor a 50,000 y menor a 100,000).
db.productos.find({ precio: { $gt: 50000, $lt: 100000 } }).toArray();

// 3. Buscar productos con un peso menor a 1.5 kg (filtro por subdocumento embebido).
db.productos.find({ "especificaciones.peso_kg": { $lt: 1.5 } }).toArray();

// 4. Listar solo los productos que están descontinuados en el catálogo.
db.productos.find({ estado: "Descontinuado" }).toArray();

// 5. Buscar productos que cuenten con el beneficio de Envío Express (comprobación de existencia de campo).
db.productos.find({ envio_express: { $exists: true } }).toArray();

// 6. Filtrar productos inyectando un límite para paginación (útil para vistas de tienda web, top 5 más caros).
db.productos.find().sort({ precio: -1 }).limit(5).toArray();

// 7. Buscar productos activos que pesen entre 2kg y 3kg (condiciones múltiples).
db.productos.find({ estado: "Activo", "especificaciones.peso_kg": { $gte: 2, $lte: 3 } }).toArray();

// 8. Encontrar productos que no pertenezcan a la marca "Generica" (operador not equal).
db.productos.find({ "especificaciones.marca": { $ne: "Generica" } }).toArray();

// 9. Buscar productos donde la garantía sea exactamente 12 meses.
db.productos.find({ "especificaciones.garantia_meses": 12 }).toArray();

// 10. Listar productos ordenados por peso de forma ascendente, excluyendo los descontinuados.
db.productos.find({ estado: { $ne: "Descontinuado" } }).sort({ "especificaciones.peso_kg": 1 }).limit(10).toArray();


print("--- INICIANDO ELIMINACIONES (DELETES) ---");
// Requisito: Eliminar exactamente 50 registros (productos descontinuados o sin stock definitivo).
// Se capturan 50 ObjectIds y se eliminan mediante el operador $in para garantizar la cantidad exacta exigida.
const idsAEliminar = db.productos.find({}).limit(50).map(doc => doc._id);
const resultadoDelete = db.productos.deleteMany({ _id: { $in: idsAEliminar } });
print(`Productos eliminados exitosamente: ${resultadoDelete.deletedCount}`);


print("--- INICIANDO AGREGACIONES (AGGREGATE) ---");
// 1. Calcular el precio promedio, máximo y mínimo de los productos según su estado (Activo vs Descontinuado).
db.productos.aggregate([
  { $group: { _id: "$estado", precio_promedio: { $avg: "$precio" }, precio_max: { $max: "$precio" } } }
]);

// 2. Contar la cantidad total de productos agrupados por marca.
db.productos.aggregate([
  { $group: { _id: "$especificaciones.marca", total_productos: { $sum: 1 } } }
]);

// 3. Desglose técnico: Obtener el peso promedio de los productos según su marca.
db.productos.aggregate([
  { $group: { _id: "$especificaciones.marca", peso_promedio_kg: { $avg: "$especificaciones.peso_kg" } } }
]);

// 4. Identificar las 3 categorías con mayor valor de inventario acumulado (sumando precios base).
db.productos.aggregate([
  { $unwind: "$categorias" },
  { $group: { _id: "$categorias", valor_total_catalogo: { $sum: "$precio" } } },
  { $sort: { valor_total_catalogo: -1 } },
  { $limit: 3 }
]);

// 5. Analizar la distribución de productos con y sin envío express.
db.productos.aggregate([
  { $group: { _id: "$envio_express", cantidad: { $sum: 1 } } }
]);

// 6. Agrupar productos por proveedor y calcular cuántos productos ofrece cada uno.
db.productos.aggregate([
  { $unwind: "$proveedores" },
  { $group: { _id: "$proveedores", total_productos_proveedor: { $sum: 1 } } }
]);

// 7. Filtrar productos activos y luego calcular su precio promedio.
db.productos.aggregate([
  { $match: { estado: "Activo" } },
  { $group: { _id: null, promedio_activos: { $avg: "$precio" } } }
]);

// 8. Crear un inventario proyectado incrementando el precio base en un 19% (simulación de IVA).
db.productos.aggregate([
  { $project: { _id: 1, marca: "$especificaciones.marca", precio_con_iva: { $multiply: ["$precio", 1.19] } } },
  { $limit: 5 }
]);

// 9. Agrupar productos por marca y crear un arreglo con todos los modelos disponibles por marca.
db.productos.aggregate([
  { $group: { _id: "$especificaciones.marca", modelos_disponibles: { $push: "$especificaciones.modelo" } } }
]);

// 10. Calcular el porcentaje o proporción de productos pesados (más de 3kg) frente al resto.
db.productos.aggregate([
  {
    $facet: {
      "pesados": [ { $match: { "especificaciones.peso_kg": { $gt: 3 } } }, { $count: "total" } ],
      "livianos": [ { $match: { "especificaciones.peso_kg": { $lte: 3 } } }, { $count: "total" } ]
    }
  }
]);