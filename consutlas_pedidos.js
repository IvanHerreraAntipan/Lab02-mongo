// =====================================================================
// ARCHIVO: consultas_pedidos.js
// AUTOR: Iván Herrera
// COLECCIÓN: Pedidos (E-commerce)
// DESCRIPCIÓN: Script adaptado al esquema real de la base de datos para ejecución manual.
// =====================================================================

// ==========================================
// 1. CONSULTAS DE LECTURA (READ)
// ==========================================

// 1. Buscar un pedido específico por su ID obtenido de la base de datos
db.pedidos.findOne({ _id: ObjectId('6adfc26dfdfbc72290ac0977') });

// 2. Buscar todos los pedidos realizados por un cliente específico (usando el campo real 'clientes')
db.pedidos.find({ clientes: ObjectId('6adfc26bfdfbc72290ac039b') }).pretty();

// 3. Filtrar pedidos emitidos en un rango de fechas específico usando 'fecha_pedido'
db.pedidos.find({ 
  fecha_pedido: { 
    $gte: ISODate("2026-10-01T00:00:00Z"), 
    $lte: ISODate("2026-10-25T23:59:59Z") 
  } 
}).pretty();

// 4. Buscar pedidos que contengan un producto específico dentro del arreglo 'detalle'
db.pedidos.find({ "detalle.producto_id": ObjectId('6adfc26bfdfbc72290ac058f') }).pretty();

// 5. Buscar pedidos donde la cantidad de un producto comprado sea mayor o igual a 3
db.pedidos.find({ "detalle.cantidad": { $gte: 3 } }).pretty();

// 6. Buscar pedidos donde el precio unitario del producto sea mayor a 50000
db.pedidos.find({ "detalle.precio_unitario": { $gte: 50000 } }).pretty();

// 7. Buscar pedidos ordenados por fecha de pedido de forma descendente
db.pedidos.find({}).sort({ fecha_pedido: -1 }).limit(5).pretty();

// 8. Proyección para mostrar únicamente fecha de pedido y el cliente (ocultando el _id)
db.pedidos.find({}, { fecha_pedido: 1, clientes: 1, _id: 0 }).pretty();

// 9. Contar el número total de documentos en la colección pedidos
db.pedidos.countDocuments({});

// 10. Buscar pedidos que tengan más de 0 elementos en su arreglo 'detalle'
db.pedidos.find({ $expr: { $gt: [{ $size: "$detalle" }, 0] } }).pretty();


// ==========================================
// 2. ACTUALIZACIONES (UPDATE)
// ==========================================

// 1. Agregar un campo de estado a un pedido específico
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $set: { estado: "pendiente" } }
);

// 2. Cambiar el estado del pedido a "enviado"
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $set: { estado: "enviado", fecha_actualizacion: new Date() } }
);

// 3. Modificar la cantidad de un producto específico dentro del arreglo 'detalle'
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977'), "detalle.producto_id": ObjectId('6adfc26bfdfbc72290ac058f') },
  { $set: { "detalle.$.cantidad": 5 } }
);

// 4. Modificar el precio unitario dentro del arreglo 'detalle'
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977'), "detalle.producto_id": ObjectId('6adfc26bfdfbc72290ac058f') },
  { $set: { "detalle.$.precio_unitario": 99990 } }
);

// 5. Agregar un nuevo producto al arreglo 'detalle' usando $push
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { 
    $push: { 
      detalle: { 
        producto_id: ObjectId('6adfc26bfdfbc72290ac058f'), 
        cantidad: 1, 
        precio_unitario: 15000 
      } 
    } 
  }
);

// 6. Agregar una nota interna temporal al documento del pedido
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $set: { notas_internas: "Cliente VIP" } }
);

// 7. Remover el campo temporal de notas internas usando $unset
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $unset: { notas_internas: "" } }
);

// 8. Actualizar de forma masiva los pedidos que no tengan estado asignado
db.pedidos.updateMany(
  { estado: { $exists: false } },
  { $set: { estado: "procesando" } }
);

// 9. Añadir un código de seguimiento logístico
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $set: { codigo_seguimiento: "TRK-987654" } }
);

// 10. Registrar fecha de entrega formal
db.pedidos.updateOne(
  { _id: ObjectId('6adfc26dfdfbc72290ac0977') },
  { $set: { estado: "entregado", fecha_entrega: new Date() } }
);


// ==========================================
// 3. CONSULTAS DE AGREGACIÓN (AGGREGATE)
// ==========================================

