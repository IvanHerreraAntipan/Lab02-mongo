// =============================================================================
// ARCHIVO: consultas_stock.js
// AUTOR: Benjamín Díaz
// COLECCIÓN: Stock (E-commerce)
// DESCRIPCIÓN: Script con las 10 lecturas, 10 actualizaciones, 50 eliminaciones
//              y 10 agregaciones adaptado al esquema real de la base de datos lab2mongo.
// =============================================================================

// Seleccionar la base de datos
use lab2mongo;

// =============================================================================
// 1. CONSULTAS DE LECTURA (READ - 10 CONSULTAS)
// =============================================================================

// 1. Búsqueda de un documento de inventario específico por su _id (obtenido de la base de datos)
db.stock.findOne({ _id: ObjectId('6adfc26dfdfbc72290ac0783') });

// 2. Consultar productos con stock crítico (variaciones con menos de 10 unidades disponibles)
db.stock.find({ "variaciones.cantidad_disponible": { $lt: 10 } }).pretty();

// 3. Buscar stock asociado a un producto referenciado específico mediante su ObjectId
db.stock.find({ "productos": ObjectId('6adfc26bfdfbc72290ac058f') }).pretty();

// 4. Filtrar inventarios que posean la variante de color 'Negro' con proyección de campos
db.stock.find(
  { "variaciones.color": "Negro" },
  { _id: 0, productos: 1, variaciones: 1 }
).pretty();

// 5. Filtrar inventarios que posean la variante de color 'Blanco' con existencia mayor a 15 unidades
db.stock.find({
  "variaciones": {
    $elemMatch: { color: "Blanco", cantidad_disponible: { $gt: 15 } }
  }
}).pretty();

// 6. Consultar inventarios que cuenten con stock disponible en un rango medio (entre 20 y 50 unidades)
db.stock.find({
  "variaciones.cantidad_disponible": { $gte: 20, $lte: 50 }
}).pretty();

// 7. Buscar productos que incluyan colores específicos admitidos mediante el operador $in
db.stock.find({
  "variaciones.color": { $in: ["Negro", "Plata", "Gris Oscuro"] }
}).pretty();

// 8. Consultar documentos de inventario que posean eventos registrados en el arreglo embebido movimientos
db.stock.find({ "movimientos": { $exists: true } }).pretty();

// 9. Consultar documentos ordenados de forma descendente por identificador con límite de visualización
db.stock.find({}).sort({ _id: -1 }).limit(5).pretty();

// 10. Proyección simple para auditar únicamente las variaciones existentes sin exponer identificadores
db.stock.find({}, { _id: 0, "variaciones.color": 1, "variaciones.cantidad_disponible": 1 }).limit(5).pretty();


// =============================================================================
// 2. ACTUALIZACIONES (UPDATE - 10 OPERACIONES)
// =============================================================================

// 1. Registrar entrada de mercancía: añadir movimiento con $push e incrementar existencias con $inc
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783') },
  {
    $push: {
      movimientos: {
        tipo: "entrada",
        cantidad: 50,
        fecha: new Date(),
        motivo: "Recepción de orden de compra"
      }
    },
    $inc: { "variaciones.0.cantidad_disponible": 50 }
  }
);

// 2. Registrar salida por despacho: registrar evento en movimientos y decrementar stock ($inc negativo)
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783') },
  {
    $push: {
      movimientos: {
        tipo: "salida",
        cantidad: 5,
        fecha: new Date(),
        motivo: "Despacho de pedido"
      }
    },
    $inc: { "variaciones.0.cantidad_disponible": -5 }
  }
);

// 3. Registrar merma o pérdida de inventario por producto dañado
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783') },
  {
    $push: {
      movimientos: {
        tipo: "merma",
        cantidad: 2,
        fecha: new Date(),
        motivo: "Artículo dañado en bodega"
      }
    },
    $inc: { "variaciones.0.cantidad_disponible": -2 }
  }
);

// 4. Agregar una nueva variación de color al inventario con $push
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783') },
  {
    $push: {
      variaciones: { color: "Azul Medianoche", cantidad_disponible: 25 }
    }
  }
);

// 5. Modificar la cantidad de una variación ubicándola por su color mediante el operador posicional $
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783'), "variaciones.color": "Blanco" },
  { $set: { "variaciones.$.cantidad_disponible": 30 } }
);

// 6. Asignar bandera de stock crítico a documentos con existencias inferiores a 5 unidades
db.stock.updateMany(
  { "variaciones.cantidad_disponible": { $lt: 5 } },
  { $set: { alerta_reposicion: true } }
);

// 7. Desactivar bandera de stock crítico para inventarios con existencias seguras (>= 15)
db.stock.updateMany(
  { "variaciones.cantidad_disponible": { $gte: 15 } },
  { $set: { alerta_reposicion: false } }
);

