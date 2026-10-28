
// =====================================================================
// ARCHIVO: consultas_ordenes_compra.js
// =====================================================================

// ==========================================
// 1. CONSULTAS DE LECTURA (READ)
// ==========================================

// 1. Buscar una orden de compra por su ID
db.ordenes_compra.findOne({
  _id: ObjectId("6adfc26dfdfbc72290ac0b6c")
});

// 2. Buscar ordenes de un proveedor especifico
db.ordenes_compra.find({
  proveedor: ObjectId("6adfc26bfdfbc72290abffb4")
}).pretty();

// 3. Buscar ordenes emitidas desde el 15 de octubre
db.ordenes_compra.find({
  fecha_emision: {
    $gte: ISODate("2026-10-15T00:00:00Z")
  }
}).pretty();

// 4. Buscar ordenes emitidas antes del 20 de octubre
db.ordenes_compra.find({
  fecha_emision: {
    $lt: ISODate("2026-10-20T00:00:00Z")
  }
}).pretty();

// 5. Buscar ordenes con mas de 50 unidades
db.ordenes_compra.find({
  "detalle.cantidad": { $gt: 50 }
}).pretty();

// 6. Buscar ordenes con menos de 20 unidades
db.ordenes_compra.find({
  "detalle.cantidad": { $lt: 20 }
}).pretty();

// 7. Buscar ordenes con costo unitario mayor a $50.000
db.ordenes_compra.find({
  "detalle.costo_unitario": { $gt: 50000 }
}).pretty();

// 8. Buscar ordenes con costo unitario menor a $20.000
db.ordenes_compra.find({
  "detalle.costo_unitario": { $lt: 20000 }
}).pretty();

// 9. Buscar ordenes con cantidades entre 30 y 50
db.ordenes_compra.find({
  detalle: {
    $elemMatch: {
      cantidad: { $gte: 30, $lte: 50 }
    }
  }
}).pretty();

// 10. Buscar ordenes sin estado de recepcion
db.ordenes_compra.find({
  estado: { $exists: false }
}).pretty();


// ==========================================
// 2. ACTUALIZACIONES (UPDATE)
// ==========================================

// 1. Cambiar una orden a estado pendiente
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b6c") },
  { $set: { estado: "pendiente" } }
);

// 2. Cambiar una orden a estado despachada
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b6d") },
  { $set: { estado: "despachada" } }
);

// 3. Marcar una orden como recibida en bodega
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b73") },
  { $set: { estado: "recibida en bodega" } }
);

// 4. Marcar una orden como en revision
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b74") },
  { $set: { estado: "en revision" } }
);

// 5. Cambiar la cantidad solicitada a 60 unidades
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b77") },
  { $set: { "detalle.0.cantidad": 60 } }
);

// 6. Aumentar la cantidad solicitada en 5 unidades
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b78") },
  { $inc: { "detalle.0.cantidad": 5 } }
);

// 7. Cambiar el costo unitario a $30.000
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b7e") },
  { $set: { "detalle.0.costo_unitario": 30000 } }
);

// 8. Agregar una observacion de entrega
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b7f") },
  { $set: { observacion: "Entrega pendiente" } }
);

// 9. Registrar una prioridad alta
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b84") },
  { $set: { prioridad: "alta" } }
);

// 10. Registrar la fecha de recepcion
db.ordenes_compra.updateOne(
  { _id: ObjectId("6adfc26dfdfbc72290ac0b85") },
  { $set: { fecha_recepcion: new Date() } }
);

// ==========================================
// 3. CONSULTAS DE AGREGACION (AGGREGATE)
// ==========================================

// 1. Contar las ordenes por proveedor
db.ordenes_compra.aggregate([
  {
    $group: {
      _id: "$proveedor",
      totalOrdenes: { $sum: 1 }
    }
  }
]);

// 2. Calcular el total de unidades compradas
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      totalUnidades: { $sum: "$detalle.cantidad" }
    }
  }
]);

// 3. Calcular el promedio de unidades solicitadas
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      promedioCantidad: { $avg: "$detalle.cantidad" }
    }
  }
]);

// 4. Calcular el costo unitario promedio
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      costoPromedio: { $avg: "$detalle.costo_unitario" }
    }
  }
]);

// 5. Obtener el costo unitario mas alto
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      costoMaximo: { $max: "$detalle.costo_unitario" }
    }
  }
]);

// 6. Obtener el costo unitario mas bajo
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      costoMinimo: { $min: "$detalle.costo_unitario" }
    }
  }
]);

// 7. Calcular el gasto total por proveedor
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: "$proveedor",
      gastoTotal: {
        $sum: {
          $multiply: [
            "$detalle.cantidad",
            "$detalle.costo_unitario"
          ]
        }
      }
    }
  }
]);

// 8. Calcular las unidades compradas por mes
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: {
        anio: { $year: "$fecha_emision" },
        mes: { $month: "$fecha_emision" }
      },
      totalUnidades: { $sum: "$detalle.cantidad" }
    }
  }
]);

// 9. Calcular el gasto total de cada orden
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: "$_id",
      totalCompra: {
        $sum: {
          $multiply: [
            "$detalle.cantidad",
            "$detalle.costo_unitario"
          ]
        }
      }
    }
  }
]);

// 10. Calcular el costo promedio por orden
db.ordenes_compra.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: "$_id",
      totalCompra: {
        $sum: {
          $multiply: [
            "$detalle.cantidad",
            "$detalle.costo_unitario"
          ]
        }
      }
    }
  },
  {
    $group: {
      _id: null,
      costoPromedioOrden: { $avg: "$totalCompra" }
    }
  }
]);


// ==========================================
// 4. ELIMINACIONES (DELETE)
// ==========================================

// 1. Contar las ordenes rechazadas o duplicadas
db.ordenes_compra.countDocuments({
  $or: [
    { estado: "rechazada" },
    { duplicado: true }
  ]
});

// 2. Buscar las ordenes rechazadas o duplicadas
db.ordenes_compra.find({
  $or: [
    { estado: "rechazada" },
    { duplicado: true }
  ]
}).limit(50).pretty();

// 3. Eliminar 50 ordenes previamente verificadas
db.ordenes_compra.deleteMany({
  _id: {
    $in: [
      // Insertar aqui los 50 ObjectId
    ]
  },
  $or: [
    { estado: "rechazada" },
    { duplicado: true }
  ]
});