// 1. Agrupar pedidos por estado y contar cuántos hay en cada uno
db.pedidos.aggregate([
  {
    $group: {
      _id: "$estado",
      cantidadPedidos: { $sum: 1 }
    }
  }
]);

// 2. Calcular el monto total por cada pedido multiplicando cantidad por precio unitario en el arreglo 'detalle'
db.pedidos.aggregate([
  {
    $unwind: "$detalle"
  },
  {
    $group: {
      _id: "$_id",
      totalPedido: { $sum: { $multiply: ["$detalle.cantidad", "$detalle.precio_unitario"] } }
    }
  }
]);

// 3. Obtener el ticket promedio general de compra basado en los ítems de 'detalle'
db.pedidos.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      montoItem: { $sum: { $multiply: ["$detalle.cantidad", "$detalle.precio_unitario"] } },
      totalItems: { $sum: 1 }
    }
  },
  {
    $project: {
      ticketPromedio: { $divide: ["$montoItem", "$totalItems"] }
    }
  }
]);

// 4. Cruce de la colección pedidos con la colección 'clientes' usando el campo real 'clientes' ($lookup)
db.pedidos.aggregate([
  {
    $lookup: {
      from: "clientes",
      localField: "clientes",
      foreignField: "_id",
      as: "informacion_cliente"
    }
  },
  { $limit: 5 }
]);

// 5. Desglosar el arreglo 'detalle' para calcular los productos más vendidos
db.pedidos.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: "$detalle.producto_id",
      unidadesVendidas: { $sum: "$detalle.cantidad" },
      recaudacionTotal: { $sum: { $multiply: ["$detalle.cantidad", "$detalle.precio_unitario"] } }
    }
  },
  { $sort: { unidadesVendidas: -1 } },
  { $limit: 5 }
]);

// 6. Agrupar los pedidos por el ID del cliente para ver cuántos pedidos ha hecho cada uno
db.pedidos.aggregate([
  {
    $group: {
      _id: "$clientes",
      totalPedidosCliente: { $sum: 1 }
    }
  },
  { $sort: { totalPedidosCliente: -1 } }
]);

// 7. Encontrar el precio unitario máximo y mínimo registrado en los detalles de pedidos
db.pedidos.aggregate([
  { $unwind: "$detalle" },
  {
    $group: {
      _id: null,
      precioMaximo: { $max: "$detalle.precio_unitario" },
      precioMinimo: { $min: "$detalle.precio_unitario" }
    }
  }
]);

// 8. Agrupar los pedidos por año y mes usando 'fecha_pedido'
db.pedidos.aggregate([
  {
    $group: {
      _id: { 
        anio: { $year: "$fecha_pedido" }, 
        mes: { $month: "$fecha_pedido" } 
      },
      cantidadPedidosMes: { $sum: 1 }
    }
  },
  { $sort: { "_id.anio": -1, "_id.mes": -1 } }
]);

// 9. Calcular el promedio de productos distintos que contiene el arreglo 'detalle' por pedido
db.pedidos.aggregate([
  {
    $project: {
      numeroItems: { $size: "$detalle" }
    }
  },
  {
    $group: {
      _id: null,
      promedioItemsPorPedido: { $avg: "$numeroItems" }
    }
  }
]);

// 10. Análisis multifacético con $facet para contar estados y total de registros en paralelo
db.pedidos.aggregate([
  {
    $facet: {
      "totalGeneral": [
        { $count: "totalPedidos" }
      ],
      "porEstado": [
        { $group: { _id: "$estado", cuenta: { $sum: 1 } } }
      ]
    }
  }
]);


// ==========================================
// 4. ELIMINACIONES (DELETE)
// ==========================================

// Paso 1: Pre-validación para identificar cuántos documentos cumplen con el criterio de antigüedad
db.pedidos.countDocuments({
  fecha_pedido: { $lt: ISODate("2026-10-07T00:00:00Z") }
});

// Paso 2: Ejecución de la eliminación masiva (purga de 169 registros según criterio de negocio)
db.pedidos.deleteMany({
  fecha_pedido: { $lt: ISODate("2026-10-07T00:00:00Z") }
});

// Paso 3: Verificación posterior para comprobar que no queden registros bajo dicho filtro (debe retornar 0)
db.pedidos.countDocuments({
  fecha_pedido: { $lt: ISODate("2026-10-07T00:00:00Z") }
});