// 8. Registrar marca de tiempo de última auditoría de stock mediante $currentDate
db.stock.updateMany(
  {},
  { $currentDate: { ultima_auditoria: true } }
);

// 9. Asignar bodega de almacenamiento por defecto a los documentos que no posean la propiedad
db.stock.updateMany(
  { bodega: { $exists: false } },
  { $set: { bodega: "Bodega Central Santiago" } }
);

// 10. Incorporar variación sin duplicados mediante $addToSet
db.stock.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0783') },
  {
    $addToSet: {
      variaciones: { color: "Negro Espacial", cantidad_disponible: 10 }
    }
  }
);


// =============================================================================
// 3. ELIMINACIONES (DELETE - PURGA DE 50 REGISTROS)
// =============================================================================

// Eliminación puntual: dar de baja un documento específico que no registre movimientos
db.stock.deleteOne({ movimientos: { $exists: false } });

// Eliminación masiva: depurar exactamente 50 registros antiguos por cumplimiento de ciclo histórico
// Paso 1: Obtener los ObjectIds de los 50 documentos a depurar
const idsBorrar = db.stock.find({}, { _id: 1 }).limit(50).toArray().map(doc => doc._id);

// Paso 2: Ejecutar deleteMany sobre el conjunto seleccionado
db.stock.deleteMany({ _id: { $in: idsBorrar } });


// =============================================================================
// 4. AGREGACIONES (AGGREGATE - 10 PIPELINES)
// =============================================================================

// 1. Calcular stock total consolidado disponible por producto (sumando todas sus variaciones)
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "$productos",
      total_stock: { $sum: "$variaciones.cantidad_disponible" }
    }
  },
  { $sort: { total_stock: -1 } },
  { $limit: 10 }
]);

// 2. Cruce con la colección productos ($lookup) para enriquecer el inventario con marca y modelo
db.stock.aggregate([
  {
    $lookup: {
      from: "productos",
      localField: "productos",
      foreignField: "_id",
      as: "info_producto"
    }
  },
  { $unwind: "$info_producto" },
  {
    $project: {
      _id: 1,
      marca: "$info_producto.especificaciones.marca",
      modelo: "$info_producto.especificaciones.modelo",
      variaciones: 1
    }
  },
  { $limit: 5 }
]);

// 3. Identificar productos con stock total crítico consolidado menor a 20 unidades
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "$productos",
      stock_total: { $sum: "$variaciones.cantidad_disponible" }
    }
  },
  { $match: { stock_total: { $lt: 20 } } },
  { $sort: { stock_total: 1 } }
]);

// 4. Estadísticas globales del inventario: promedio, máximo y mínimo de unidades por variación
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "Estadísticas de Stock",
      promedio_unidades: { $avg: "$variaciones.cantidad_disponible" },
      maximo_unidades: { $max: "$variaciones.cantidad_disponible" },
      minimo_unidades: { $min: "$variaciones.cantidad_disponible" },
      total_variaciones_evaluadas: { $sum: 1 }
    }
  }
]);

// 5. Conteo y distribución de existencias agrupadas por color de variación
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "$variaciones.color",
      total_unidades: { $sum: "$variaciones.cantidad_disponible" },
      cantidad_variaciones: { $sum: 1 }
    }
  },
  { $sort: { total_unidades: -1 } }
]);

// 6. Resumen de balance de inventario agrupado por tipo de movimiento (entradas, salidas, mermas)
db.stock.aggregate([
  { $match: { movimientos: { $exists: true } } },
  { $unwind: "$movimientos" },
  {
    $group: {
      _id: "$movimientos.tipo",
      unidades_totales: { $sum: "$movimientos.cantidad" },
      eventos_registrados: { $sum: 1 }
    }
  }
]);

// 7. Agrupar productos según la cantidad de variantes físicas que manejan ($size)
db.stock.aggregate([
  {
    $project: {
      productos: 1,
      cantidad_variantes: { $size: "$variaciones" }
    }
  },
  {
    $group: {
      _id: "$cantidad_variantes",
      total_productos: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);

// 8. Totalizar existencias disponibles clasificadas por bodega física asignada
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "$bodega",
      unidades_totales: { $sum: "$variaciones.cantidad_disponible" }
    }
  }
]);

// 9. Filtrar e identificar artículos que presenten al menos una variación en quiebre (0 unidades)
db.stock.aggregate([
  { $unwind: "$variaciones" },
  { $match: { "variaciones.cantidad_disponible": 0 } },
  {
    $group: {
      _id: "$productos",
      variantes_en_cero: { $sum: 1 }
    }
  }
]);

// 10. Reporte ejecutivo consolidado de inventario general del e-commerce
db.stock.aggregate([
  { $unwind: "$variaciones" },
  {
    $group: {
      _id: "Resumen General",
      unidades_disponibles_global: { $sum: "$variaciones.cantidad_disponible" },
      variaciones_activas: { $sum: 1 }
    }
  }
]);